# Painel de Riscos

Análise de riscos a partir dos quadros da Monday.

## Pré-requisitos
- [Git](https://git-scm.com), [Node.js LTS](https://nodejs.org), [VS Code](https://code.visualstudio.com)
  com a extensão **Claude Code**
- Acesso ao repositório no GitHub (convite de colaborador)
- Token pessoal da Monday: Avatar → Developers → My access tokens

## Primeira vez
```bash
git clone https://github.com/acupertino/painel-riscos.git
cd painel-riscos
npm install
cp .env.example .env.local   # e cole o seu MONDAY_API_TOKEN
npm run dev
```
Abra http://localhost:3000.

## Rotina de trabalho
No Claude Code, use os dois comandos do projeto:

1. **`/iniciar-tarefa nome da tarefa`** — atualiza a `main` e cria uma branch só para você.
2. Trabalhe normalmente com o Claude.
3. **`/finalizar-tarefa`** — confere o código, commita, junta na `main` e envia ao GitHub.
   Não precisa abrir o site.
4. Avise a outra pessoa que a tarefa entrou.

Nunca trabalhe direto na `main`. Equivalente manual:
```bash
git checkout main && git pull
git checkout -b feat/nome-da-tarefa
# ... trabalha ...
git add -A && git commit -m "o que foi feito"
git pull origin main
git checkout main && git pull
git merge --no-ff feat/nome-da-tarefa
git push
```

Prompts prontos para pedir ao Claude ficam em `docs/prompts/` (ex.: `esqueleto-visual.md`).

## Estrutura
```
src/app/            páginas (App Router)
src/app/api/monday  rota que lê os quadros da Monday (com cache em .cache/)
src/lib/monday.ts   cliente da API da Monday + lista de QUADROS
CLAUDE.md           regras do projeto para o Claude Code
```

## Referência visual
O padrão visual e de arquitetura segue o app **monday-v2**: https://monday-v2-7jc2.vercel.app/
- Melhores exemplos: Árvore de Indicadores → Resumo (`/arvores-indicadores`), Painel
  (`/arvores-indicadores/painel`) e Árvore (`/arvores-indicadores/arvore`).
- O app tem dados internos: uso só como referência, não repassar o link.
- Guia completo (stack, layout, cores, padrões de código): [docs/guia-estrutura.md](docs/guia-estrutura.md)

Teste rápido da API: http://localhost:3000/api/monday (`?refresh=1` ignora o cache).
