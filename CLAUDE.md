@AGENTS.md

# Painel de Riscos

Análise de riscos a partir dos quadros da Monday. Projeto construído a quatro mãos
(duas pessoas, cada uma com o seu Claude Code), no mesmo padrão visual e de arquitetura
do app "monday-v2" (Portfólio / Árvore de Indicadores).

Guia detalhado (layout, cores, exemplos de código): `docs/guia-estrutura.md`.
Referência visual ao vivo: https://monday-v2-7jc2.vercel.app/ (ver páginas da Árvore de Indicadores).

## Stack
- TypeScript (strict), Next.js 16 (App Router), React 19, Tailwind CSS 4, Recharts 3, fonte Geist.
- Alias `@/` = `src/`.

## Arquitetura
- Páginas interativas em `src/app/**/page.tsx` com `'use client'`; buscam dados via `fetch('/api/...')`.
- Rotas de API em `src/app/api/**/route.ts` rodam no servidor e falam com a Monday por
  `src/lib/monday.ts` (GraphQL, `API-Version: 2024-10`, paginação `items_page`/`next_items_page`).
- Cache em disco em `.cache/` (fora do git), validade de 30 min, `?refresh=1` força atualização.
- Regras de negócio (classificação de risco, agrupamentos, cálculos) em `src/lib/*.ts`, com
  comentário curto citando a fonte e a data de dados manuais.
- Quadros analisados: constante `QUADROS` em `src/lib/monday.ts`.

## Padrão visual
- Casca: sidebar fixa `w-60` à esquerda (`md:`), BottomNav no celular, conteúdo `md:ml-60 bg-gray-50`.
- Marca do Instituto Ânima (desde 26/10/2026): logo em `public/logo-instituto-anima.png` no topo da
  sidebar; cores em `globals.css` como `marca-marinho` #00347f (principal: títulos, aba e botão
  ativos), `marca-roxo` #5b2a86, `marca-azul` #4a6fb5, `marca-ciano` #2ec4f6, `marca-azul-escuro`
  #0e6bb0 e `marca-claro` #eaf1fb (fundo de item ativo); `.faixa-marca` = degradê do logo.
- Cabeçalho de página (`src/components/PageHeader.tsx`): claro, `sticky top-0 z-30 bg-white`
  (sticky, não fixed: a altura varia), título `text-marca-roxo` centralizado, navegação em pílula
  logo abaixo (`rounded-full bg-slate-100 ring-1 ring-slate-200 p-1`; aba ativa
  `bg-marca-marinho text-white`), espaço opcional à direita (`direita`, usado pela legenda de risco)
  e faixa `.faixa-marca` de 4px embaixo.
- Cards: `rounded-xl bg-white border border-slate-200 shadow-sm p-4`; categoria com `border-l-4`.
- Cores de status: concluído #34d399, em andamento #facc15, em atraso #f87171, a iniciar #3b82f6,
  outros #94a3b8, sem status #d1d5db (versões suaves: #6ee7b7, #fde68a, #fca5a5, #93c5fd, #cbd5e1, #e5e7eb).
- Tooltips e legendas de hover via `createPortal(..., document.body)` com `fixed z-[60]`.
- Recharts com `animationDuration={450}` e `ease-out`.

## Regras
- Nomes de variáveis e funções em português; texto da interface sempre "a Monday" (feminino).
- Segredos só no `.env.local` (cada pessoa com o seu token da Monday). Nunca commitar tokens,
  bases de pessoas ou dados financeiros. `.cache/` e `externos/` são ignorados pelo git.
- Não alterar dados na Monday sem pedido explícito: o app é de leitura.
- Git: nunca trabalhar nem commitar direto na `main`; ela só recebe merges feitos pelo
  `/finalizar-tarefa`. Fluxo de cada tarefa:
  1. `/iniciar-tarefa` → `git pull` na `main` e cria a branch (`feat/...`, `fix/...`, `docs/...`).
  2. Trabalhar e commitar na branch.
  3. `/finalizar-tarefa` → `tsc`, commit, `git pull origin main`, merge na `main` e push, tudo
     pelo terminal (sem Pull Request no site, sem esperar revisão).
  Skills em `.claude/skills/`. Prompts prontos em `docs/prompts/`.
- Antes de dar uma tarefa como pronta: `npx tsc --noEmit` limpo.
