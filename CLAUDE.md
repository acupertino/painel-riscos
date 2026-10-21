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
- Cabeçalho de página: `fixed top-0 md:left-60 z-30 bg-slate-600 border-b border-slate-500 pt-6 pb-5`,
  título branco centralizado e navegação em pílula à direita
  (`rounded-full bg-white/10 ring-1 ring-white/15 p-1`; aba ativa `bg-white text-slate-700`).
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
- Git: nunca dar push direto na `main`. Trabalhar em branch (`feat/...`, `fix/...`), commits
  pequenos, abrir Pull Request para a outra pessoa revisar. Antes de começar: `git pull` na `main`.
- Antes de dar uma tarefa como pronta: `npx tsc --noEmit` limpo.
