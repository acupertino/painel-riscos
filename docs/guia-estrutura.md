# Guia de estrutura — base para um novo app no padrão do monday-v2

Referência: o app atual `monday-v2` (Portfólio de Projetos / Árvore de Indicadores).
Referência visual ao vivo: https://monday-v2-7jc2.vercel.app/ (ex.: `/arvores-indicadores`,
`/arvores-indicadores/painel`, `/arvores-indicadores/arvore`). Contém dados internos: não repassar.
Use este guia para começar o novo projeto com o mesmo visual e a mesma arquitetura.

---

## 1. Stack (linguagem e bibliotecas)

| Item | Versão / uso |
|---|---|
| Linguagem | **TypeScript** (modo `strict`) |
| Framework | **Next.js 16** (App Router) + **React 19** |
| Estilo | **Tailwind CSS 4** (via `@tailwindcss/postcss`; sem `tailwind.config`, tudo em `globals.css` com `@import "tailwindcss"`) |
| Gráficos | **Recharts 3** (precisa de `transpilePackages: ['recharts']` no `next.config.ts`) |
| Fonte | **Geist** e Geist Mono (`next/font/google`) |
| Planilhas | `xlsx` (ler/gerar Excel) |
| Screenshots / PDF | `playwright` (dev) |
| Lint | ESLint 9 + `eslint-config-next` |

> Atenção: o Next 16 tem mudanças em relação às versões anteriores. Antes de escrever código,
> o Claude deve ler os guias em `node_modules/next/dist/docs/` (regra do `AGENTS.md`).

Criar o projeto:
```bash
npx create-next-app@latest nome-do-app --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd nome-do-app
npm install recharts xlsx
npm install -D playwright
```

---

## 2. Estrutura de pastas

```
src/
  app/
    layout.tsx          ← layout raiz (fonte Geist + shell com sidebar)
    globals.css         ← Tailwind + variáveis de cor + animações
    page.tsx            ← página inicial
    <secao>/page.tsx    ← cada página (ex.: arvores-indicadores/painel/page.tsx)
    api/<rota>/route.ts ← rotas de API (servidor): conversam com Monday etc.
  components/           ← componentes reutilizáveis (Sidebar, Nav da seção, cards…)
  lib/                  ← regras de negócio e dados (cálculos, mapeamentos, dados manuais)
  types/                ← tipos TypeScript (ex.: types/monday.ts)
data/                   ← JSON de persistência local (classificações, validações)
.cache/                 ← cache em disco de respostas de API (no .gitignore)
externos/               ← arquivos de entrada/saída sensíveis (no .gitignore)
```

Alias de import: `@/` = `src/` (ex.: `import { x } from '@/lib/painel'`).

---

## 3. Arquitetura (como as peças conversam)

```
Página (client, 'use client')
   │  fetch('/api/minha-rota')
   ▼
Rota de API (server, src/app/api/.../route.ts)
   │  lê token do .env.local → chama a API da Monday (GraphQL)
   │  guarda o resultado em .cache/*.json (TTL ~30 min, ?refresh=1 força)
   ▼
lib/*.ts  → transforma os dados (classificar, agrupar, calcular %)
   ▼
Página renderiza cards, listas e gráficos (Recharts)
```

Regras usadas no projeto atual:
- **Token nunca vai para o navegador**: toda chamada à Monday passa por uma rota `/api/...`.
- **Cache em disco** (`.cache/`) com tempo de validade e `?refresh=1` para forçar atualização.
- **Dados manuais** (metas, números de planilhas) ficam em `src/lib/*.ts` como constantes,
  com comentário dizendo a fonte e a data.
- **Persistência simples** em `data/*.json` via rotas de API com `GET` e `PATCH`. O `PATCH`
  envia **só as linhas alteradas** e o servidor faz merge, para uma aba aberta não
  sobrescrever o trabalho de outra.
- Chave estável das linhas: `quadroId|grupo|nome|oferta`.

### Conexão com a Monday
- Endpoint: `https://api.monday.com/v2` (GraphQL, `POST`)
- Headers: `Authorization: <MONDAY_API_TOKEN>`, `API-Version: 2024-10` (usar `2025-10` se precisar de
  `change_item_position`), `Content-Type: application/json`
- Paginação: `items_page(limit: 200) { cursor items {...} }` e depois `next_items_page(cursor: ...)`
- Exemplo mínimo de rota:

```ts
// src/app/api/meu-quadro/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  const res = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: process.env.MONDAY_API_TOKEN ?? '',
      'API-Version': '2024-10',
    },
    body: JSON.stringify({ query: '{ boards(ids: [123]) { name items_page(limit: 200) { items { id name } } } }' }),
    cache: 'no-store',
  })
  const j = await res.json()
  if (j.errors) return NextResponse.json({ error: j.errors }, { status: 502 })
  return NextResponse.json(j.data)
}
```

### Variáveis de ambiente (`.env.local`, nunca no git)
```
MONDAY_API_TOKEN=
# outras integrações, se usar:
ONGSYS_CNPJ=
ONGSYS_APIKEY=
```
Versione um `.env.example` com os nomes e sem os valores.

---

## 4. Layout

### Casca da aplicação
- `<body className="min-h-screen flex">`
- **Sidebar fixa à esquerda**, com 240 px (`w-60`), visível a partir de `md`. O conteúdo usa `md:ml-60`.
- No celular, a sidebar some e aparece uma **barra inferior** (`BottomNav`); o conteúdo ganha `pb-16`.
- Fundo do conteúdo: `bg-gray-50`.

