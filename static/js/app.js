"use strict";

/**
 * app.js — Lógica frontend do SUP (versão standalone)
 */

const MAX_HISTORICO = 12;
let _historico = [];
let _respostaAtual = "";
let _fontesAtuais = [];
let _streamAtual = null;
let _ultimaPergunta = "";
let _adminOperando = false;

document.addEventListener("DOMContentLoaded", () => {
  configurarMarkdown();
  carregarHistoricoSessao();
  atualizarContador();
  atualizarKpis();

  const campoPergunta = document.getElementById("campo-pergunta");
  campoPergunta.addEventListener("input", atualizarContador);
  campoPergunta.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      fazerConsulta();
    }
  });

  const token = sessionStorage.getItem("sup_token");
  if (token) {
    mostrarApp();
  } else {
    mostrarLogin();
  }
});

// ── Login ────────────────────────────────────────────────────────────────────
async function fazerLogin() {
  const token = document.getElementById("campo-token").value.trim();
  if (!token) return;

  const btnEntrar = document.getElementById("btn-entrar");
  if (btnEntrar) {
    btnEntrar.disabled = true;
    btnEntrar.textContent = "Verificando…";
  }
  document.getElementById("erro-login").style.display = "none";

  try {
    const res = await fetch("/status", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) {
      document.getElementById("erro-login").style.display = "block";
      return;
    }
  } catch (err) {
    console.warn("[SUP] Falha de conexão na validação.", err);
  } finally {
    if (btnEntrar) {
      btnEntrar.disabled = false;
      btnEntrar.textContent = "Entrar";
    }
  }

  sessionStorage.setItem("sup_token", token);
  document.getElementById("erro-login").style.display = "none";
  mostrarApp();
}

function sair() {
  if (_streamAtual) {
    _streamAtual.close();
    _streamAtual = null;
  }
  sessionStorage.removeItem("sup_token");
  document.getElementById("campo-pergunta").value = "";
  _ultimaPergunta = "";
  esconderResposta();
  document.getElementById("btn-sair").style.display = "none";
  document.getElementById("btn-abrir-indexacao").style.display = "none";
  mostrarLogin();
}

function mostrarLogin() {
  document.getElementById("tela-login").style.display = "flex";
  document.getElementById("tela-app").style.display = "none";
  setTimeout(() => document.getElementById("campo-token").focus(), 80);
}

function mostrarApp() {
  document.getElementById("tela-login").style.display = "none";
  document.getElementById("tela-app").style.display = "flex";
  document.getElementById("btn-sair").style.display = "inline-block";
  document.getElementById("btn-abrir-indexacao").style.display = "inline-block";
  setTimeout(() => document.getElementById("campo-pergunta").focus(), 80);
}

// ── Consulta ─────────────────────────────────────────────────────────────────
function fazerConsulta() {
  const token = sessionStorage.getItem("sup_token");
  const pergunta = document.getElementById("campo-pergunta").value.trim();
  if (pergunta.length < 12) {
    mostrarErro("Digite uma consulta clínica mais detalhada (mínimo 12 caracteres).");
    return;
  }
  if (!token) {
    sair();
    return;
  }
  _ultimaPergunta = pergunta;
  if (_streamAtual) {
    _streamAtual.close();
  }

  iniciarLoading();
  const params = new URLSearchParams({ pergunta, token });
  const es = new EventSource(`/consultar/stream?${params}`);
  _streamAtual = es;

  es.onmessage = (evt) => {
    try {
      const data = JSON.parse(evt.data);
      if (data.tipo === "inicio") {
        document.getElementById("loading-texto").textContent = "Gerando resposta...";
      } else if (data.tipo === "resposta") {
        const tempo = Number(data.tempo_resposta_s || 0);
        const modelo = data.modelo_usado || "-";
        _respostaAtual = data.resposta || "";
        _fontesAtuais = data.fontes || [];
        const sugestoes = data.sugestoes || [];

        finalizarLoading();
        mostrarResposta(_respostaAtual, modelo, tempo, sugestoes);
        adicionarHistorico(_ultimaPergunta, _respostaAtual, tempo);
        atualizarKpis();
        es.close();
        _streamAtual = null;
      } else if (data.tipo === "erro") {
        finalizarLoading();
        mostrarErro(data.mensagem || "Erro na consulta.");
        es.close();
        _streamAtual = null;
      } else if (data.tipo === "fim") {
        finalizarLoading();
        es.close();
        _streamAtual = null;
      }
    } catch (err) {
      console.error("[SUP] Erro ao processar mensagem:", err);
    }
  };

  es.onerror = (err) => {
    console.error("[SUP] Erro de conexão SSE:", err);
    finalizarLoading();
    mostrarErro("Erro de conexão. Verifique o servidor.");
    es.close();
    _streamAtual = null;
  };
}

