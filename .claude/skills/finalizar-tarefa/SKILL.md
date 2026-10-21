---
name: finalizar-tarefa
description: Finaliza a tarefa atual do Painel de Riscos — confere o código, commita na branch, envia ao GitHub e entrega o link do Pull Request para a própria pessoa fazer o merge. Use quando a pessoa disser "finalizar/terminar tarefa", "commita e manda", "subir as alterações".
---

# Finalizar tarefa

1. Confirme que está numa branch de tarefa (`git branch --show-current`). Se estiver na `main`,
   pare: crie uma branch com as alterações (`git checkout -b feat/...`) antes de seguir.
2. Rode `npx tsc --noEmit`. Se tiver erro, corrija ou avise antes de continuar.
3. Confira `git status` e garanta que nada sensível vai junto (`.env.local`, `.cache/`,
   `externos/`, planilhas, tokens). Se aparecer algo assim, pare e avise.
4. Commite com mensagem curta em português dizendo o que foi feito:
   ```bash
   git add -A
   git commit -m "o que foi feito"
   ```
5. Traga o que a outra pessoa já juntou e resolva conflitos, se houver:
   ```bash
   git pull origin main
   ```
   Se der conflito, explique em linguagem simples, resolva com a pessoa e commite de novo.
6. Envie a branch:
   ```bash
   git push -u origin NOME-DA-BRANCH
   ```
7. Entregue o link do Pull Request e o passo final:
   `https://github.com/acupertino/painel-riscos/compare/main...NOME-DA-BRANCH?expand=1`
   "Abra o link, clique em **Create pull request** e depois em **Merge pull request** →
   **Confirm merge**. Pronto, entrou na main. Para a próxima tarefa, use /iniciar-tarefa."

Regras: nunca dar push direto na `main`; o merge é feito pela própria pessoa no GitHub.
