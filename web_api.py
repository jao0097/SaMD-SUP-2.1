"""
web_api.py — Camada web do sistema SUP (Dr. Ajuda)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
API FastAPI que expõe o pipeline RAG clínico para profissionais de saúde.

⚠️  USO RESTRITO: apenas profissionais de saúde habilitados.
"""

# ══════════════════════════════════════════════════════════════════════════════
#  IMPORTS
# ══════════════════════════════════════════════════════════════════════════════

import json
import logging
import os
import asyncio
import secrets  # FIX: adicionado para comparação segura de tokens (timing-safe)
import time
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any, AsyncGenerator, Dict, Optional

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.responses import HTMLResponse, JSONResponse, StreamingResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, field_validator
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

# Carrega .env antes de qualquer outra configuração
load_dotenv()

# ══════════════════════════════════════════════════════════════════════════════
#  CONFIGURAÇÃO DE LOG
# ══════════════════════════════════════════════════════════════════════════════

_LOG_FORMAT = os.getenv("LOG_FORMAT", "text").strip().lower()

if _LOG_FORMAT == "json":
    # Formato estruturado para Datadog / plataformas de observabilidade
    import json as _json_module

    class _JsonFormatter(logging.Formatter):
        def format(self, record: logging.LogRecord) -> str:
            log_obj = {
                # FIX: o método utcnow estava deprecado desde Python 3.12
                # Corrigido para datetime.now(timezone.utc) — timezone-aware e sem warning
                "ts": datetime.now(timezone.utc).isoformat(),
                "level": record.levelname,
                "logger": record.name,
                "msg": record.getMessage(),
            }
            if record.exc_info:
                log_obj["exc"] = self.formatException(record.exc_info)
            return _json_module.dumps(log_obj, ensure_ascii=False)

    _handler = logging.StreamHandler()
    _handler.setFormatter(_JsonFormatter())
    logging.root.addHandler(_handler)
    logging.root.setLevel(logging.INFO)
else:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

logger = logging.getLogger("sup.web")

# ══════════════════════════════════════════════════════════════════════════════
#  SENTRY (opcional — só inicializa se SENTRY_DSN estiver definido)
# ══════════════════════════════════════════════════════════════════════════════

_SENTRY_DSN = os.getenv("SENTRY_DSN", "").strip()
if _SENTRY_DSN:
    try:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        from sentry_sdk.integrations.starlette import StarletteIntegration

        sentry_sdk.init(
            dsn=_SENTRY_DSN,
            traces_sample_rate=0.2,
            integrations=[StarletteIntegration(), FastApiIntegration()],
            # Nunca enviar conteúdo de perguntas/respostas ao Sentry
            before_send=lambda event, hint: _sanitize_sentry_event(event),
        )
        logger.info("Sentry inicializado com sucesso.")
    except ImportError:
        logger.warning("sentry-sdk não instalado — monitoramento Sentry desabilitado.")


def _sanitize_sentry_event(event: Dict[str, Any]) -> Dict[str, Any]:
    """Remove dados sensíveis antes de enviar ao Sentry (LGPD)."""
    # Remove corpo de requisições para proteger conteúdo de consultas médicas
    event.pop("request", None)
    return event


# ══════════════════════════════════════════════════════════════════════════════
#  CONFIGURAÇÕES DA API
# ══════════════════════════════════════════════════════════════════════════════

API_VERSION = "1.0.0"

# Token obrigatório em produção — sem valor padrão para forçar configuração explícita
_WEB_TOKEN = os.getenv("WEB_TOKEN", "").strip()
_ADMIN_PIN = os.getenv("ADMIN_PIN", "000000").strip()
if not _WEB_TOKEN:
    logger.critical(
        "WEB_TOKEN não configurado! "
        "Para desenvolvimento, defina WEB_TOKEN=dev-token-local no .env"
    )
    # Não encerra aqui — permite subir para diagnóstico, mas todos os endpoints
    # protegidos retornarão 503 se o token estiver vazio.

