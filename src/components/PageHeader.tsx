'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LINKS, estaAtivo } from '@/components/navegacao'

interface Props {
  titulo: string
  subtitulo?: string
  // hrefs dos LINKS que aparecem na pílula (strings, para poder vir de páginas de servidor)
  abas?: string[]
}

// Cabeçalho slate fixo no topo; o conteúdo abaixo precisa de pt-[120px].
export default function PageHeader({ titulo, subtitulo, abas: hrefs }: Props) {
  const caminho = usePathname()
  const abas = LINKS.filter(l => hrefs?.includes(l.href))
  return (
    <header className="fixed top-0 left-0 right-0 md:left-60 z-30 bg-slate-600 border-b border-slate-500 pt-6 pb-5">
      <div className="text-center px-4">
        <h1 className="text-2xl font-bold text-white">{titulo}</h1>
        {subtitulo && <p className="text-sm text-slate-300">{subtitulo}</p>}
      </div>
      {abas.length > 0 && (
        <div className="hidden lg:block absolute right-4 md:right-8 top-1/2 -translate-y-1/2">
          <nav className="inline-flex items-center gap-1 rounded-full bg-white/10 ring-1 ring-white/15 p-1 backdrop-blur-sm">
            {abas.map(a => {
              const ativo = estaAtivo(a.href, caminho)
              return (
                <Link
                  key={a.href}
                  href={a.href}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                    ativo ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-200 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {a.icone('w-4 h-4')}
                  {a.rotulo}
                </Link>
              )
            })}
          </nav>
        </div>
      )}
    </header>
  )
}
