# 📥 Pipeline de Indexação: Alimentando o Cérebro

A indexação é onde transformamos conteúdo bruto em conhecimento estruturado. No superRAG, tratamos três fontes principais com o mesmo rigor clínico.

---

## 🌐 1. Artigos Web (Crawl)
O crawler do sistema é inteligente. Ele não apenas baixa o HTML, ele:
- **Remove o Lixo:** Elimina menus, rodapés, anúncios e barras laterais automaticamente.
- **Extração Semântica:** Identifica o conteúdo principal usando seletores CSS prioritários.
- **Slugificação:** Cria nomes de arquivos amigáveis baseados no título ou URL.

---

## 📹 2. YouTube (Transcrições)
Este é um dos pontos mais fortes do sistema. 
- **Multi-camadas:** Tenta baixar a transcrição oficial em PT, depois PT-BR, depois EN.
- **Fallback Resiliente:** Se a API do YouTube bloquear o IP, o sistema aciona o `yt-dlp` para extrair as legendas.
- **Limpeza por IA:** Transcrições costumam ter vícios de fala ("né", "então", "é..."). O sistema pode usar o Groq para limpar o texto sem perder o sentido clínico.

---

## 📂 3. Arquivos Locais (Orphans)
Temos suporte para arquivos `.txt` que ainda não foram processados.
- **Pipeline de Órfãos:** Se você tem um texto cru, o comando `sup --gerar-json-locais` gera automaticamente os metadados e o par `.json`.
- **Sincronização:** O comando `sup --local` garante que o que está no disco seja espelhado no banco vetorial.

---

## ⚙️ O Processo Interno (O "Pulo do Gato")

Independentemente da fonte, todo conteúdo passa por:
1. **Chunking:** Divisão em pedaços de ~500 palavras com overlap (sobreposição) para não perder o contexto entre um pedaço e outro.
2. **Metadados via Groq:** O modelo `llama-3.1-8b` lê o texto e extrai:
	- **Condições Clínicas**
	- **Medicamentos**
	- **Especialidades**
	- **Resumo Executivo**
3. **Indexação:** Envio para o [[04_🛠️_Pilha_Tecnica#ChromaDB|ChromaDB]].

---

## 🛠️ Comandos de Indexação

| Tarefa | Comando |
| :--- | :--- |
| Crawl em site completo | `sup --crawl "URL"` |
| Indexar vídeo do YT | `sup --video "URL"` |
| Processar pasta local | `sup --local` |
| Gerar JSON para órfãos | `sup --gerar-json-locais` |

---
[[01_🏗️_Arquitetura_Geral|⬅️ Arquitetura]] | [[03_🧠_Pipeline_de_Consulta|Próximo: Pipeline de Consulta ➡️]]
