---
name: frontend-saas-ux
description: Use when redesigning operational web apps (SaaS, dashboards, internal tools) with professional UI/UX. Prioritize dense, scannable layouts, clear hierarchy, accessibility, responsive behavior, and production-ready HTML/CSS/JS that keeps existing app workflows intact.
---

# Frontend SaaS UX

## Goal
Refazer interfaces de produto com foco em uso real: velocidade de leitura, previsibilidade e baixa fricção para tarefas repetidas.

## Workflow
1. Mapear fluxos e IDs/handlers já usados pelo JS antes de alterar HTML.
2. Preservar contratos funcionais (IDs, hooks, eventos, endpoints).
3. Organizar layout em áreas estáveis: navegação, entrada, resultado, histórico, estado.
4. Aplicar hierarquia visual discreta (tipografia, espaçamento, contraste, bordas).
5. Garantir responsividade mobile/desktop sem sobreposição de texto.
6. Validar acessibilidade mínima: foco visível, labels, `aria-*`, alvos clicáveis.

## UI Rules
- Evitar estética de landing page; tratar como ferramenta clínica operacional.
- Evitar excesso de cartões decorativos e gradientes pesados.
- Exibir ações principais com prioridade visual clara (`Consultar`, `Copiar`, `Baixar`).
- Usar microtexto curto e objetivo.
- Mostrar estados: carregando, erro, vazio, histórico.

## Done Criteria
- HTML semântico e legível.
- Fluxos existentes funcionando sem alteração de API.
- IDs esperados pelo JavaScript preservados.
- Layout responsivo e consistente com app profissional.