# ══════════════════════════════════════════════════════════════════════════════
#  LIFESPAN: inicializa o banco UMA VEZ ao subir o servidor
# ══════════════════════════════════════════════════════════════════════════════

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Inicializa ChromaDB + embeddings via _ensure_db() durante o startup.
    Um único worker Uvicorn — ChromaDB não suporta múltiplos processos.
    """
    logger.info("Inicializando banco vetorial e embeddings... (pode levar ~30s)")
    import super as sup  # importa o módulo RAG

    try:
        sup._ensure_db()  # carrega ChromaDB + SentenceTransformer
        app.state.sup = sup
        logger.info(
            "Base pronta. Chunks disponíveis: %s",
            sup.colecao.count() if sup.colecao else "desconhecido",
        )
    except Exception as exc:
        logger.exception("Falha ao inicializar banco vetorial: %s", exc)
        raise

    yield  # servidor em execução

    # Cleanup (ChromaDB persistente não precisa de flush explícito)
    logger.info("Encerrando servidor SUP.")


# ══════════════════════════════════════════════════════════════════════════════
#  RATE LIMITER
# ══════════════════════════════════════════════════════════════════════════════

limiter = Limiter(key_func=get_remote_address)

# ══════════════════════════════════════════════════════════════════════════════
#  APLICAÇÃO FASTAPI
# ══════════════════════════════════════════════════════════════════════════════

app = FastAPI(
    title="SUP — Sistema de Apoio Clínico Dr. Ajuda",
    description=(
        "API de apoio à decisão clínica baseada em RAG. "
        "⚠️ Uso exclusivo de profissionais de saúde habilitados."
    ),
    version=API_VERSION,
    docs_url=None,   # desabilita Swagger público em produção
    redoc_url=None,
    lifespan=lifespan,
)

# Registra o handler de rate limit
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Semáforo: limita chamadas simultâneas ao Groq para evitar rate limit da API.
# Com 10 usuários e pipeline de ~10-60s cada, 5 slots paralelos é conservador e seguro.
# Aumente para 8 se o plano Groq permitir mais concorrência.
_groq_semaphore = asyncio.Semaphore(5)
_admin_index_lock = asyncio.Lock()

# Templates Jinja2 (pasta templates/ ou fallback inline)
_TEMPLATES_DIR = os.path.join(os.path.dirname(__file__), "templates")
templates = Jinja2Templates(directory=_TEMPLATES_DIR) if os.path.isdir(_TEMPLATES_DIR) else None
_STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
if os.path.isdir(_STATIC_DIR):
    app.mount("/static", StaticFiles(directory=_STATIC_DIR), name="static")

# Montar sistema de administração
_ADMIN_DIST = os.path.join(os.path.dirname(__file__), "admin_dist")
if os.path.isdir(_ADMIN_DIST):
    app.mount("/admin", StaticFiles(directory=_ADMIN_DIST, html=True), name="admin")

# ══════════════════════════════════════════════════════════════════════════════
#  AUTENTICAÇÃO: Bearer Token estático
# ══════════════════════════════════════════════════════════════════════════════

_bearer_scheme = HTTPBearer(auto_error=False)


def _verificar_token(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer_scheme),
) -> None:
    """
    Valida o token Bearer. Retorna 401 se inválido ou ausente.
    Nunca loga o token recebido.

    FIX: usa secrets.compare_digest() em vez de == para comparação em tempo
    constante, prevenindo timing attacks que poderiam revelar o token por
    diferença de tempo de resposta.
    """
    if not _WEB_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Servidor mal configurado: WEB_TOKEN não definido.",
        )
    token = credentials.credentials if credentials else None
    # FIX: comparação timing-safe (evita timing attack via diferença de latência)
    if not token or not secrets.compare_digest(token, _WEB_TOKEN):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de acesso inválido ou ausente. Contate o administrador.",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ══════════════════════════════════════════════════════════════════════════════
#  MODELOS PYDANTIC
# ══════════════════════════════════════════════════════════════════════════════

class ConsultaRequest(BaseModel):
    pergunta: str

    @field_validator("pergunta")
    @classmethod
    def pergunta_nao_vazia(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("A pergunta não pode ser vazia.")
        if len(v) > 4000:
            raise ValueError("Pergunta muito longa (máximo 4000 caracteres).")
        return v


class ConsultaResponse(BaseModel):
    resposta: str
    modelo_usado: str
    tempo_resposta_s: float
    fontes: Optional[list[dict]] = None
    sugestoes: Optional[list[str]] = None


class HealthResponse(BaseModel):
    status: str
    timestamp: str


class AdminIndexRequest(BaseModel):
    senha_admin: str
    acao: str
    url: Optional[str] = None
    urls: Optional[list[str]] = None
    filtro_path: Optional[str] = None
    sem_paginacao: bool = False
    sobrescrever: bool = False

    @field_validator("acao")
    @classmethod
    def validar_acao(cls, v: str) -> str:
        permitido = {
            "status",
            "local",
            "gerar_json_locais",
            "artigos_lote",
            "videos_lote",
            "crawler",
            "reindexar",
            "relatorio",
        }
        v2 = (v or "").strip().lower()
        if v2 not in permitido:
            raise ValueError("Ação administrativa inválida.")
        return v2


# ══════════════════════════════════════════════════════════════════════════════
#  ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@app.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check (sem autenticação)",
    tags=["Infraestrutura"],
)
def health_check() -> HealthResponse:
    """
    Liveness probe — responde sem tocar no banco.
    Usado pelo DigitalOcean App Platform e Docker HEALTHCHECK.
    """
    return HealthResponse(
        status="ok",
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@app.get(
    "/status",
    summary="Estatísticas da base de conhecimento",
    tags=["Infraestrutura"],
    dependencies=[Depends(_verificar_token)],
)
def status_base(request: Request) -> JSONResponse:
    """
    Retorna métricas do banco vetorial. Pode ser lento — não use como health check.
    Requer autenticação Bearer token.
    """
    sup = request.app.state.sup
    try:
        chunks_total = sup.colecao.count() if sup.colecao else 0
    except Exception:
        chunks_total = -1

    # Contagem de URLs processadas (sem logar conteúdo)
    try:
        processadas = sup.carregar_processadas()
        urls_total = len(processadas)
        artigos = sum(1 for u in processadas if "youtube" not in u)
        videos = sum(1 for u in processadas if "youtube" in u)
    except Exception:
        urls_total = artigos = videos = -1

    return JSONResponse({
        "api_version": API_VERSION,
        "status": "online",
        "banco": {
            "pasta_chroma": sup.PASTA_CHROMA,
            "pasta_saida": sup.PASTA_SAIDA,
            "chunks_totais": chunks_total,
            "urls_processadas": urls_total,
            "artigos": artigos,
            "videos_youtube": videos,
        },
        "modelos_groq": {
            "resposta": sup.MODELO_POTENTE,
            "classificacao": sup.MODELO_RAPIDO,
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })


def _validar_admin_pin(pin_recebido: str) -> None:
    if not _ADMIN_PIN:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Servidor mal configurado: ADMIN_PIN não definido.",
        )
    if not pin_recebido or not secrets.compare_digest(pin_recebido, _ADMIN_PIN):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Senha de administrador inválida.",
        )


@app.post(
    "/admin/indexacao",
    summary="Operações administrativas de indexação",
    tags=["Admin"],
    dependencies=[Depends(_verificar_token)],
)
@limiter.limit("5/minute")
async def admin_indexacao(
    request: Request,
    body: AdminIndexRequest,
) -> JSONResponse:
    _validar_admin_pin(body.senha_admin)
    sup = request.app.state.sup
    acao = body.acao

    async with _admin_index_lock:
        t0 = time.time()
        loop = asyncio.get_event_loop()

        status_data: Optional[Dict[str, Any]] = None

        def _run() -> tuple[str, Optional[Dict[str, Any]]]:
            if acao == "status":
                processadas = sup.carregar_processadas()
                chunks_total = sup.colecao.count() if sup.colecao else 0
                artigos = sum(1 for u in processadas if "youtube" not in u)
                videos = sum(1 for u in processadas if "youtube" in u)
                return (
                    "Status da base obtido com sucesso.",
                    {
                        "status": "online",
                        "chunks_totais": chunks_total,
                        "urls_processadas": len(processadas),
                        "artigos": artigos,
                        "videos_youtube": videos,
                        "pasta_saida": sup.PASTA_SAIDA,
                        "pasta_chroma": sup.PASTA_CHROMA,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    },
                )
            if acao == "local":
                sup.pipeline_processar_pasta()
                return "Processamento local concluído.", None
            if acao == "gerar_json_locais":
                sup.pipeline_gerar_json_para_txts_sem_json(
                    sobrescrever_json=bool(body.sobrescrever)
                )
                return "Geração de JSON locais concluída.", None
            if acao == "artigos_lote":
                urls = body.urls or []
                if not urls:
                    raise ValueError("Informe urls para artigos_lote.")
                sup.pipeline_artigos_em_lote(urls)
                return f"Lote de artigos iniciado para {len(urls)} URL(s).", None
            if acao == "videos_lote":
                urls = body.urls or []
                if not urls:
                    raise ValueError("Informe urls para videos_lote.")
                sup.pipeline_videos_em_lote(urls)
                return f"Lote de vídeos iniciado para {len(urls)} URL(s).", None
            if acao == "crawler":
                if not body.url:
                    raise ValueError("Informe url para crawler.")
                sup.pipeline_crawler(
                    body.url,
                    filtro_path=body.filtro_path,
                    sem_paginacao=bool(body.sem_paginacao),
                )
                return "Crawler executado.", None
            if acao == "reindexar":
                if not body.url:
                    raise ValueError("Informe url para reindexar.")
                processadas = sup.carregar_processadas()
                url = sup._normalizar_url_yt(body.url)
                processadas.discard(url)
                with open(sup.ARQUIVO_PROCESSADAS, "w", encoding="utf-8") as f:
                    json.dump(sorted(processadas), f, ensure_ascii=False, indent=2)
                if sup._eh_url_youtube(url):
                    sup.processar_video(url, processadas)
                else:
                    sup.processar_artigo(url, processadas)
                return f"Reindexação concluída para: {url}", None
            if acao == "relatorio":
                sup.relatorio_pasta()
                return "Relatório gerado no log do servidor.", None
            raise ValueError("Ação não implementada.")

        try:
            msg, status_data = await loop.run_in_executor(None, _run)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=str(exc),
            )
        except Exception:
            logger.exception("Erro na operação administrativa de indexação.")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Falha ao executar operação de indexação.",
            )

    return JSONResponse({
        "status": "ok",
        "acao": acao,
        "mensagem": msg,
        "status_base": status_data,
        "tempo_s": round(time.time() - t0, 2),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })


@app.post(
    "/consultar",
    response_model=ConsultaResponse,
    summary="Consulta clínica (Q&A)",
    tags=["Consulta"],
    dependencies=[Depends(_verificar_token)],
)
@limiter.limit("10/minute")
async def consultar(
    request: Request,
    body: ConsultaRequest,
) -> ConsultaResponse:
    """
    Executa o pipeline RAG clínico e retorna a resposta em Markdown.
    - Timeout efetivo: 90s (configurado no Uvicorn)
    - Rate limit: 10 req/min por IP
    - Nunca loga o conteúdo da pergunta ou resposta (LGPD)
    - Semáforo interno: máx. 5 chamadas simultâneas ao Groq
    """
    sup = request.app.state.sup
    ip_addr = get_remote_address(request)

    # Valida que o banco está disponível
    try:
        chunks_disponiveis = sup.colecao.count() if sup.colecao else 0
    except Exception as exc:
        logger.error("Erro ao verificar banco vetorial: %s", type(exc).__name__)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Base de conhecimento indisponível. Tente novamente em instantes.",
        )

    if chunks_disponiveis == 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Base de conhecimento vazia. Indexe conteúdo antes de consultar.",
        )

    # Loga apenas metadados — NUNCA o conteúdo da pergunta
    logger.info(
        "Consulta iniciada | ip=%s | pergunta_chars=%d",
        ip_addr,
        len(body.pergunta),
    )

    t0 = time.time()
    try:
        from functools import partial
        loop = asyncio.get_event_loop()
        # Semáforo: evita sobrecarregar o Groq com mais de 5 chamadas simultâneas.
        # run_in_executor: libera o event loop enquanto o pipeline bloqueante roda
        # na threadpool — outros usuários continuam sendo atendidos durante a espera.
        async with _groq_semaphore:
            resposta_obj = await loop.run_in_executor(
                None,
                partial(
                    sup.pipeline_perguntar,
                    body.pergunta,
                    None, # sessao
                    modo_conversa=None,
                    retornar_objetos=True
                )
            )
    except Exception as exc:
        elapsed = time.time() - t0
        logger.error(
            "Erro no pipeline | ip=%s | elapsed=%.1fs | erro=%s",
            ip_addr,
            elapsed,
            type(exc).__name__,  # nunca expõe detalhes do erro
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Serviço temporariamente indisponível. "
                "O sistema de IA pode estar sobrecarregado — tente novamente em alguns instantes."
            ),
        )

    elapsed = time.time() - t0
    logger.info(
        "Consulta concluída | ip=%s | pergunta_chars=%d | resposta_chars=%d | "
        "tempo=%.1fs | modelo=%s",
        ip_addr,
        len(body.pergunta),
        len(resposta_obj["resposta"]),
        elapsed,
        sup.MODELO_POTENTE,
    )

    return ConsultaResponse(
        resposta=resposta_obj["resposta"],
        modelo_usado=sup.MODELO_POTENTE,
        tempo_resposta_s=round(elapsed, 2),
        fontes=resposta_obj.get("fontes"),
        sugestoes=resposta_obj.get("sugestoes")
    )


@app.get(
    "/consultar/stream",
    summary="Consulta clínica via Server-Sent Events (SSE)",
    tags=["Consulta"],
)
@limiter.limit("10/minute")
async def consultar_stream(
    request: Request,
    pergunta: str,
    token: str,
) -> StreamingResponse:
    """
    Executa o pipeline RAG e transmite a resposta progressivamente via SSE.
    Parâmetros: ?pergunta=<string>&token=<bearer_token>

    Usa run_in_executor + semáforo para não bloquear o event loop durante
    a chamada ao Groq — outros usuários continuam sendo atendidos em paralelo.
    """
    # FIX: comparação timing-safe — previne timing attack via latência de resposta
    if not _WEB_TOKEN or not secrets.compare_digest(token or "", _WEB_TOKEN):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido.",
        )

    pergunta = (pergunta or "").strip()
    if not pergunta:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Pergunta não pode ser vazia.",
        )
    if len(pergunta) > 4000:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Pergunta muito longa (máximo 4000 caracteres).",
        )

    sup = request.app.state.sup
    ip_addr = get_remote_address(request)

    async def _event_generator():
        yield "data: {\"tipo\": \"inicio\"}\n\n"

        t0 = time.time()
        logger.info(
            "SSE consulta iniciada | ip=%s | pergunta_chars=%d",
            ip_addr,
            len(pergunta),
        )

        try:
            from functools import partial
            loop = asyncio.get_event_loop()
            async with _groq_semaphore:
                resposta_obj = await loop.run_in_executor(
                    None,
                    partial(
                        sup.pipeline_perguntar,
                        pergunta,
                        None, # sessao
                        modo_conversa=None,
                        retornar_objetos=True
                    )
                )
            elapsed = time.time() - t0

            logger.info(
                "SSE consulta concluída | ip=%s | tempo=%.1fs | modelo=%s",
                ip_addr,
                elapsed,
                sup.MODELO_POTENTE,
            )

            # Debug estrito
            try:
                debug_fontes = resposta_obj.get("fontes", [])
                debug_sugestoes = resposta_obj.get("sugestoes", [])
                
                payload_dict = {
                    "tipo": "resposta",
                    "resposta": str(resposta_obj.get("resposta") or ""),
                    "modelo_usado": str(sup.MODELO_POTENTE),
                    "tempo_resposta_s": float(resposta_obj.get("tempo_resposta_s") or 0.0),
                    "fontes": [
                        {
                            "id": int(f.get("id") or 0),
                            "titulo": str(f.get("titulo") or ""),
                            "url": str(f.get("url") or ""),
                            "texto": str(f.get("texto") or "")
                        }
                        for f in (debug_fontes if isinstance(debug_fontes, list) else [])
                    ],
                    "sugestoes": [str(s) for s in (debug_sugestoes if isinstance(debug_sugestoes, list) else [])]
                }
                payload = json.dumps(payload_dict, ensure_ascii=False)
            except Exception as e:
                logger.error("Falha ao criar payload SSE: %s", str(e))
                raise

            yield f"data: {payload}\n\n"

        except Exception as exc:
            import traceback
            logger.error("SSE erro | ip=%s | erro=%s | tb=%s", ip_addr, str(exc), traceback.format_exc())
            error_payload = json.dumps({"tipo": "erro", "mensagem": "Erro interno."})
            yield f"data: {error_payload}\n\n"

        yield "data: {\"tipo\": \"fim\"}\n\n"

    return StreamingResponse(
        _event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # desativa buffer no Nginx
        },
    )


@app.get(
    "/",
    summary="Landing page pública",
    tags=["Interface"],
    response_class=HTMLResponse,
)
def landing_page(request: Request) -> HTMLResponse:
    """Serve a landing page pública do sistema."""
    if templates:
        return templates.TemplateResponse("landing.html", {"request": request})
    return HTMLResponse(content=_LANDING_EMBUTIDO, status_code=200)


@app.get(
    "/app",
    summary="Interface web",
    tags=["Interface"],
    response_class=HTMLResponse,
)
def interface_app(request: Request) -> HTMLResponse:
    """
    Serve a interface HTML do sistema SUP.
    A autenticação é feita no lado do cliente via sessionStorage + Bearer token.
    """
    if templates:
        return templates.TemplateResponse("index.html", {"request": request})
    return HTMLResponse(content=_APP_EMBUTIDO, status_code=200)


# ══════════════════════════════════════════════════════════════════════════════
#  TRATAMENTO GLOBAL DE EXCEÇÕES (não expõe stack trace)
# ══════════════════════════════════════════════════════════════════════════════

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content={
            "detail": (
                "Limite de consultas excedido (10 por minuto por IP). "
                "Aguarde antes de tentar novamente."
            )
        },
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Erro não tratado em %s: %s", request.url.path, type(exc).__name__)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Erro interno do servidor. A equipe técnica foi notificada."
        },
    )


# ══════════════════════════════════════════════════════════════════════════════
#  HTML EMBUTIDO (fallback se pasta templates/ não existir)
# ══════════════════════════════════════════════════════════════════════════════

_LANDING_EMBUTIDO = open(
    os.path.join(os.path.dirname(__file__), "templates", "landing.html"),
    encoding="utf-8",
).read() if os.path.exists(
    os.path.join(os.path.dirname(__file__), "templates", "landing.html")
) else """<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>SUP — Apresentacao</title></head>
<body>
<p>⚠️ Landing não encontrada. Crie templates/landing.html.</p>
</body>
</html>"""

_APP_EMBUTIDO = open(
    os.path.join(os.path.dirname(__file__), "templates", "index.html"),
    encoding="utf-8",
).read() if os.path.exists(
    os.path.join(os.path.dirname(__file__), "templates", "index.html")
) else """<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>SUP — Dr. Ajuda</title></head>
<body>
<p>⚠️ App não encontrada. Crie templates/index.html ou execute docker compose.</p>
</body>
</html>"""


# ══════════════════════════════════════════════════════════════════════════════
#  ENTRYPOINT LOCAL
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import uvicorn

    host = os.getenv("WEB_HOST", "0.0.0.0")
    port = int(os.getenv("WEB_PORT", "8000"))
    uvicorn.run(
        "web_api:app",
        host=host,
        port=port,
        workers=1,  # ChromaDB local não suporta múltiplos workers
        timeout_keep_alive=90,
        reload=False,
    )
