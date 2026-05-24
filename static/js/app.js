"use strict";

/**
 * app.js — Lógica frontend do SUP (versão standalone)
 *
 * Este arquivo é utilizado quando index.html referencia scripts externos
 * (templates/index.html simples + static/js/app.js).
 *
 * Para a versão embutida (index.html com JS inline), veja o <script> no final
 * daquele arquivo — o código espelha este, com os mesmos fixes aplicados.
 */

const MAX_HISTORICO = 12;
let _historico = [];
let _respostaAtual = "";
let _streamAtual = null;
let _ultimaPergunta = "";
let _adminOperando = false;

document.addEventListener("DOMContentLoaded", () => {
  configurarMarkdown();
  carregarHistoricoSessao();
  atualizarContador();
  // FIX: chamada direta adicionada — carregarHistoricoSessao só chama atualizarKpis
  // se já existir histórico salvo; sem isso, numa sessão nova os KPIs não são inicializados
  atualizarKpis();
  const campoPergunta = document.getElementById("campo-pergunta");
  campoPergunta.addEventListener("input", atualizarContador);
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

  // FIX: desabilita botão durante validação assíncrona — evita duplo submit
  const btnEntrar = document.getElementById("btn-entrar") || document.querySelector(".btn-primary[onclick*='fazerLogin']");
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
    // FIX: console.warn adicionado — falha silenciosa escondia erros de rede durante
    // o desenvolvimento; warn não bloqueia o fluxo mas deixa rastro para diagnóstico
    console.warn("[SUP] Validação de token falhou por erro de rede. Assumindo token válido.", err);
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
  const btnSair = document.getElementById("btn-sair");
  if (btnSair) btnSair.style.display = "none";
  const btnIndex = document.getElementById("btn-abrir-indexacao");
  if (btnIndex) btnIndex.style.display = "none";
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
  const btnSair = document.getElementById("btn-sair");
  if (btnSair) btnSair.style.display = "inline-block";
  const btnIndex = document.getElementById("btn-abrir-indexacao");
  if (btnIndex) btnIndex.style.display = "inline-block";
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
    _streamAtual = null;
  }

  iniciarLoading();
  const params = new URLSearchParams({ pergunta, token });
  const es = new EventSource(`/consultar/stream?${params}`);
  _streamAtual = es;

  es.onmessage = (evt) => {
    let data;
    try {
      data = JSON.parse(evt.data);
    } catch {
      return;
    }
    if (data.tipo === "resposta") {
      const tempo = Number(data.tempo_resposta_s || 0);
      const modelo = data.modelo_usado || "-";
      _respostaAtual = data.resposta || "";
      finalizarLoading();
      mostrarResposta(_respostaAtual, modelo, tempo);
      adicionarHistorico(pergunta, _respostaAtual, tempo);
      atualizarKpis();
      es.close();
      _streamAtual = null;
      const btnRetry = document.getElementById("btn-retry");
      if (btnRetry) btnRetry.style.display = "none";
    } else if (data.tipo === "erro") {
      finalizarLoading();
      mostrarErro(data.mensagem || "Erro de consulta.");
      const btnRetry = document.getElementById("btn-retry");
      if (btnRetry) btnRetry.style.display = "inline-block";
      es.close();
      _streamAtual = null;
    } else if (data.tipo === "fim") {
      es.close();
      _streamAtual = null;
    }
  };

  es.onerror = () => {
    finalizarLoading();
    mostrarErro("Falha de conexão com o servidor. Confira rede e tente novamente.");
    const btnRetry = document.getElementById("btn-retry");
    if (btnRetry) btnRetry.style.display = "inline-block";
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
}

function finalizarLoading() {
  document.getElementById("btn-consultar").disabled = false;
  document.getElementById("spinner").style.display = "none";
}

// ── Resposta ──────────────────────────────────────────────────────────────────
function mostrarResposta(texto, modelo, tempo) {
  document.getElementById("badge-modelo").textContent = modelo;
  document.getElementById("badge-tempo").textContent = `${Number(tempo).toFixed(2)}s`;
  const bruto = marked.parse(texto || "");
  document.getElementById("conteudo-resposta").innerHTML = DOMPurify.sanitize(bruto);
  document.getElementById("area-resposta").style.display = "block";

  // FIX: null-safe — empty-state não existe na versão embutida do index.html;
  // com querySelector/getElementById sem guarda causava TypeError silencioso
  const emptyState = document.getElementById("empty-state");
  if (emptyState) emptyState.style.display = "none";

  document.getElementById("area-resposta").scrollIntoView({ behavior: "smooth", block: "start" });
}

function esconderResposta() {
  document.getElementById("area-resposta").style.display = "none";
  _respostaAtual = "";
}

function mostrarErro(msg) {
  document.getElementById("mensagem-erro").textContent = msg;
  document.getElementById("area-erro").style.display = "block";
}

// ── Copiar / Baixar ───────────────────────────────────────────────────────────
function copiarResposta() {
  if (!_respostaAtual) return;
  // FIX: usa getElementById com ID explícito em vez de querySelector(".btn-copiar"),
  // que é frágil e sempre retorna o PRIMEIRO elemento com a classe —
  // potencialmente o botão errado caso a ordem do DOM mude
  const btn = document.getElementById("btn-copiar");
  navigator.clipboard.writeText(_respostaAtual).then(() => {
    if (btn) {
      btn.textContent = "✅ Copiado!";
      setTimeout(() => (btn.textContent = "Copiar"), 2000);
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
  const len = document.getElementById("campo-pergunta").value.length;
  document.getElementById("contador-caracteres").textContent = `${len} caracteres`;
}

function preencherSugestao(texto) {
  document.getElementById("campo-pergunta").value = texto;
  atualizarContador();
  document.getElementById("campo-pergunta").focus();
}

function atualizarKpis() {
  const total = _historico.length;
  document.getElementById("kpi-consultas").textContent = String(total);
  if (!total) {
    document.getElementById("kpi-tempo").textContent = "-";
    return;
  }
  const media = _historico.reduce((acc, item) => acc + Number(item.tempo || 0), 0) / total;
  document.getElementById("kpi-tempo").textContent = `${media.toFixed(1)}s`;
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
  sessionStorage.setItem("sup_historico_v2", JSON.stringify(_historico));
}

function carregarHistoricoSessao() {
  const raw = sessionStorage.getItem("sup_historico_v2");
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
  // FIX: atualiza label do botão conforme estado atual
  const btn = document.getElementById("btn-toggle-token");
  const mostrar = input.type === "password";
  input.type = mostrar ? "text" : "password";
  if (btn) btn.textContent = mostrar ? "Ocultar" : "Mostrar";
}

function configurarMarkdown() {
  marked.setOptions({ breaks: true, gfm: true });
}

function _escaparHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    // FIX: aspas simples adicionadas — sem isso, um texto como "ela's" em onclick
    // inline poderia quebrar o atributo HTML e abrir brecha de injeção
    .replace(/'/g, "&#039;");
}

document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key === "Enter") fazerConsulta();
});

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
  const ov = document.getElementById("sidebar-overlay");
  const btn = document.getElementById("btn-sidebar-toggle");
  if (!sb) return;
  const aberto = sb.classList.toggle("open");
  if (ov) ov.classList.toggle("show", aberto);
  if (btn) btn.setAttribute("aria-expanded", aberto ? "true" : "false");
}

