// Links principais do app, usados pela Sidebar, pela BottomNav e pelas abas do cabeçalho.
// Ícones: SVG inline 24x24, só traço (stroke), no padrão do monday-v2.

import type { ReactNode } from 'react'

export interface LinkNavegacao {
  href: string
  rotulo: string
  rotuloCurto?: string // BottomNav e pílula do cabeçalho
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
    href: '/semana',
    rotulo: 'Ações da semana',
    rotuloCurto: 'Ações',
    icone: c => svg(c, <><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><path d="m9 16 2 2 4-4" /></>),
  },
  {
    href: '/semana/clusters',
    rotulo: 'Clusters',
    icone: c => svg(c, <><circle cx="7" cy="7" r="3" /><circle cx="17" cy="7" r="3" /><circle cx="7" cy="17" r="3" /><circle cx="17" cy="17" r="3" /></>),
  },
  {
    href: '/semana/dependencias',
    rotulo: 'Dependências',
    icone: c => svg(c, <><rect x="2" y="3" width="7" height="6" rx="1" /><rect x="15" y="15" width="7" height="6" rx="1" /><path d="M5.5 9v4a2 2 0 0 0 2 2h7.5" /><path d="m12 12 3 3-3 3" /></>),
  },
  {
    href: '/semana/gantt',
    rotulo: 'Gantt',
    icone: c => svg(c, <><line x1="3" y1="4" x2="3" y2="20" /><rect x="6" y="5" width="8" height="3" rx="1" /><rect x="10" y="10.5" width="9" height="3" rx="1" /><rect x="8" y="16" width="7" height="3" rx="1" /></>),
  },
  {
    href: '/semana/previsao',
    rotulo: 'Previsão de riscos',
    rotuloCurto: 'Previsão',
    icone: c => svg(c, <><polyline points="3 17 9 11 13 15 21 7" /><polyline points="15 7 21 7 21 13" /></>),
  },
  {
    href: '/semana/pauta',
    rotulo: 'Pauta do squad',
    rotuloCurto: 'Pauta',
    icone: c => svg(c, <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="13" y2="17" /></>),
  },
  {
    href: '/semana/comex',
    rotulo: 'COMEX',
    icone: c => svg(c, <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>),
  },
]

// Área restrita (só com senha): não aparece na Sidebar nem na BottomNav; entra-se pelo botão
// discreto no rodapé da Sidebar. Os planos usam os slugs de PLANOS em src/lib/planos.ts.
export const RESTRITO = '/semana/restrito'

export const LINKS_RESTRITOS: LinkNavegacao[] = [
  {
    href: RESTRITO,
    rotulo: 'Pendências da semana',
    rotuloCurto: 'Pendências',
    icone: c => svg(c, <><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></>),
  },
  {
    href: `${RESTRITO}/avaliacoes`,
    rotulo: 'Avaliações',
    icone: c => svg(c, <><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /><line x1="2" y1="13" x2="22" y2="13" /></>),
  },
  {
    href: `${RESTRITO}/comunicacao`,
    rotulo: 'Plano de Comunicação',
    rotuloCurto: 'Comunicação',
    icone: c => svg(c, <><path d="m3 11 18-8v18L3 13z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" /></>),
  },
  {
    href: `${RESTRITO}/credenciamento-ia-mec`,
    rotulo: 'Credenciamento IA no MEC',
    rotuloCurto: 'Credenciamento MEC',
    icone: c => svg(c, <><circle cx="12" cy="8" r="6" /><path d="M15.5 13 17 22l-5-3-5 3 1.5-9" /></>),
  },
  {
    href: `${RESTRITO}/comunicacao-institucional`,
    rotulo: 'Comunicação Institucional',
    rotuloCurto: 'Com. Institucional',
    icone: c => svg(c, <><path d="M3 21h18" /><path d="M5 21V10l7-5 7 5v11" /><line x1="9" y1="21" x2="9" y2="14" /><line x1="15" y1="21" x2="15" y2="14" /></>),
  },
  {
    href: `${RESTRITO}/eixo-advocacy`,
    rotulo: 'Eixo Advocacy',
    rotuloCurto: 'Advocacy',
    icone: c => svg(c, <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></>),
  },
  {
    href: `${RESTRITO}/novos-estados`,
    rotulo: 'Plano de Ação Novos Estados',
    rotuloCurto: 'Novos Estados',
    icone: c => svg(c, <><path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" /></>),
  },
  {
    href: `${RESTRITO}/encaminhamentos-squad`,
    rotulo: 'Encaminhamentos de SQUAD',
    rotuloCurto: 'Encaminhamentos',
    icone: c => svg(c, <><polyline points="15 10 20 15 15 20" /><path d="M4 4v7a4 4 0 0 0 4 4h12" /></>),
  },
]

export const TODOS_OS_LINKS = [...LINKS, ...LINKS_RESTRITOS]

export const estaAtivo = (href: string, caminho: string) => caminho === href

// Abas da pílula do cabeçalho nas páginas da semana e na área restrita.
export const ABAS_SEMANA = LINKS.filter(l => l.href.startsWith('/semana')).map(l => l.href)
export const ABAS_RESTRITAS = LINKS_RESTRITOS.map(l => l.href)
