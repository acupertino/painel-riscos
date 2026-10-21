'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LINKS, estaAtivo } from '@/components/navegacao'

export default function BottomNav() {
  const caminho = usePathname()
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 h-16 flex bg-white border-t border-slate-200">
      {LINKS.map(l => {
        const ativo = estaAtivo(l.href, caminho)
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-xs ${
              ativo ? 'text-slate-800 font-semibold' : 'text-slate-500'
            }`}
          >
            {l.icone('w-5 h-5')}
            {l.rotulo}
          </Link>
        )
      })}
    </nav>
  )
}
