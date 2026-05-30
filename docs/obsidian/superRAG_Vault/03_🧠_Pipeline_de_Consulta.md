# 🧠 Pipeline de Consulta: O Raciocínio Clínico

Quando um médico faz uma pergunta, o superRAG entra em modo de "Análise de Missão". Ele não apenas busca palavras-chave; ele entende a intenção.

---

## 🚦 Passo 1: Classificação de Intenção
Antes de buscar, o sistema pergunta ao Groq: *"O que o médico quer?"*
- **ESPECÍFICA:** "Quais os sintomas de Dengue?" (Busca focada em um artigo).
- **GERAL:** "Como tratar hipertensão?" (Busca ampla em vários artigos).
- **COMPARATIVA:** "Qual a diferença entre Losartana e Enalapril?" (Busca balanceada).
- **FORA DE ESCOPO:** "Qual a previsão do tempo?" (Recusa educadamente).

---

## 🔍 Passo 2: Busca Vetorial e Reranking
O sistema busca no [[04_🛠️_Pilha_Tecnica#ChromaDB|ChromaDB]] os melhores trechos. Mas não paramos aí:
- **Expansão de Contexto:** Se o resultado for fraco, o sistema expande a busca para garantir que não deixou nada passar.
- **Filtro de Relevância:** Trechos que não batem com o tema clínico são descartados para não poluir a resposta.

---

## ✍️ Passo 3: Síntese Potente (Llama 3.3 70B)
Aqui é onde o "modelo parrudo" entra em ação. Ele recebe os trechos recuperados e monta a resposta seguindo este template:

1. **🔍 Análise da Consulta:** O que foi entendido.
2. **🧠 Síntese Clínica:** A resposta direta com citações `(Fonte 1)`.
3. **🩺 Raciocínio Diagnóstico:** Diferenciais e hipóteses.
4. **💊 Conduta Clínica:** O "o que fazer" (doses, exames).
5. **⚠️ Pontos de Atenção:** Alertas e "Red Flags".
6. **🔎 Lacunas na Base:** O que o sistema **não** encontrou (honestidade intelectual).
7. **📚 Fontes Consultadas:** Lista de links e títulos.

---

## 🛡️ Segurança e Guardrails
- **Aviso Médico Obrigatório:** Todas as respostas terminam com um disclaimer legal.
- **Prioridade de Contexto:** Se a base de dados diz X e o conhecimento geral da IA diz Y, o sistema **deve** priorizar o X (conteúdo do Dr. Ajuda).

---
[[02_📥_Pipeline_de_Indexacao|⬅️ Indexação]] | [[04_🛠️_Pilha_Tecnica|Próximo: Pilha Técnica ➡️]]
