'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LINKS, estaAtivo } from '@/components/navegacao'

interface Props {
  titulo: string
  subtitulo?: string
  // hrefs dos LINKS que aparecem na pílula (strings, para poder vir de páginas de servidor)
  abas?: string[]
  direita?: ReactNode // ex.: legenda fixa, à direita do título
}

// Cabeçalho claro preso no topo, com a faixa do degradê da marca embaixo. É sticky (e não
// fixed) porque a altura muda com abas e legenda: assim o conteúdo nunca fica escondido.
export default function PageHeader({ titulo, subtitulo, abas: hrefs, direita }: Props) {
  const caminho = usePathname()
  const abas = LINKS.filter(l => hrefs?.includes(l.href))

  return (
    <header className="sticky top-0 z-30 bg-white shadow-sm">
      {/* md:h-28 + faixa h-1 = 116px, a mesma altura do bloco do logo na Sidebar (linhas alinhadas). */}
      <div className="py-3 px-4 md:px-8 md:h-28 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-4">
        <div className="hidden md:block" />
        <div className="text-center">
          <h1 className="text-xl font-bold text-marca-roxo">{titulo}</h1>
          {subtitulo && <p className="text-xs text-slate-500">{subtitulo}</p>}
          {abas.length > 0 && (
            <nav className="hidden md:inline-flex mt-2 items-center gap-1 rounded-full bg-slate-100 ring-1 ring-slate-200 p-1">
              {abas.map(a => {
                const ativo = estaAtivo(a.href, caminho)
                return (
                  <Link
                    key={a.href}
                    href={a.href}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold transition-colors ${
                      ativo ? 'bg-marca-marinho text-white shadow-sm' : 'text-slate-600 hover:text-marca-marinho hover:bg-white'
                    }`}
                  >
                    {a.icone('w-4 h-4')}
                    {a.rotuloCurto ?? a.rotulo}
                  </Link>
                )
              })}
            </nav>
          )}
        </div>
        {direita && <div className="mt-3 flex justify-center md:mt-0 md:justify-end">{direita}</div>}
      </div>
      <div className="faixa-marca h-1" aria-hidden="true" />
    </header>
  )
}
