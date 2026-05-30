# 🛠️ Pilha Técnica: O Motor do superRAG

Como desenvolvedores, amamos saber o que está rodando por baixo do capô. O superRAG é construído com uma stack moderna, focada em performance e custo-benefício.

---

## 🚀 Modelos de IA (Groq Cloud)
Usamos o **Groq** pela sua latência baixíssima. Dividimos os papéis para otimizar custos:

- **Llama 3.1 8B (O Rápido):** Usado para tarefas estruturadas como gerar metadados, limpar textos e classificar perguntas. É instantâneo.
- **Llama 3.3 70B (O Potente):** Usado para a síntese final. Ele tem a capacidade de raciocínio necessária para lidar com nuances médicas.

---

## 🗄️ ChromaDB (Vector Store)
O nosso "banco de dados do futuro".
- **Embeddings:** Usamos o modelo `paraphrase-multilingual-MiniLM-L12-v2`. Ele é excelente para entender português e inglês no mesmo espaço vetorial.
- **Busca por Cosseno:** O sistema não busca palavras iguais, mas **significados** próximos.

---

## 🐍 Python & Frameworks
- **FastAPI:** Sustenta a [[web_api.py|API Web]], permitindo que outros sistemas (apps, sites) consultem o superRAG.
- **BeautifulSoup4 & Requests:** O nosso combo clássico de web scraping para o crawler.
- **YouTube Transcript API:** Para a ingestão rápida de vídeos.

---

## 🔄 Resiliência de API (Key Rotation)
Temos um sistema de **Pool de Chaves**. Se você configurar múltiplas chaves no `.env`, o sistema faz o rodízio automático caso receba um erro de *Rate Limit* (429). Isso permite processar milhares de artigos em lote sem interrupções.

---

## 🐳 Docker
O projeto está pronto para subir em segundos com `docker-compose`.
- **Serviço Chroma:** Container isolado para o banco.
- **Serviço Web:** A API FastAPI rodando em Uvicorn.

---
[[03_🧠_Pipeline_de_Consulta|⬅️ Consulta]] | [[05_📋_Guia_de_Manutencao|Próximo: Guia de Manutenção ➡️]]
