'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LINKS, estaAtivo } from '@/components/navegacao'

export default function Sidebar() {
  const caminho = usePathname()
  return (
    <aside className="hidden md:flex fixed inset-y-0 left-0 z-40 w-60 flex-col bg-white border-r border-slate-200">
      <div className="px-5 pt-6 pb-5 border-b border-slate-200">
        <p className="text-lg font-bold text-slate-800">Painel de Riscos</p>
        <p className="text-xs text-slate-500">Quadros da Monday</p>
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {LINKS.map(l => {
          const ativo = estaAtivo(l.href, caminho)
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                ativo ? 'bg-slate-100 text-slate-800 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              {l.icone('w-5 h-5')}
              {l.rotulo}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
