---
name: finalizar-tarefa
description: Finaliza a tarefa atual do Painel de Riscos — confere o código, commita na branch, junta na main e envia ao GitHub, tudo pelo terminal (sem abrir o site). Use quando a pessoa disser "finalizar/terminar tarefa", "commita e manda", "subir as alterações", "juntar na main".
---

# Finalizar tarefa

Fale com a pessoa em linguagem simples; ela não precisa saber os comandos.

1. Confirme que está numa branch de tarefa (`git branch --show-current`). Se estiver na `main`,
   crie antes uma branch com as alterações (`git checkout -b feat/...`).
2. Rode `npx tsc --noEmit`. Se tiver erro, corrija ou avise antes de continuar.
3. Confira `git status` e garanta que nada sensível vai junto (`.env.local`, `.cache/`,
   `externos/`, planilhas, tokens). Se aparecer algo assim, pare e avise.
4. Commite na branch com mensagem curta em português dizendo o que foi feito:
   ```bash
   git add -A
   git commit -m "o que foi feito"
   ```
5. Traga para a branch o que a outra pessoa já juntou:
   ```bash
   git pull origin main
   ```
   Se der conflito, explique em linguagem simples o que conflitou, resolva junto com a pessoa,
   rode `npx tsc --noEmit` de novo e commite.
6. Junte na main e envie:
   ```bash
   git checkout main
   git pull
   git merge --no-ff NOME-DA-BRANCH -m "Merge: descrição curta da tarefa"
   git push
   ```
   Se o `git push` for recusado (a outra pessoa enviou algo no meio-tempo), rode `git pull`,
   resolva conflitos se houver e tente o `git push` de novo.
7. Apague a branch local já juntada: `git branch -d NOME-DA-BRANCH`
   (e a remota, se existir: `git push origin --delete NOME-DA-BRANCH`).
8. Confirme em uma ou duas linhas: "Pronto! A tarefa X está na main e no GitHub. Avise a
   outra pessoa; para a próxima tarefa, use /iniciar-tarefa."

Regras: só a etapa 6 mexe na `main`, e sempre depois de `tsc` limpo e de trazer a `main` atualizada.
