# 📊 Estrutura de Dados e Metadados

O segredo de um bom RAG não está no texto, mas nos **metadados**. Eles são as etiquetas que ajudam a busca a ser cirúrgica.

---

## 📄 O Arquivo .json (O DNA)
Cada fonte indexada tem um arquivo `.json` companheiro. Veja o que ele guarda:

```json
{
  "tipo": "artigo_web",
  "titulo": "Sintomas de Diabetes",
  "url": "https://...",
  "resumo": "Explicação detalhada sobre poliúria, polidipsia e perda de peso...",
  "condicoes_clinicas": ["Diabetes Mellitus Tipo 1", "Diabetes Tipo 2"],
  "medicamentos": ["Insulina", "Metformina"],
  "especialidade": "Endocrinologia",
  "nivel_tecnico": "intermediário",
  "indexado_chroma": true
}
```

---

## 📝 O Arquivo .txt (O Corpo)
O arquivo de texto segue um padrão estrito para facilitar o parsing manual ou automático:

```text
TIPO: artigo_web
TÍTULO: ...
URL: ...
DATA: 2024-05-25
RESUMO: ...
[CONTEÚDO]
Aqui começa o texto limpo, sem tags HTML, pronto para ser lido pela IA.
```

---

## 🔍 Por que isso importa?
Quando o médico pergunta sobre "Metformina", o sistema pode filtrar a busca no banco vetorial para olhar apenas para os documentos onde `medicamentos` contém "Metformina". Isso reduz o ruído e aumenta a precisão drasticamente.

---
[[05_📋_Guia_de_Manutencao|⬅️ Manutenção]] | [[00_🏠_Home|🏠 Voltar para Home]]