function repetirUltimaConsulta() {
  if (!_ultimaPergunta) return;
  document.getElementById("campo-pergunta").value = _ultimaPergunta;
  atualizarContador();
  fazerConsulta();
}

// ── Loading ───────────────────────────────────────────────────────────────────
function iniciarLoading() {
  esconderResposta();
  document.getElementById("area-erro").style.display = "none";
  document.getElementById("btn-consultar").disabled = true;
  document.getElementById("spinner").style.display = "flex";
  document.getElementById("loading-texto").textContent = "Consultando...";
}

function finalizarLoading() {
  document.getElementById("btn-consultar").disabled = false;
  document.getElementById("spinner").style.display = "none";
}

// ── Resposta ──────────────────────────────────────────────────────────────────
function mostrarResposta(texto, modelo, tempo, sugestoes = []) {
  document.getElementById("badge-modelo").textContent = modelo;
  document.getElementById("badge-tempo").textContent = `${Number(tempo).toFixed(2)}s`;
  
  const textoProcessado = _processarCitacoes(texto);
  const bruto = marked.parse(textoProcessado || "");
  const container = document.getElementById("conteudo-resposta");
  container.innerHTML = DOMPurify.sanitize(bruto);
  
  container.querySelectorAll("a").forEach(a => {
    if (a.href.startsWith("http")) {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    }
  });

  document.getElementById("area-resposta").style.display = "block";
  _renderizarSugestoesDinamicas(sugestoes);

  const emptyState = document.getElementById("empty-state");
  if (emptyState) emptyState.style.display = "none";

  document.getElementById("area-resposta").scrollIntoView({ behavior: "smooth", block: "start" });
}

function _processarCitacoes(texto) {
  if (!texto) return "";
  return texto.replace(/\(Fonte\s*(\d+)(?:,\s*(\d+))?\)/g, (match, n1, n2) => {
    let out = `<span class="fonte-link" data-fonte-id="${n1}">(Fonte ${n1})</span>`;
    if (n2) {
      out += ` <span class="fonte-link" data-fonte-id="${n2}">(Fonte ${n2})</span>`;
    }
    return out;
  });
}

// Event listener delegado para fontes: abre a fonte diretamente ou mostra o tooltip
document.addEventListener("click", (e) => {
  const el = e.target.closest(".fonte-link");
  if (el) {
    const id = parseInt(el.getAttribute("data-fonte-id"), 10);
    if (!isNaN(id)) {
      const fonte = _fontesAtuais.find(f => f.id === id);
      if (fonte && fonte.url) {
        window.open(fonte.url, "_blank", "noopener,noreferrer");
      } else {
        mostrarTooltipFonte(e, id);
      }
    }
  }
});

function mostrarTooltipFonte(event, id) {
  event.preventDefault();
  event.stopPropagation();
  const fonte = _fontesAtuais.find(f => f.id === id);
  if (!fonte) return;

  const tt = document.getElementById("tooltip-fonte");
  const titulo = document.getElementById("tooltip-fonte-titulo");
  const corpo = document.getElementById("tooltip-fonte-corpo");
  const link = document.getElementById("tooltip-fonte-link");

  if (!tt || !titulo || !corpo || !link) return;

  titulo.textContent = `Fonte ${id}: ${fonte.titulo}`;
  corpo.textContent = fonte.texto;
  link.href = fonte.url;
  link.style.display = fonte.url ? "inline-block" : "none";
  link.target = "_blank";

  tt.style.display = "block";
  
  const rect = event.target.getBoundingClientRect();
  const ttRect = tt.getBoundingClientRect();
  let top = rect.bottom + window.scrollY + 10;
  let left = rect.left + window.scrollX - (ttRect.width / 2) + (rect.width / 2);

  if (left < 10) left = 10;
  if (left + ttRect.width > window.innerWidth - 10) left = window.innerWidth - ttRect.width - 10;

  tt.style.top = `${top}px`;
  tt.style.left = `${left}px`;
}

