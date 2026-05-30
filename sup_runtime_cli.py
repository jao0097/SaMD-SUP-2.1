import json
import re
import sys


def _eh_url(s: str) -> bool:
    return s.startswith(("http://", "https://"))


def _exibir_resultado_avulso(n: int) -> None:
    if n < 0:
        print("   ❌ Falha ao processar.")
    elif n == 0:
        print("   ℹ️  Já estava indexado.")
    else:
        print(f"   ✅ {n} chunks indexados.")


def _rotear_mensagem_conversa(app, msg: str) -> dict:
    msg = (msg or "").strip()
    if not msg:
        return {"acao": "perguntar_clarificacao", "pergunta": "O que você gostaria de fazer?"}
    low = msg.lower().strip()
    if low in ("sair", "exit", "quit", "q"):
        return {"acao": "sair"}
    if low in ("ajuda", "help", "h", "?", "/ajuda", "/help"):
        return {"acao": "ajuda"}

    if not app.GROQ_ENABLED:
        if re.search(r"\bstatus\b|\bestat[ií]stic", low):
            return {"acao": "status"}
        if re.search(r"\breindex", low):
            m = re.search(r"(https?://\S+)", msg)
            return {"acao": "reindexar", "url": (m.group(1) if m else "")}
        if app._parece_youtube(msg):
            return {"acao": "videos_lote", "entradas": [msg]}
        if re.search(r"https?://", msg) and not app._parece_youtube(msg):
            return {"acao": "artigos_lote", "entradas": [msg]}
        if re.search(r"\bcrawl\b|\bvarrer\b|\bcrawlear\b", low):
            m = re.search(r"(https?://\S+)", msg)
            return {
                "acao": "crawl_site",
                "url_listagem": (m.group(1) if m else ""),
                "filtro_path": None,
                "sem_paginacao": False,
            }
        if re.search(r"\blocal\b|\barquivos\b", low):
            return {"acao": "processar_local"}
        return {
            "acao": "perguntar_clarificacao",
            "pergunta": "Configure o GROQ_API_KEY para consulta clínica. Para indexação, cole URLs/IDs.",
        }

    try:
        raw = app.chamar_groq(
            sistema=app.PROMPT_ROUTER_CONVERSA_SISTEMA,
            usuario=f"Mensagem do usuário:\n{msg}\n",
            modelo=app.MODELO_RAPIDO,
            json_mode=True,
        )
        d = json.loads(raw)
        if isinstance(d, dict) and d.get("acao"):
            return d
    except Exception:
        pass

    return {"acao": "consultar", "pergunta_clinica": msg}


def conversa(app) -> None:
    app._intro_conversa()
    while True:
        try:
            msg = input("› ").strip()
        except (EOFError, KeyboardInterrupt):
            print()
            return

        if not msg:
            continue

        low = msg.lower()
        if low in ("/sair", "/quit", "/q", "sair", "exit", "quit"):
            return
        if low in ("/nova", "/limpar", "/reset"):
            app._sessao_conversa_cli.limpar()
            continue

        r = _rotear_mensagem_conversa(app, msg)
        acao = r.get("acao")

        if acao == "sair":
            return
        if acao == "ajuda":
            app._intro_conversa()
            continue
        if acao == "status":
            app.status_indice()
            continue
        if acao == "consultar":
            pergunta = (r.get("pergunta_clinica") or "").strip()
            if not pergunta:
                continue
            resposta = app.pipeline_perguntar(
                pergunta, sessao=app._sessao_conversa_cli, modo_conversa=True
            )
            app._imprimir_resposta_cli(resposta)
            app._sessao_conversa_cli.registrar(pergunta, resposta)
            continue
        if acao == "processar_local":
            app.pipeline_processar_pasta()
            continue
        if acao == "buscar_local":
            consulta = (r.get("consulta") or "").strip()
            if consulta:
                print("  Vou abrir a busca local. Se necessário, cole/ajuste a descrição.")
            app.pipeline_indexar_video_por_nome()
            continue
        if acao == "artigos_lote":
            entradas = r.get("entradas") or []
            if isinstance(entradas, str):
                entradas = [entradas]
            if not entradas:
                entradas = [msg]
            urls = app._resolver_entradas_para_urls_artigos(entradas, run_id="conversa-artigos")
            if not urls:
                print("  Não encontrei URLs de artigos válidas nessa mensagem. Cole links http(s) ou um arquivo .txt.")
                continue
            app.pipeline_artigos_em_lote(urls)
            continue
        if acao == "videos_lote":
            entradas = r.get("entradas") or []
            if isinstance(entradas, str):
                entradas = [entradas]
            if not entradas:
                entradas = [msg]
            urls = app._resolver_entradas_para_urls_video(entradas, run_id="conversa-video")
            if not urls:
                print("  Não encontrei URLs/IDs de YouTube válidos nessa mensagem. Cole um link/ID ou um arquivo .txt.")
                continue
            if len(urls) == 1:
                url = app._normalizar_url_yt(urls[0])
                processadas = app.carregar_processadas()
                print(f"\n  🎬 Indexando vídeo: {url}")
                n = app.processar_video(url, processadas)
                _exibir_resultado_avulso(n)
                print(f"  📦 Total de chunks no banco: {app.colecao.count()}")
            else:
                app.pipeline_videos_em_lote(urls)
            continue
        if acao == "crawl_site":
            url_listagem = (r.get("url_listagem") or "").strip()
            if not url_listagem:
                print("  Qual é a URL base/listagem do site para crawl?")
                continue
            app.pipeline_crawler(
                url_listagem,
                filtro_path=r.get("filtro_path"),
                sem_paginacao=bool(r.get("sem_paginacao", False)),
            )
            continue
        if acao == "reindexar":
            url = (r.get("url") or "").strip()
            if not url:
                print("  Qual URL você quer reindexar?")
                continue
            url = app._normalizar_url_yt(url)
            processadas = app.carregar_processadas()
            processadas.discard(url)
            with open(app.ARQUIVO_PROCESSADAS, "w", encoding="utf-8") as f:
                json.dump(sorted(processadas), f, ensure_ascii=False, indent=2)
            print(f"\n  🔄 Reindexando: {url}")
            if app._eh_url_youtube(url):
                n = app.processar_video(url, processadas)
            elif _eh_url(url):
                n = app.processar_artigo(url, processadas)
            else:
                print("  ❌ URL inválida.")
                continue
            _exibir_resultado_avulso(n)
            print(f"  📦 Total de chunks no banco: {app.colecao.count()}")
            continue
        if acao == "perguntar_clarificacao":
            print(f"  {(r.get('pergunta') or 'Como posso ajudar?').strip()}")
            continue
        print("  Não entendi. Digite 'ajuda' para ver exemplos.")