function fecharSidebar() {
  const sb = document.getElementById("sidebar");
  const ov = document.getElementById("sidebar-overlay");
  const btn = document.getElementById("btn-sidebar-toggle");
  if (sb) sb.classList.remove("open");
  if (ov) ov.classList.remove("show");
  if (btn) btn.setAttribute("aria-expanded", "false");
}

function _adminUrlsLista() {
  const raw = (document.getElementById("campo-index-urls")?.value || "").trim();
  if (!raw) return [];
  return raw
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.startsWith("http://") || s.startsWith("https://"));
}

function _mostrarMsgAdmin(msg, ok = true) {
  const box = document.getElementById("admin-index-msg");
  if (!box) return;
  box.style.display = "block";
  box.style.border = ok ? "1px solid #b7dfcf" : "1px solid #e7b8c0";
  box.style.background = ok ? "#edf9f3" : "#fdeef1";
  box.style.color = ok ? "#17735b" : "#bf2f45";
  box.style.borderRadius = "10px";
  box.style.padding = ".62rem .72rem";
  box.textContent = msg;
}

function _renderStatusAdmin(data) {
  const box = document.getElementById("admin-index-status");
  if (!box) return;
  if (!data || typeof data !== "object") {
    box.style.display = "none";
    box.textContent = "";
    return;
  }
  box.style.display = "block";
  const linhas = [
    `Status: ${data.status || "-"}`,
    `Chunks: ${data.chunks_totais ?? "-"}`,
    `URLs processadas: ${data.urls_processadas ?? "-"}`,
    `Artigos: ${data.artigos ?? "-"}`,
    `Vídeos: ${data.videos_youtube ?? "-"}`,
    `Pasta saída: ${data.pasta_saida || "-"}`,
    `Pasta chroma: ${data.pasta_chroma || "-"}`,
    `Atualizado: ${data.timestamp || "-"}`,
  ];
  box.textContent = linhas.join("\n");
}