function fecharTooltipFonte() {
  const tt = document.getElementById("tooltip-fonte");
  if (tt) tt.style.display = "none";
}

document.addEventListener("click", (e) => {
  if (!e.target.closest("#tooltip-fonte") && !e.target.closest(".fonte-link")) {
    fecharTooltipFonte();
  }
});

function _renderizarSugestoesDinamicas(sugestoes) {
  const container = document.getElementById("container-proximos-passos");
  const lista = document.getElementById("lista-sugestoes-dinamicas");
  if (!container || !lista) return;

  if (!sugestoes || sugestoes.length === 0) {
    container.style.display = "none";
    return;
  }
  container.style.display = "block";
  lista.innerHTML = sugestoes.map(s => `
    <button class="chip" onclick="preencherSugestao('${s.replace(/'/g, "\\'")}')">${s}</button>
  `).join("");
}

function esconderResposta() {
  document.getElementById("area-resposta").style.display = "none";
  _respostaAtual = "";
}

function mostrarErro(msg) {
  document.getElementById("mensagem-erro").textContent = msg;
  document.getElementById("area-erro").style.display = "block";
}

function copiarResposta() {
  if (!_respostaAtual) return;
  const btn = document.getElementById("btn-copiar");
  navigator.clipboard.writeText(_respostaAtual).then(() => {
    if (btn) {
      btn.textContent = "✅ Copiado!";
      setTimeout(() => (btn.textContent = "📋 Copiar"), 2000);
    }
  });
}

