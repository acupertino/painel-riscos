'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LINKS, estaAtivo } from '@/components/navegacao'

export default function Sidebar() {
  const caminho = usePathname()
  return (
    <aside className="hidden md:flex fixed inset-y-0 left-0 z-40 w-60 flex-col bg-white border-r border-slate-200">
      {/* 116px = altura do PageHeader com a faixa da marca: a linha fica no mesmo nível. */}
      <div className="h-[116px] shrink-0 flex items-center px-5 border-b border-slate-200">
        <Image src="/logo-instituto-anima.png" alt="Instituto Ânima" width={5327} height={882} priority className="w-44 h-auto" />
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {LINKS.map(l => {
          const ativo = estaAtivo(l.href, caminho)
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                ativo ? 'bg-marca-claro text-marca-marinho font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-marca-marinho'
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