function _setEstadoBotoesIndexacao(disabled) {
  const painel = document.getElementById("painel-indexacao");
  if (!painel) return;
  painel.querySelectorAll("button").forEach((btn) => {
    if (btn.id === "btn-sair" || btn.id === "btn-abrir-indexacao") return;
    btn.disabled = disabled;
  });
}

async function acaoIndexacao(acao) {
  if (_adminOperando) return;
  const token = sessionStorage.getItem("sup_token");
  const senha = (document.getElementById("campo-admin-pin")?.value || "").trim();
  if (!token) {
    sair();
    return;
  }
  if (!/^\d{6}$/.test(senha)) {
    _mostrarMsgAdmin("Informe a senha de administrador com 6 dígitos.", false);
    return;
  }

  const body = { senha_admin: senha, acao };
  if (acao === "artigos_lote" || acao === "videos_lote") {
    const urls = _adminUrlsLista();
    if (!urls.length) {
      _mostrarMsgAdmin("Informe ao menos uma URL válida para o lote.", false);
      return;
    }
    body.urls = urls;
  }
  if (acao === "crawler") {
    const url = (document.getElementById("campo-crawler-url")?.value || "").trim();
    if (!url) {
      _mostrarMsgAdmin("Informe a URL base do crawler.", false);
      return;
    }
    body.url = url;
    body.filtro_path = (document.getElementById("campo-crawler-filtro")?.value || "").trim() || null;
    body.sem_paginacao = !!document.getElementById("check-sem-paginacao")?.checked;
  }
  if (acao === "reindexar") {
    const url = (document.getElementById("campo-reindex-url")?.value || "").trim();
    if (!url) {
      _mostrarMsgAdmin("Informe a URL para reindexar.", false);
      return;
    }
    body.url = url;
  }

  _mostrarMsgAdmin("Executando operação de indexação...");
  _adminOperando = true;
  _setEstadoBotoesIndexacao(true);
  try {
    const res = await fetch("/admin/indexacao", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      _mostrarMsgAdmin(data.detail || "Falha na operação de indexação.", false);
      _renderStatusAdmin(null);
      return;
    }
    _mostrarMsgAdmin(`${data.mensagem} (${data.tempo_s}s)`, true);
    if (acao === "status") {
      _renderStatusAdmin(data.status_base || null);
    }
  } catch (err) {
    _mostrarMsgAdmin("Erro de conexão com a API de indexação.", false);
    _renderStatusAdmin(null);
  } finally {
    _adminOperando = false;
    _setEstadoBotoesIndexacao(false);
  }
}
