// Links principais do app, usados pela Sidebar, pela BottomNav e pelas abas do cabeçalho.
// Ícones: SVG inline 24x24, só traço (stroke), no padrão do monday-v2.

import type { ReactNode } from 'react'

export interface LinkNavegacao {
  href: string
  rotulo: string
  icone: (classe?: string) => ReactNode
}

const svg = (classe: string | undefined, caminhos: ReactNode) => (
  <svg
    className={classe ?? 'w-5 h-5'}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {caminhos}
  </svg>
)

export const LINKS: LinkNavegacao[] = [
  {
    href: '/',
    rotulo: 'Visão geral',
    icone: c => svg(c, <><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></>),
  },
  {
    href: '/riscos',
    rotulo: 'Riscos',
    icone: c => svg(c, <><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></>),
  },
  {
    href: '/quadros',
    rotulo: 'Quadros',
    icone: c => svg(c, <><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" /></>),
  },
]

export const estaAtivo = (href: string, caminho: string) =>
  href === '/' ? caminho === '/' : caminho === href || caminho.startsWith(href + '/')

// Abas da pílula do cabeçalho nas páginas principais.
export const ABAS = LINKS.map(l => l.href)
