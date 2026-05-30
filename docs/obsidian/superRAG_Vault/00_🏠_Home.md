# 🩺 superRAG: O Cérebro por trás do Dr. Ajuda

Bem-vindo ao **superRAG**, o sistema de apoio à decisão clínica que transforma o vasto conhecimento do Dr. Ajuda em uma ferramenta de consulta inteligente, rápida e, acima de tudo, segura para o profissional de saúde.

Como desenvolvedor sênior, eu costumo dizer que um sistema RAG (*Retrieval-Augmented Generation*) é como um bibliotecário super-dotado: ele não apenas conhece todos os livros da estante, mas sabe exatamente em qual página está a resposta para a sua dúvida específica, e te entrega essa resposta sintetizada, sem inventar nada.

---

## 🗺️ O Mapa da Mina

Para entender o superRAG, dividimos o sistema em três grandes pilares que você pode explorar através dos links abaixo:

1. [[01_🏗️_Arquitetura_Geral|Arquitetura Geral]]: O "Big Picture" de como os dados fluem.
2. [[02_📥_Pipeline_de_Indexacao|Pipeline de Indexação]]: Como o conhecimento entra no sistema (Crawl, YouTube, Local).
3. [[03_🧠_Pipeline_de_Consulta|Pipeline de Consulta]]: O processo de inteligência que gera as respostas clínicas.
4. [[04_🛠️_Pilha_Tecnica|Pilha Técnica]]: As tecnologias que sustentam o monstro (Groq, ChromaDB, Llama 3).
5. [[05_📋_Guia_de_Manutencao|Guia de Manutenção]]: Comandos práticos para o dia a dia.
6. [[06_📊_Estrutura_de_Dados|Estrutura de Dados]]: Entenda o DNA do conhecimento indexado.

---

## 🚀 Por que este sistema é diferente?

Diferente de um ChatGPT genérico, o superRAG possui **Cercas de Contenção (Guardrails)**:
- **Zero Alucinação:** Ele só responde o que está na base de dados do Dr. Ajuda.
- **Rastreabilidade:** Cada afirmação médica vem acompanhada de sua respectiva `(Fonte N)`.
- **Foco Clínico:** O sistema entende a diferença entre uma pergunta "específica" (sobre uma doença) e uma "comparativa" (entre dois fármacos).

---
> **Aviso de Sênior:** Documentação boa é aquela que você lê e já sabe onde o erro está quando o sistema apita. Divirta-se explorando os pipelines!