function baixarResposta() {
  if (!_respostaAtual) return;
  const blob = new Blob([_respostaAtual], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `resposta-clinica-${new Date().toISOString().slice(0, 19)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Histórico ─────────────────────────────────────────────────────────────────
function adicionarHistorico(pergunta, resposta, tempo) {
  const ts = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  _historico.unshift({ pergunta, resposta, tempo, ts });
  if (_historico.length > MAX_HISTORICO) _historico.pop();
  salvarHistoricoSessao();
  renderizarHistorico();
}

function renderizarHistorico() {
  const lista = document.getElementById("lista-historico");
  const area = document.getElementById("area-historico");
  if (!lista || !area) return;
  if (_historico.length === 0) {
    area.style.display = "none";
    return;
  }
  area.style.display = "block";
  lista.innerHTML = _historico.map((h, i) => `
    <li class="historico-item" onclick="recuperarHistorico(${i})">
      <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
        ${_escaparHtml(h.pergunta.slice(0, 92))}${h.pergunta.length > 92 ? "..." : ""}
      </span>
      <span class="tempo">${h.ts} | ${h.tempo}s</span>
    </li>`).join("");
}

function recuperarHistorico(idx) {
  const h = _historico[idx];
  if (!h) return;
  document.getElementById("campo-pergunta").value = h.pergunta;
  _respostaAtual = h.resposta;
  mostrarResposta(h.resposta, "cache", Number(h.tempo || 0));
}

function atualizarContador() {
  const campo = document.getElementById("campo-pergunta");
  if (!campo) return;
  const len = campo.value.length;
  const contador = document.getElementById("contador-caracteres");
  if (contador) contador.textContent = `${len} caracteres`;
}

function preencherSugestao(texto) {
  document.getElementById("campo-pergunta").value = texto;
  atualizarContador();
  document.getElementById("campo-pergunta").focus();
}

function atualizarKpis() {
  const total = _historico.length;
  const consultasEl = document.getElementById("kpi-consultas");
  const tempoEl = document.getElementById("kpi-tempo");
  if (consultasEl) consultasEl.textContent = String(total);
  if (!total) {
    if (tempoEl) tempoEl.textContent = "-";
    return;
  }
  const media = _historico.reduce((acc, item) => acc + Number(item.tempo || 0), 0) / total;
  if (tempoEl) tempoEl.textContent = `${media.toFixed(1)}s`;
}

function limparHistorico() {
  _historico = [];
  salvarHistoricoSessao();
  renderizarHistorico();
  atualizarKpis();
}

function exportarHistorico() {
  if (!_historico.length) return;
  const linhas = _historico.map((h, idx) =>
    `#${idx + 1} [${h.ts}] (${h.tempo}s)\nPergunta: ${h.pergunta}\nResposta:\n${h.resposta}\n`
  );
  const blob = new Blob([linhas.join("\n---\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `historico-clinico-${new Date().toISOString().slice(0, 10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

function salvarHistoricoSessao() {
  sessionStorage.setItem("sup_historico_v3", JSON.stringify(_historico));
}

function carregarHistoricoSessao() {
  const raw = sessionStorage.getItem("sup_historico_v3");
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      _historico = parsed.slice(0, MAX_HISTORICO);
      renderizarHistorico();
      atualizarKpis();
    }
  } catch {
    _historico = [];
  }
}

function alternarToken() {
  const input = document.getElementById("campo-token");
  const btn = document.getElementById("btn-toggle-token");
  const mostrar = input.type === "password";
  input.type = mostrar ? "text" : "password";
  if (btn) btn.textContent = mostrar ? "Ocultar" : "Mostrar";
}

function configurarMarkdown() {
  marked.setOptions({ breaks: true, gfm: true });
}

function _escaparHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function abrirPainelIndexacao() {
  const painel = document.getElementById("painel-indexacao");
  if (!painel) return;
  painel.style.display = "block";
  const campo = document.getElementById("campo-admin-pin");
  if (campo) campo.focus();
}

function fecharPainelIndexacao() {
  const painel = document.getElementById("painel-indexacao");
  if (!painel) return;
  painel.style.display = "none";
}

function alternarSidebar() {
  const sb = document.getElementById("sidebar");
  if (!sb) return;
  sb.classList.toggle("aberto");
}

function fecharSidebar() {
  const sb = document.getElementById("sidebar");
  if (sb) sb.classList.remove("aberto");
}

async function acaoIndexacao(acao) {
  if (_adminOperando) return;
  const token = sessionStorage.getItem("sup_token");
  const senha = (document.getElementById("campo-admin-pin")?.value || "").trim();
  if (!token) { sair(); return; }
  if (!/^\d{6}$/.test(senha)) { _mostrarMsgAdmin("Senha de 6 dígitos.", false); return; }

  _mostrarMsgAdmin("Executando operação...");
  _adminOperando = true;
  try {
    const res = await fetch("/admin/indexacao", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ senha_admin: senha, acao }),
    });
    const data = await res.json();
    _mostrarMsgAdmin(data.mensagem || "Operação concluída.", res.ok);
    
    if (acao === "status" && data.status_base) {
      _renderStatusAdmin(data.status_base);
    }
  } catch (err) {
    _mostrarMsgAdmin("Erro de conexão.", false);
  } finally {
    _adminOperando = false;
  }
}

function _renderStatusAdmin(data) {
  const box = document.getElementById("admin-index-msg");
  if (!box) return;
  box.style.display = "block";
  const linhas = [
    `Status: ${data.status || "online"}`,
    `Chunks: ${data.chunks_totais ?? "0"}`,
    `URLs: ${data.urls_processadas ?? "0"}`,
    `Artigos: ${data.artigos ?? "0"}`,
    `Vídeos: ${data.videos_youtube ?? "0"}`,
    `Atualizado: ${new Date(data.timestamp).toLocaleString("pt-BR")}`
  ];
  box.textContent = linhas.join("\n");
  box.style.background = "var(--sf-s)";
  box.style.padding = "1rem";
  box.style.marginTop = "1rem";
  box.style.borderRadius = "8px";
  box.style.fontFamily = "monospace";
  box.style.fontSize = "0.8rem";
  box.style.whiteSpace = "pre-wrap";
}

function _mostrarMsgAdmin(msg, ok = true) {
  const box = document.getElementById("admin-index-msg");
  if (!box) return;
  box.style.display = "block";
  box.textContent = msg;
  box.style.color = ok ? "var(--ok)" : "var(--er)";
}
