# GEMINI.md

Este arquivo contém as diretrizes e o contexto necessário para interagir com o projeto `sup` (Sistema de Apoio Clínico Dr. Ajuda).

## Project Overview

O `sup` é um sistema de RAG (*Retrieval-Augmented Generation*) focado em auxílio médico, utilizando documentos, artigos e transcrições de vídeos do canal "Dr. Ajuda". Ele permite consultas clínicas baseadas exclusivamente em fontes indexadas, visando eliminar alucinações de fontes externas.

### Componentes Principais

- **CLI (`super.py`)**: Interface de linha de comando para indexação (crawling, processamento de vídeo, gestão de arquivos locais) e consultas clínicas interativas.
- **Web API (`web_api.py`)**: Aplicação FastAPI que expõe o pipeline RAG clínico via interface web.

---

## Building and Running

### Pré-requisitos
- Python 3.9+
- Dependências: `pip install requests beautifulsoup4 chromadb groq sentence-transformers youtube-transcript-api python-dotenv fastapi uvicorn slowapi`
- Chave de API Groq (configurada no arquivo `.env`)

### Comandos de CLI (`super.py`)
O comando principal é `sup`. Recomenda-se criar um alias:
```bash
alias sup="python /caminho/para/super.py"
```

- **Consulta:** `sup` (modo conversa) ou `sup --pergunta "dúvida"`
- **Indexação:** `sup --crawl ...`, `sup --artigos ...`, `sup --video ...`, `sup --local`
- **Manutenção:** `sup --status`, `sup --relatorio`

### API Web (`web_api.py`)
Para executar a API (desenvolvimento):
```bash
uvicorn web_api:app --reload
```

---

## Development Conventions

- **IA Integration**: As chamadas à API da Groq são centralizadas em `super.py` e geridas por um pool de chaves (`_GroqKeyPool`) para lidar com rate-limits.
- **Armazenamento**: O sistema utiliza o ChromaDB para armazenamento vetorial e arquivos locais (.txt + .json) para metadados e conteúdo bruto.
- **Configuração**: Toda configuração é feita via `.env`.
- **Estrutura de Código**: Mantenha o arquivo `super.py` organizado conforme as seções descritas em seu cabeçalho.
- **Segurança**: As respostas geradas pela IA devem sempre incluir o aviso médico obrigatório.

---

## Manutenção e Diagnóstico

- O relatório de status (`sup --status`) e o inventário de arquivos (`sup --relatorio`) são ferramentas essenciais para diagnosticar o estado da base de dados e identificar arquivos pendentes ou corrompidos.
- **Sempre** valide o estado da base antes e depois de grandes operações de indexação.
