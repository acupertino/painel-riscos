---
name: iniciar-tarefa
description: Começa uma tarefa nova no Painel de Riscos — atualiza a main e cria uma branch própria. Use quando a pessoa disser "começar/iniciar tarefa", "nova tarefa", "vou trabalhar em X".
---

# Iniciar tarefa

1. Rode `git status`. Se houver alterações não commitadas, pare e pergunte o que fazer
   (commitar na branch atual, guardar com `git stash` ou descartar). Nunca descarte sem confirmação.
2. Atualize a main:
   ```bash
   git checkout main
   git pull
   ```
3. Crie a branch da tarefa a partir do nome que a pessoa deu, em minúsculas, sem acentos,
   palavras separadas por hífen, com prefixo `feat/` (funcionalidade nova), `fix/` (correção)
   ou `docs/` (documentação). Ex.: "gráfico de riscos" → `feat/grafico-de-riscos`.
   ```bash
   git checkout -b feat/nome-da-tarefa
   ```
4. Confirme em uma linha: "Branch `feat/...` criada a partir da main atualizada. Pode começar."

Regras: nunca trabalhar nem commitar direto na `main`.
