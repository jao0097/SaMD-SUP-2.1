<<<<<<< HEAD
# SaMD-SUP-2.0
Primeira versão funcional de um sistema RAG focado em auxilio médico
=======
# 🩺 sup — Sistema de Apoio Clínico Dr. Ajuda

> **RAG** (*Retrieval-Augmented Generation*) de apoio à decisão clínica para médicos, construído sobre o conhecimento do canal e site do Dr. Ajuda.

---

## Índice

1. [O que é](#1-o-que-é)
2. [Arquitetura geral](#2-arquitetura-geral)
3. [Pré-requisitos e instalação](#3-pré-requisitos-e-instalação)
4. [Configuração](#4-configuração)
5. [Uso — Consulta clínica](#5-uso--consulta-clínica)
6. [Uso — Indexação de conteúdo](#6-uso--indexação-de-conteúdo)
7. [Manutenção e diagnóstico](#7-manutenção-e-diagnóstico)
8. [Como o código está organizado](#8-como-o-código-está-organizado)
9. [Fluxo interno detalhado](#9-fluxo-interno-detalhado)
10. [Estrutura de arquivos em disco](#10-estrutura-de-arquivos-em-disco)
11. [Schema JSON dos metadados](#11-schema-json-dos-metadados)
12. [Modelos Groq e seus papéis](#12-modelos-groq-e-seus-papéis)
13. [Resiliência e controle de rate-limit](#13-resiliência-e-controle-de-rate-limit)
14. [Boas práticas para a equipe](#14-boas-práticas-para-a-equipe)
15. [Referência completa de variáveis de ambiente](#15-referência-completa-de-variáveis-de-ambiente)

---

## 1. O que é

O `sup` é um sistema de linha de comando que permite ao médico fazer perguntas clínicas em linguagem natural e receber respostas embasadas exclusivamente no conteúdo indexado do Dr. Ajuda — sem alucinação de fontes externas.

### Fontes de conhecimento suportadas

| Fonte | Como entra no sistema |
|---|---|
| **Site / blog** | Crawl automático de toda a listagem de artigos |
| **Artigos avulsos** | URLs individuais ou arquivo `.txt` com uma por linha |
| **YouTube** | Transcrição automática de vídeos (PT, EN) |
| **Arquivos locais** | Pares `.txt` + `.json` salvos em disco |

### Para quem serve cada parte

| Perfil | O que usa |
|---|---|
| **Médico** | `sup` / `sup --pergunta "..."` para consultas clínicas |
| **Equipe de TI / conteúdo** | `sup --crawl`, `--artigos`, `--video`, `--local` para indexar |

> ⚠️ **Aviso legal:** este sistema é de uso exclusivo de profissionais de saúde habilitados. As respostas não substituem o julgamento clínico, o exame físico nem as diretrizes das sociedades médicas.

---

## 2. Arquitetura geral

```
┌─────────────────────────────────────────────────────────────────┐
│                          FASE DE INDEXAÇÃO                      │
│                                                                 │
│   Site/Blog ──► raspar_artigo()  ─────────────────────┐        │
│   YouTube   ──► processar_video() ────────────────┐   │        │
│   Locais    ──► pipeline_processar_pasta() ───┐   │   │        │
│                                              ▼   ▼   ▼        │
│                                       limpar_transcricao()     │
│                                              │                  │
│                                       gerar_metadados()        │
│                                       (Groq llama-3.1-8b)     │
│                                              │                  │
│                                       indexar_conteudo()       │
│                                       (chunking + upsert)      │
│                                              │                  │
│                                       ┌─────▼──────┐           │
│                                       │  ChromaDB  │           │
│                                       │ (vetorial) │           │
│                                       └─────┬──────┘           │
└─────────────────────────────────────────────┼───────────────────┘
                                              │
┌─────────────────────────────────────────────▼───────────────────┐
│                         FASE DE CONSULTA                        │
│                                                                 │
│  Médico digita pergunta                                         │
│         │                                                       │
│         ▼                                                       │
│  _classificar_pergunta()  ◄── lista de títulos da base         │
│  (Groq: tipo = específica / geral / comparativa / fora_escopo) │
│         │                                                       │
│         ▼                                                       │
│  _buscar_chunks()  ◄── busca semântica no ChromaDB             │
│  (com ou sem filtro por fonte, n_chunks conforme tipo)         │
│         │                                                       │
│         ▼                                                       │
│  chamar_groq(PROMPT_RESPOSTA)                                   │
│  (Groq llama-3.3-70b, contexto = chunks + fontes)              │
│         │                                                       │
│         ▼                                                       │
│  Resposta estruturada + aviso médico obrigatório               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Pré-requisitos e instalação

### Python
Requer Python 3.9 ou superior.

### Dependências

```bash
pip install requests beautifulsoup4 chromadb groq \
            sentence-transformers youtube-transcript-api python-dotenv
```

| Pacote | Para que serve |
|---|---|
| `requests` / `beautifulsoup4` | Raspagem de artigos web |
| `chromadb` | Banco de dados vetorial local |
| `sentence-transformers` | Modelo de embeddings (`paraphrase-multilingual-MiniLM-L12-v2`) |
| `groq` | Chamadas à API Groq (metadados, limpeza, resposta) |
| `youtube-transcript-api` | Transcrições automáticas do YouTube |
| `python-dotenv` | Carregamento de variáveis do `.env` |

**Opcional — parser HTML mais rápido:**
```bash
pip install lxml
```

**Opcional — fallback de legendas YouTube via yt-dlp:**
```bash
pip install yt-dlp
```

### Instalação como comando `sup`

```bash
# Crie um alias no seu shell (ex.: ~/.bashrc ou ~/.zshrc)
alias sup="python /caminho/para/super.py"
```

Ou torne o arquivo executável:
```bash
chmod +x super.py
# e coloque no PATH
```

---

## 4. Configuração

Crie um arquivo `.env` na mesma pasta do `super.py`:

```env
# Obrigatório para todos os recursos de IA
GROQ_API_KEY=sua_chave_aqui

# Opcional: múltiplas chaves para rotação automática em rate-limit
GROQ_API_KEY_2=segunda_chave
GROQ_API_KEY_3=terceira_chave

# Pasta onde os arquivos .txt e .json são salvos
# (padrão: ~/Documentos/rag_base)
RAG_PASTA_SAIDA=/media/meu_hd/rag_base

# Pasta do banco ChromaDB
# (padrão: <RAG_PASTA_SAIDA>/chroma_db)
RAG_PASTA_CHROMA=/media/meu_hd/chroma_db
```

> **Múltiplas chaves Groq:** quando há mais de uma chave, o sistema rotaciona automaticamente ao detectar rate-limit em uma delas, sem interromper o processamento.

---

## 5. Uso — Consulta clínica

### Modo conversa (recomendado para médicos)

```bash
sup
```

Abre um chat interativo. Basta digitar a pergunta clínica em linguagem natural:

```
Você: quais os critérios de SIRS e quando considerar sepse?
```

O sistema detecta automaticamente a intenção da mensagem — você não precisa usar comandos específicos. Também aceita URLs e pedidos de indexação diretamente no chat.

### Consulta direta (linha de comando)

```bash
sup --pergunta "condutas para hipertensão resistente em diabético"
sup --pergunta "diagnóstico diferencial de dor torácica com ECG normal"
```

### Menu visual (navegação por números)

```bash
sup --menu
```

---

### Como a resposta é gerada

Toda resposta segue uma estrutura fixa, produzida pelo modelo `llama-3.3-70b-versatile`:

| Seção | Conteúdo |
|---|---|
| 🔍 **Análise da Consulta** | Reenquadramento da pergunta e contexto implícito |
| 🧠 **Síntese Clínica** | Resposta direta com citação `(Fonte N)` a cada dado |
| 🩺 **Raciocínio Diagnóstico / DD** | Hipóteses, critérios, diagnóstico mais provável *(quando aplicável)* |
| 💊 **Conduta Clínica** | Investigação → tratamento (doses das fontes) → monitoramento *(quando aplicável)* |
| ⚠️ **Pontos de Atenção** | Alarmes, contraindicações, interações *(quando aplicável)* |
| 🔎 **Lacunas na Base** | O que as fontes não cobriram *(quando houver)* |
| 📚 **Fontes Consultadas** | Lista numerada: Tipo — Título — URL |

O aviso médico obrigatório é sempre anexado ao final.

---

### Tipos de pergunta e comportamento

O sistema classifica cada pergunta antes de buscar:

| Tipo | Quando | Chunks buscados |
|---|---|---|
| `especifica` | A pergunta corresponde diretamente a um título da base | 4 (filtrado por fonte) |
| `geral` | Tema médico sem correspondência exata | 6 (busca ampla) |
| `comparativa` | Compara ≥ 2 condições, fármacos ou abordagens | 8 (busca ampla) |
| `fora_de_escopo` | Sem relação com medicina | Nenhum — resposta direta |

---

## 6. Uso — Indexação de conteúdo

> Esta seção é para a equipe técnica responsável por alimentar a base.

### 6.1 Crawl de site completo

Descobre e indexa **todos os artigos e vídeos** linkados em uma página de listagem:

```bash
sup --crawl "https://drajuda.com.br/blog"

# Com filtro de path (indexa só URLs que contenham o fragmento)
sup --crawl "https://drajuda.com.br/blog" --filtro "/artigos/"

# Sem seguir paginação (só a primeira página)
sup --crawl "https://drajuda.com.br/blog" --sem-paginacao
```

O crawler:
- Segue links de paginação automaticamente (`próximo`, `/page/2`, `?p=2`, etc.)
- Separa artigos do mesmo domínio de links YouTube
- Pula URLs já indexadas
- Respeita `PAUSA_ENTRE_PAGINAS` entre requisições

### 6.2 Artigos avulsos

```bash
# Uma ou várias URLs direto na linha
sup --artigos "https://site.com/post-1" "https://site.com/post-2"

# Bloco colado (o sistema extrai as URLs automaticamente)
sup --artigos "https://a.com/p1 https://a.com/p2 https://a.com/p3"

# Arquivo .txt com uma URL por linha
sup --artigos lista_de_artigos.txt
```

Com `RAG_ARTIGOS_FETCH_THREADS=4` os downloads são feitos em paralelo.

### 6.3 Vídeos do YouTube

```bash
# URL completa
sup --video "https://youtube.com/watch?v=ID_DO_VIDEO"

# Apenas o ID (11 caracteres)
sup --video ID_DO_VIDEO

# Vários de uma vez
sup --video "url1" "url2" "url3"

# Arquivo .txt com uma entrada por linha
sup --video lista_de_videos.txt
```

O sistema tenta obter a transcrição em `pt`, `pt-BR` e `en` (nessa ordem). Se o YouTube bloquear por IP, use o fallback via yt-dlp:

```env
RAG_YT_DLP_ENABLED=1
RAG_YT_DLP_COOKIES_FILE=/caminho/para/cookies.txt  # opcional
```

### 6.4 Arquivos locais (`.txt` + `.json`)

```bash
sup --local
```

Varre `RAG_PASTA_SAIDA`, processa todos os pares `.txt` + `.json` que ainda não foram indexados (`indexado_chroma: false`) e faz upsert no ChromaDB.

**Agora o `--local` também corrige orphans automaticamente:** se encontrar um `.txt` sem `.json`, gera o JSON na hora (usando Groq se disponível) e prossegue com a indexação.

### 6.5 Preparar arquivos `.txt` sem `.json` (orphans)

Se você tiver arquivos `.txt` avulsos (transcrições coladas, notas, etc.) sem o `.json` companheiro:

```bash
# Gera o par .txt padronizado + .json para todos os orphans
sup --gerar-json-locais

# Regenera mesmo quem já tem .json
sup --gerar-json-locais --sobrescrever
```

Depois de preparar, indexe com `sup --local`.

### 6.6 Reindexar uma URL já processada

Útil quando o conteúdo de uma página foi atualizado:

```bash
sup --reindexar "https://drajuda.com.br/artigo-atualizado"
```

Remove a URL do histórico de processadas e reprocessa do zero.

---

## 7. Manutenção e diagnóstico

### Status da base

```bash
sup --status
```

Exibe: pasta, banco, artigos, vídeos, chunks totais, domínios indexados e data do último catálogo.

### Relatório de orphans e pendentes

```bash
sup --relatorio
```

Mostra um inventário detalhado da pasta:

```
════════════════════════════════════════════════════════════════
  📂 RELATÓRIO DA PASTA: /media/hd/rag_base
════════════════════════════════════════════════════════════════
  Total de .txt encontrados   : 120
  ✅ Já indexados no Chroma   : 110
  ⏳ Com JSON, aguardando     : 5
  ❌ Sem JSON (orphans)       : 5
────────────────────────────────────────────────────────────────

  Arquivos SEM .json — corrija com:  sup --gerar-json-locais

    • transcricao_aula_ecg.txt          45.231 bytes  [texto cru]
    • hipertensao_notas.txt              8.102 bytes  [padrão sistema]
```

### Buscar arquivo local por nome ou tema

```bash
sup --buscar-local
```

Faz busca fuzzy entre os `.txt` da pasta — útil para localizar e reindexar um arquivo específico interativamente.

### Fluxo completo de recuperação de orphans

```bash
sup --relatorio           # 1. identifica o que está faltando
sup --gerar-json-locais   # 2. gera os JSONs (com Groq)
sup --local               # 3. indexa tudo no ChromaDB
sup --relatorio           # 4. confirma que está em dia
```

---

## 8. Como o código está organizado

O `super.py` é um arquivo único dividido em módulos lógicos separados por cabeçalhos:

```
super.py
│
├── PROMPTS GROQ              Todos os prompts centralizados como constantes
│   ├── PROMPT_METADADOS_*    Para geração de metadados semânticos
│   ├── PROMPT_LIMPEZA_*      Para limpeza de transcrições
│   ├── PROMPT_CLASSIFICADOR_* Para classificar tipo de pergunta
│   ├── PROMPT_ROUTER_*       Para o modo conversa (roteador de intenção)
│   └── PROMPT_RESPOSTA_*     Para a resposta clínica final
│
├── CONFIGURAÇÕES             Leitura de variáveis de ambiente e defaults
│
├── GROQ — POOL DE CHAVES     _GroqKeyPool: rotação thread-safe de chaves
│   └── chamar_groq()         Ponto único de entrada para todas as chamadas IA
│
├── INICIALIZAÇÃO LAZY        _ensure_db(): ChromaDB, embeddings e HTTP
│   └── carregar_processadas() / marcar_processada()
│
├── UTILITÁRIOS               slugify(), chunkar(), gerar_metadados(), indexar_conteudo()
│   ├── salvar_arquivos()     Grava .txt + .json em disco
│   └── salvar_catalogo()     Gera/atualiza _CATALOGO.md
│
├── MÓDULO: ARTIGOS WEB       raspar_artigo(), processar_artigo()
│
├── MÓDULO: VÍDEOS YOUTUBE    processar_video(), _fetch_transcricao_youtube()
│   └── _obter_transcricao_ytdlp()  Fallback via yt-dlp
│
├── MÓDULO: LIMPEZA           limpar_transcricao() → _limpar_local() ou Groq
│
├── MÓDULO: ARQUIVOS LOCAIS   pipeline_processar_pasta()
│   ├── pipeline_gerar_json_para_txts_sem_json()
│   ├── preparar_txt_sem_par_como_fonte_indexavel()
│   └── relatorio_pasta()
│
├── MÓDULO: LOTES             pipeline_artigos_em_lote(), pipeline_videos_em_lote()
│   └── pipeline_indexar_video_por_nome()  (busca fuzzy)
│
├── MÓDULO: CRAWLER           descobrir_links(), _eh_paginacao()
│
├── MÓDULO: Q&A               pipeline_perguntar()
│   ├── _classificar_pergunta()
│   ├── _buscar_chunks() / _buscar_titulos()
│   └── _forcar_secao_fontes_consultadas()
│
├── PIPELINES DE ALTO NÍVEL   pipeline_crawler(), status_indice()
│
├── INTERFACE                 menu(), conversa() — modo interativo
│   └── conversa()            usa Groq como roteador de intenção
│
└── CLI _main()               Parsing de argumentos e despacho
```

---

## 9. Fluxo interno detalhado

### 9.1 Indexação de artigo web

```
URL
 │
 ▼
raspar_artigo()
 ├── GET com requests.Session + BeautifulSoup
 ├── Remove lixo: nav, footer, sidebar, ads...
 ├── Extrai título (h1 → title → path)
 └── Extrai conteúdo (seletores: article, main, [class*='post-content']...)
 │
 ▼
gerar_metadados(titulo, conteudo, "artigo")
 ├── Envia até 4.000 chars para Groq (llama-3.1-8b-instant)
 └── Retorna JSON: resumo, palavras-chave, tema, condições, fármacos...
 │
 ▼
indexar_conteudo()
 ├── chunkar(): divide em blocos de 500 palavras, sobreposição de 50
 ├── IDs: slug(url)_c0, slug(url)_c1, ...
 └── colecao.upsert(ids, documents, metadatas)
 │
 ▼
salvar_arquivos()
 ├── Grava basename.txt (cabeçalho + corpo)
 └── Grava basename.json (todos os metadados)
 │
 ▼
marcar_processada(url)  →  .urls_processadas.json
```

### 9.2 Indexação de vídeo YouTube

```
URL
 │
 ▼
extrair_video_id()  →  ID de 11 chars
 │
 ▼
_fetch_transcricao_youtube()
 ├── YouTubeTranscriptApi (pt → pt-BR → en)
 ├── Retry com backoff exponencial (RAG_YT_FETCH_RETRIES)
 └── Se IpBlocked → fallback yt-dlp (se RAG_YT_DLP_ENABLED=1)
 │
 ▼
_metadados_yt(video_id)
 └── oEmbed do YouTube: título e canal (sem API key)
 │
 ▼
limpar_transcricao(texto_bruto)
 ├── modo "local"   → regex: remove [música], repetições, excesso de espaços
 ├── modo "ia"      → Groq em blocos de até 7.500 chars
 └── modo "nenhuma" → retorna bruto
 │
 ▼
gerar_metadados() → indexar_conteudo() → salvar_arquivos()
(mesmo fluxo do artigo)
```

### 9.3 Consulta clínica

```
pergunta (string)
 │
 ▼
_buscar_titulos()  →  lista de todos os títulos únicos no ChromaDB
 │
 ▼
_classificar_pergunta(pergunta, titulos)
 ├── Groq (llama-3.1-8b-instant, JSON mode)
 └── Retorna: tipo, fonte_alvo (se específica), n_chunks, raciocínio
 │
 ▼
_buscar_chunks(pergunta, classificacao)
 ├── colecao.query(query_texts=[pergunta], n_results=n_chunks)
 └── Se tipo=="específica": where={"titulo": fonte_alvo}
 │
 ▼
chamar_groq(PROMPT_RESPOSTA_SISTEMA, contexto_com_chunks)
 └── Modelo: llama-3.3-70b-versatile
 │
 ▼
_deduplicar_fontes_consultadas()
_forcar_secao_fontes_consultadas()
 │
 ▼
resposta + AVISO_MEDICO
```

### 9.4 Correção de orphans (`--gerar-json-locais`)

```
PASTA_SAIDA/*.txt
 │
 ▼
inspecionar_txt_local()
 ├── tem_json?  → pula
 ├── texto_cru_sem_par?  → precisa de cabeçalho + JSON
 └── formatado_sem_par?  → só precisa do JSON
 │
 ▼
preparar_txt_sem_par_como_fonte_indexavel()
 ├── extrair_corpo_txt_local_bruto()  → separa cabeçalho e corpo
 ├── limpar_transcricao()
 ├── gerar_metadados()  (Groq ou fallback)
 ├── Grava .json  (indexado_chroma: false)
 └── Reescreve .txt no formato padrão (se era texto cru)
 │
 ▼
sup --local  →  pipeline_processar_pasta()  →  indexar_conteudo()
```

---

## 10. Estrutura de arquivos em disco

```
RAG_PASTA_SAIDA/                   (ex.: ~/Documentos/rag_base)
│
├── chroma_db/                     Banco vetorial ChromaDB (não editar)
│
├── .urls_processadas.json         Lista de URLs já indexadas (evita duplicatas)
│
├── _CATALOGO.md                   Catálogo legível gerado automaticamente
│
├── nome_do_artigo.txt             Conteúdo limpo com cabeçalho padrão
├── nome_do_artigo.json            Metadados do artigo
│
├── titulo_do_video.txt            Transcrição limpa com cabeçalho padrão
└── titulo_do_video.json           Metadados do vídeo
```

### Formato do `.txt`

```
TIPO: artigo_web
TÍTULO: Diagnóstico e Tratamento de Hipertensão Arterial
URL: https://drajuda.com.br/hipertensao
DATA: 2024-03-15
RESUMO: Abordagem diagnóstica e terapêutica da HAS baseada nas diretrizes...
[CONTEÚDO]
A hipertensão arterial sistêmica é definida como...
```

O marcador `[CONTEÚDO]` separa o cabeçalho do corpo. O `pipeline_processar_pasta()` usa esse marcador para extrair apenas o texto relevante antes de indexar.

---

## 11. Schema JSON dos metadados

Cada `.json` salvo em disco segue este esquema exato (compatível com o ChromaDB):

```json
{
  "tipo":               "artigo_web | video_youtube | texto_local",
  "titulo":             "Título do conteúdo",
  "url":                "https://... ou local://arquivo.txt",
  "data_coleta":        "2024-03-15",
  "resumo":             "1–3 frases clínicas fiéis ao conteúdo",
  "palavras_chave":     ["hipertensão", "anti-hipertensivos", "ECA"],
  "tema_principal":     "Diagnóstico e tratamento de hipertensão arterial",
  "topicos_abordados":  ["critérios diagnósticos", "tratamento farmacológico"],
  "condicoes_clinicas": ["hipertensão arterial sistêmica", "síndrome metabólica"],
  "medicamentos":       ["losartana", "anlodipino", "hidroclorotiazida"],
  "procedimentos":      ["MAPA", "MRPA"],
  "especialidade":      "Cardiologia",
  "nivel_evidencia":    "diretriz | estudo clínico | revisão narrativa | opinião de especialista | outro",
  "nivel_tecnico":      "iniciante | intermediário | avançado",
  "linguagem":          "pt | en | outro",
  "tamanho_chars":      12500,
  "indexado_chroma":    true,

  "canal":     "Dr. Ajuda",           // apenas para video_youtube
  "duracao":   "00:42:17",            // apenas para video_youtube
  "video_id":  "aBcDeFgHiJk",        // apenas para video_youtube
  "dominio":   "drajuda.com.br"       // apenas para artigo_web
}
```

O campo **`indexado_chroma`** é a chave de controle: `false` = ainda não indexado, `true` = já está no ChromaDB. O `pipeline_processar_pasta()` usa esse campo para saber o que processar.

---

## 12. Modelos Groq e seus papéis

| Variável | Modelo padrão | Onde é usado |
|---|---|---|
| `GROQ_MODELO_RAPIDO` | `llama-3.1-8b-instant` | Geração de metadados e classificação de perguntas |
| `GROQ_MODELO_POTENTE` | `llama-3.3-70b-versatile` | Resposta clínica final ao médico |
| `GROQ_MODELO_LIMPEZA` | `llama-3.1-8b-instant` | Limpeza de transcrições (modo `ia`) |

**Por que três modelos distintos?**

- Metadados e classificação são tarefas estruturadas (JSON) que o modelo rápido resolve bem, a custo menor e com menor latência.
- A resposta clínica exige raciocínio mais profundo e síntese de múltiplas fontes — o modelo potente é fundamental aqui.
- Limpeza de transcrições opera em blocos, pode gerar muita chamada, e o conteúdo é simples — modelo rápido é suficiente.

---

## 13. Resiliência e controle de rate-limit

### Pool de chaves Groq (`_GroqKeyPool`)

```
Chamada à API falha com 429 (rate-limit)?
 │
 ├── Há outra chave não tentada neste round?
 │    └── SIM → rotaciona imediatamente (sem esperar)
 │
 └── Todas as chaves falharam neste round?
      └── aguarda backoff exponencial → tenta de novo
          (repete por GROQ_MAX_RETRIES rounds)
```

Configure múltiplas chaves para maximizar throughput em lotes grandes:

```env
GROQ_API_KEY=chave1
GROQ_API_KEY_2=chave2
GROQ_API_KEY_3=chave3
```

### Anti-bloqueio YouTube

O YouTube detecta e bloqueia rajadas de requisições. O sistema usa:

- **`RAG_YT_PRE_FETCH`** — pausa antes do primeiro pedido de cada vídeo (padrão: 0.5s)
- **`RAG_YT_PAUSA_ENTRE_VIDEOS`** — pausa base entre vídeos no lote (padrão: 4s)
- **`RAG_YT_PAUSA_JITTER`** — atraso aleatório adicional 0..N s (padrão: 2s)
- **`RAG_YT_FETCH_RETRIES`** + **`RAG_YT_FETCH_BACKOFF`** — backoff exponencial em falha
- **`RAG_YT_STOP_ON_IPBLOCK`** — para o lote ao detectar bloqueio de IP (padrão: ativo)

Se o IP for bloqueado, o sistema sugere aguardar ~1h (configurável em `RAG_YT_IPBLOCK_COOLDOWN_S`) e oferece o fallback via yt-dlp.

### Inicialização lazy de recursos pesados

ChromaDB, modelo de embeddings (`sentence-transformers`) e a sessão HTTP só são carregados quando realmente necessários, via `_ensure_db()`. Isso torna o `--ajuda` e o `--status` instantâneos.

---

## 14. Boas práticas para a equipe

### Ao adicionar novos artigos

```bash
# Sempre verifique o status antes
sup --status

# Adicione em lote para eficiência
sup --artigos lista.txt

# Confirme que foi indexado
sup --status
```

### Ao adicionar vídeos em grande volume

```bash
# Use lote em vez de um por um
sup --video lista_videos.txt

# Ajuste as pausas se necessário (para não bloquear o IP)
RAG_YT_PAUSA_ENTRE_VIDEOS=6 RAG_YT_PAUSA_JITTER=3 sup --video lista.txt
```

### Ao receber transcrições brutas de terceiros

Se alguém enviar um `.txt` com texto cru (sem o cabeçalho do sistema):

```bash
# 1. Copie o(s) arquivo(s) para a pasta de saída
cp /recebidos/*.txt ~/Documentos/rag_base/

# 2. Prepare os JSONs (Groq gera os metadados)
sup --gerar-json-locais

# 3. Revise os JSONs gerados se necessário (título, URL, tipo)

# 4. Indexe no ChromaDB
sup --local

# 5. Confirme
sup --relatorio
```

### Ao atualizar conteúdo já indexado

```bash
# Reindexar uma URL específica
sup --reindexar "https://drajuda.com.br/artigo-revisado"

# Para reindexar um arquivo local:
# 1. Abra o .json correspondente e mude indexado_chroma para false
# 2. Execute:
sup --local
```

### Modo econômico (reduz tokens em consultas)

Para ambientes com limite de tokens/mês:

```env
GROQ_ECONOMIA=1
GROQ_CLASSIF_TITULOS_MAX=30     # envia só 30 títulos para o classificador
GROQ_CONTEXTO_CHUNK_MAX_CHARS=1200  # trunca chunks no contexto
GROQ_CONTEXTO_TOTAL_MAX_CHARS=9000  # limita contexto total
```

### Limpeza de transcrições por IA (melhor qualidade)

Por padrão a limpeza é feita com regex local (rápido, 0 tokens). Para qualidade máxima em transcrições com muito ruído de fala:

```env
LIMPEZA_TRANSCRICAO=ia
```

---

## 15. Referência completa de variáveis de ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `GROQ_API_KEY` | *(obrigatório)* | Chave principal Groq |
| `GROQ_API_KEY_2` … `_5` | — | Chaves adicionais para rotação |
| `GROQ_API_KEYS` | — | Alternativa: múltiplas chaves separadas por vírgula |
| `RAG_PASTA_SAIDA` | `~/Documentos/rag_base` | Pasta dos arquivos .txt e .json |
| `RAG_PASTA_CHROMA` | `<SAIDA>/chroma_db` | Pasta do banco vetorial |
| `RAG_DEBUG_LOG` | *(vazio = desativado)* | Caminho para log NDJSON de debug |
| `GROQ_MODELO_RAPIDO` | `llama-3.1-8b-instant` | Modelo para metadados e classificação |
| `GROQ_MODELO_POTENTE` | `llama-3.3-70b-versatile` | Modelo para resposta clínica final |
| `GROQ_MODELO_LIMPEZA` | `llama-3.1-8b-instant` | Modelo para limpeza de transcrições |
| `CHROMA_CHUNK_PALAVRAS` | `500` | Tamanho de cada chunk em palavras |
| `CHROMA_CHUNK_OVERLAP` | `50` | Sobreposição entre chunks (palavras) |
| `LIMPEZA_TRANSCRICAO` | `local` | `local` / `ia` / `nenhuma` |
| `GROQ_LIMPEZA_MAX_CHARS` | `7500` | Máx. chars por bloco de limpeza IA |
| `GROQ_LIMPEZA_PAUSA_S` | `1.25` | Pausa entre blocos de limpeza IA |
| `GROQ_METADADOS_MAX_CHARS` | `4000` | Chars enviados para geração de metadados |
| `GROQ_MAX_RETRIES` | `10` | Rounds de retry em rate-limit |
| `GROQ_ECONOMIA` | `0` | `1` ativa modo econômico de tokens |
| `GROQ_CLASSIF_TITULOS_MAX` | `30` | Máx. títulos enviados ao classificador (modo econômico) |
| `GROQ_CONTEXTO_CHUNK_MAX_CHARS` | `1200` | Trunca chunks no contexto (modo econômico) |
| `GROQ_CONTEXTO_TOTAL_MAX_CHARS` | `9000` | Limita contexto total (modo econômico) |
| `GROQ_MAX_N_CHUNKS` | `0` | Limite global de chunks por consulta (0 = sem limite) |
| `TIMEOUT_REQUISICAO` | `15` | Timeout HTTP em segundos |
| `PAUSA_ENTRE_PAGINAS` | `1.0` | Pausa entre requisições web (segundos) |
| `RAG_ARTIGOS_FETCH_THREADS` | `1` | Downloads paralelos no lote de artigos |
| `RAG_HTML_PARSER` | `lxml` | `lxml` / `html.parser` / `html5lib` |
| `RAG_MIN_CHARS_ARTIGO` | `0` | Mín. de chars no texto raspado (0 = aceita todos) |
| `RAG_YT_PAUSA_ENTRE_VIDEOS` | `4.0` | Pausa base entre vídeos no lote (segundos) |
| `RAG_YT_PAUSA_JITTER` | `2.0` | Jitter aleatório adicional 0..N s |
| `RAG_YT_APOS_TRANSCRICAO` | `0.8` | Pausa entre transcrição e chamada oEmbed |
| `RAG_YT_PRE_FETCH` | `0.5` | Pausa antes do 1º pedido de transcrição |
| `RAG_YT_FETCH_RETRIES` | `5` | Tentativas se a transcrição falhar |
| `RAG_YT_FETCH_BACKOFF` | `2.5` | Base do backoff exponencial (segundos) |
| `RAG_YT_STOP_ON_IPBLOCK` | `1` | Para o lote ao detectar bloqueio de IP |
| `RAG_YT_MAX_CONSEC_IPBLOCK` | `1` | Bloqueios consecutivos para parar |
| `RAG_YT_IPBLOCK_COOLDOWN_S` | `3600` | Sugestão de espera após bloqueio (segundos) |
| `RAG_YT_DLP_ENABLED` | `0` | `1` habilita fallback de legendas via yt-dlp |
| `RAG_YT_DLP_COOKIES_FILE` | — | Caminho para cookies.txt (yt-dlp, opcional) |
| `CHROMA_HOST` | — | Host do ChromaDB remoto (se não definido, usa local) |
| `CHROMA_PORT` | `8000` | Porta do ChromaDB remoto |

---

## Referência rápida de comandos

```bash
# Consulta
sup                                          # modo conversa
sup --pergunta "minha dúvida clínica"        # resposta direta
sup --menu                                   # menu visual numerado

# Indexação
sup --crawl "https://site.com/blog"          # site completo
sup --artigos "url1" "url2"                  # artigos avulsos
sup --artigos lista.txt                      # artigos via arquivo
sup --video "https://youtube.com/watch?v=X"  # vídeo único
sup --video lista.txt                        # lote de vídeos
sup --local                                  # arquivos locais

# Manutenção
sup --gerar-json-locais                      # prepara orphans
sup --gerar-json-locais --sobrescrever       # regenera todos os JSONs
sup --relatorio                              # inventário da pasta
sup --status                                 # resumo do banco
sup --reindexar "https://..."                # força reprocessamento
sup --buscar-local                           # localiza arquivo por tema
```

---

*Documentação gerada para o `super.py` — Sistema de Apoio Clínico Dr. Ajuda.*
>>>>>>> f3882e3 (first)