### Página no padrão da Árvore de Indicadores
1. **Cabeçalho fixo no topo**, em slate:
   ```
   fixed top-0 left-0 right-0 md:left-60 z-30
   bg-slate-600 border-b border-slate-500 pt-6 pb-5
   ```
   - Título centralizado: `text-2xl font-bold text-white`
   - Subtítulo: `text-sm text-slate-300`
   - À direita: **navegação da seção em pílula** (`absolute right-4 md:right-8`)
   - À esquerda, quando houver: botão ou alternador no mesmo estilo de pílula
2. **Conteúdo** abaixo do cabeçalho, com `pt-[~120px]` para não ficar escondido.
   Grid de cards (`grid gap-4 xl:grid-cols-4`).
3. **Cards**: `rounded-xl bg-white border border-slate-200 shadow-sm p-4`.
   Para cards por categoria, use uma borda esquerda colorida: `border-l-4` + `borderLeftColor`.
4. **Legendas e tooltips de hover**: renderize via `createPortal(..., document.body)` com
   `fixed z-[60]`, para não ficarem cortados por outros cards.

### Navegação da seção (pílula), copiável
```tsx
<nav className="inline-flex items-center gap-1 rounded-full bg-white/10 ring-1 ring-white/15 p-1 backdrop-blur-sm">
  <Link className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold
     ${ativo ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-200 hover:text-white hover:bg-white/10'}`}>
    <svg className="w-4 h-4" …/> Resumo
  </Link>
</nav>
```
Ícones: SVG inline, `viewBox="0 0 24 24"`, `stroke="currentColor"`, `strokeWidth={2}`, sem preenchimento.

### Animações (`globals.css`)
`fadeIn`, `fadeOut` e `fadeInUp` (de `translateY(8px)` para `0`). Barras e linhas do Recharts usam
`animationDuration={450}` com `ease-out`. Scrollbar fina (4 px, `#e2e8f0`).

---

## 5. Cores

### Base
| Uso | Cor |
|---|---|
| Fundo geral | `#f8fafc` (variável `--background`) / `bg-gray-50` |
| Texto | `#171717` (variável `--foreground`) / `text-slate-800` |
| Cabeçalho | `slate-600` (`#475569`), borda `slate-500` |
| Cards | branco, borda `slate-200` |

### Status (versão forte e versão suave)
| Status | Forte | Suave (baterias e barras) |
|---|---|---|
| Concluído | `#34d399` | `#6ee7b7` |
| Em andamento | `#facc15` | `#fde68a` |
| Em atraso | `#f87171` | `#fca5a5` |
| A iniciar | `#3b82f6` | `#93c5fd` |
| Outros | `#94a3b8` | `#cbd5e1` |
| Sem status | `#d1d5db` | `#e5e7eb` |

### Categorias / macroáreas (borda esquerda dos cards)
| Tom | Hex |
|---|---|
| blue | `#3b82f6` |
| emerald | `#10b981` |
| violet | `#8b5cf6` |
| amber | `#f59e0b` |
| rose | `#f43f5e` |
| slate | `#64748b` |

### Áreas (gerências)
GDA `#60a5fa` · GFOR `#fb923c` · GIPE `#34d399` · GIMP `#facc15` · GEOP `#c084fc` ·
CPE `#4ade80` · GDE `#f472b6` · Outras `#d1d5db`

Hierarquia da árvore: IT em `blue-50` com borda `blue-100`; IO em `emerald-50` com borda `emerald-100`.

---

## 6. Padrões de código

- Componentes de página interativos começam com `'use client'`; rotas de API rodam no servidor.
- Nomes em **português** (`calcularPendencias`, `linhasPorArea`), como no projeto atual.
- Constantes de domínio em `lib/` (ex.: `STATUS_CATEGORIAS`, `AREA_CORES`, `AREA_ORDEM`).
- Comentários curtos explicando a **regra de negócio e a fonte do dado**, não o óbvio.
- Texto da interface: "**a** Monday" (sempre no feminino).
- Rodar `npx tsc --noEmit` antes de dar uma tarefa como pronta.

---

## 7. Segurança e git

- `.gitignore`: `node_modules/`, `.next/`, `.env*.local`, `.cache/`, `externos/`, `*.tsbuildinfo`.
- Nada de token, base de cursistas ou dado financeiro no repositório.
- Trabalho a dois: branch por tarefa, Pull Request para a `main` e proteção da `main` no GitHub.
- O hook de auto-commit e push do projeto atual **não** deve ser copiado: ele empurra direto para
  a branch principal.

---

## 8. Ordem sugerida para começar

1. Criar o projeto (seção 1) e o repositório no GitHub.
2. Colar as cores, as animações e a scrollbar no `globals.css`; configurar a fonte Geist no `layout.tsx`.
3. Criar a casca: `Sidebar`, `BottomNav` e o shell, mesmo que com um link só.
4. Criar o cabeçalho slate fixo e a navegação em pílula da seção.
5. Criar a primeira rota `/api/...` com a Monday, mais o cache em `.cache/`.
6. Criar o `lib/` com as regras de negócio e montar a primeira página com cards e gráfico.
7. Escrever o `CLAUDE.md` do projeto novo com as regras deste guia (Next 16, Monday no feminino,
   segredos fora do git, branch e PR).