def run_main(app, argv: list) -> None:
    app._imprimir_status_groq()
    args = argv[1:]

    if not args:
        conversa(app)
        return
    if args[0] in ("-h", "--help", "--ajuda"):
        print(app.__doc__)
        return
    if args[0] in ("--menu", "-m"):
        app.menu()
        return
    if args[0] == "--status":
        app.status_indice()
        return
    if args[0] == "--pergunta":
        resto = list(args[1:])
        once = False
        if "--once" in resto or "-1" in resto:
            once = True
            resto = [a for a in resto if a not in ("--once", "-1")]
        pergunta = " ".join(resto).strip()
        sessao = app.SessaoConsultaCLI()
        if pergunta:
            resposta = app.pipeline_perguntar(pergunta, sessao=sessao, modo_conversa=True)
            app._imprimir_resposta_cli(resposta)
            sessao.registrar(pergunta, resposta)
        if once and pergunta:
            return
        if not pergunta and once:
            sys.exit('  Use: --pergunta "sua consulta clínica aqui"')
        app.loop_consulta_cli(sessao)
        return
    if args[0] in ("--artigo", "--artigos", "--crawl", "--site") or (args and _eh_url(args[0]) and not app._eh_url_youtube(args[0])):
        entradas = args[1:] if args[0] in ("--artigo", "--artigos", "--crawl", "--site") else args
        if not entradas:
            sys.exit("  Use:\n    --artigos \"https://site.com/post-1\" \"https://site.com/post-2\"\n    --artigos lista.txt")
        urls = app._resolver_entradas_para_urls_artigos(entradas, run_id="cli-artigos")
        if not urls:
            sys.exit("  Nenhuma URL de artigo válida encontrada (use http(s):// ou arquivo .txt).")
        app.pipeline_artigos_em_lote(urls)
        return
    if args[0] in ("--video", "--videos"):
        entradas = args[1:]
        if not entradas:
            sys.exit("  Use:\n    --video \"https://youtube.com/watch?v=ID\"\n    --video \"url1\" \"url2\" \"url3\"\n    --video lista.txt")
        urls = app._resolver_entradas_para_urls_video(entradas, run_id="cli-video")
        if not urls:
            sys.exit("  Nenhuma URL/ID de YouTube válida encontrada.")
        if len(urls) == 1:
            url = app._normalizar_url_yt(urls[0])
            processadas = app.carregar_processadas()
            print(f"\n  🎬 Indexando vídeo: {url}")
            n = app.processar_video(url, processadas)
            _exibir_resultado_avulso(n)
            print(f"  📦 Total de chunks no banco: {app.colecao.count()}")
        else:
            app.pipeline_videos_em_lote(urls)
        return
    if args[0] in ("--local", "--pasta", "-p"):
        app.pipeline_processar_pasta()
        return
    if args[0] in ("--gerar-json-locais", "--json-locais"):
        sobrescrever = "--sobrescrever" in args[1:] or "-f" in args[1:]
        app.pipeline_gerar_json_para_txts_sem_json(sobrescrever_json=sobrescrever)
        return
    if args[0] in ("--buscar-local", "--indexar-video"):
        app.pipeline_indexar_video_por_nome()
        return
    if args[0] in ("--relatorio", "--relatório", "--report"):
        app.relatorio_pasta()
        return
    if args[0] == "--reindexar":
        if len(args) < 2:
            sys.exit('  Use: --reindexar "https://..."')
        url = app._normalizar_url_yt(args[1])
        processadas = app.carregar_processadas()
        processadas.discard(url)
        with open(app.ARQUIVO_PROCESSADAS, "w", encoding="utf-8") as f:
            json.dump(sorted(processadas), f, ensure_ascii=False, indent=2)
        print(f"\n  🔄 Reindexando: {url}")
        if app._eh_url_youtube(url):
            n = app.processar_video(url, processadas)
        elif _eh_url(url):
            n = app.processar_artigo(url, processadas)
        else:
            sys.exit(f"  ❌ URL inválida: {url}")
        _exibir_resultado_avulso(n)
        print(f"  📦 Total de chunks no banco: {app.colecao.count()}")
        return
    sys.exit(f"  ❌ Argumento não reconhecido: '{args[0]}'\n  Use --ajuda para ver todas as opções.")
