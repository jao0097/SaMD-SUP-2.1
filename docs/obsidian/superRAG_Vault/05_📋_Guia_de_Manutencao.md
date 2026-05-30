# 📋 Guia de Manutenção e Operação

Aqui estão os comandos de sobrevivência para o dia a dia com o superRAG. Se algo quebrar, comece por aqui.

---

## 🛠️ Comandos de Diagnóstico

### Ver Status da Base
`sup --status`
Exibe quantos artigos, vídeos e chunks temos no banco, além de listar os domínios mais indexados.

### Relatório de Órfãos
`sup --relatorio`
O comando mais importante para manutenção de arquivos. Ele mostra o que está no disco mas ainda não chegou no banco vetorial.

---

## 📥 Ingestão de Massa

### Indexar um Site Inteiro
`sup --crawl "https://drajuda.com.br/blog" --filtro "/artigos/"`
*Dica: Use o filtro para evitar indexar páginas de contato, "sobre nós", etc.*

### Lote de Vídeos
`sup --video lista_videos.txt`
*Onde lista_videos.txt tem uma URL por linha.*

---

## 🧹 Limpeza e Recuperação

### Gerar JSONs Faltantes
`sup --gerar-json-locais`
Se você copiou transcrições brutas para a pasta, este comando usa a IA para criar os metadados necessários.

### Sincronizar Disco -> Banco
`sup --local`
Lê todos os pares `.txt`/`.json` e faz o upload para o ChromaDB.

### Reindexar URL
`sup --reindexar "URL"`
Útil se o artigo original foi atualizado no site e você quer apagar a versão antiga e indexar a nova.

---

## 🚨 Troubleshooting Comum

- **Erro 429 (Rate Limit):** Adicione mais chaves Groq no seu `.env`.
- **IP Bloqueado pelo YouTube:** O sistema avisará. Ative o fallback: `RAG_YT_DLP_ENABLED=1` no `.env`.
- **Banco Corrompido:** Em último caso, apague a pasta `chroma_db` e rode `sup --local` para reconstruir tudo a partir dos arquivos `.txt`.

---
[[04_🛠️_Pilha_Tecnica|⬅️ Pilha Técnica]] | [[06_📊_Estrutura_de_Dados|Próximo: Estrutura de Dados ➡️]]
