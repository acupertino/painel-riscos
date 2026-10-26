'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { COR_NIVEL, CRITERIO_NIVEL, type NivelAlerta } from '@/lib/semana'

const NIVEIS: { nivel: NivelAlerta; icone: string; rotulo: string }[] = [
  { nivel: 'crítico', icone: '⚠️', rotulo: 'Crítico' },
  { nivel: 'atenção', icone: '⏱', rotulo: 'Atenção' },
  { nivel: 'ok', icone: '✓', rotulo: 'Ok' },
]

const NOTA =
  'Vale para ações que dependem de outra área no mesmo curso, módulo e UC. ' +
  'Somente um dia útil = a ação começa no dia útil seguinte ao fim da anterior. ' +
  '⚠️ antes do nome da ação = prazo vencido sem conclusão.'

// Ao lado dos filtros (compacta): letras menores e a nota num ⓘ, para ocupar pouco espaço.
function Itens({ compacta }: { compacta?: boolean }) {
  const texto = compacta ? 'text-[10px] leading-3.5' : 'text-[11px] leading-4'
  return (
    <>
      <ul className={compacta ? 'space-y-0.5' : 'space-y-1.5'}>
        {NIVEIS.map(n => (
          <li key={n.nivel} className={`flex items-center ${compacta ? 'gap-1.5' : 'gap-2'}`}>
            <span
              className={`shrink-0 inline-flex items-center gap-1 rounded-full px-1.5 font-semibold text-slate-800 ${texto}`}
              style={{ backgroundColor: COR_NIVEL[n.nivel].suave }}
            >
              <span aria-hidden="true">{n.icone}</span>
              {n.rotulo}
            </span>
            <span className={`text-slate-600 ${texto} ${compacta ? 'whitespace-nowrap' : ''}`}>{CRITERIO_NIVEL[n.nivel]}</span>
          </li>
        ))}
      </ul>
      {!compacta && <p className="mt-2 text-[10px] leading-3.5 text-slate-500">{NOTA}</p>}
    </>
  )
}

// Legenda fixa dos níveis de risco, ao lado dos filtros. Em telas a partir de xl fica aberta;
// nas menores vira um botão que abre a legenda num popover.
export default function LegendaRisco() {
  const [aberta, setAberta] = useState(false)
  const [posicao, setPosicao] = useState({ top: 0, right: 0 })
  const botaoRef = useRef<HTMLButtonElement>(null)
  const painelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!aberta) return
    const fora = (e: MouseEvent) => {
      const alvo = e.target as Node
      if (!painelRef.current?.contains(alvo) && !botaoRef.current?.contains(alvo)) setAberta(false)
    }
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setAberta(false)
    document.addEventListener('mousedown', fora)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', fora)
      document.removeEventListener('keydown', esc)
    }
  }, [aberta])

  const alternar = () => {
    if (!aberta && botaoRef.current) {
      const r = botaoRef.current.getBoundingClientRect()
      setPosicao({ top: r.bottom + 8, right: Math.max(16, window.innerWidth - r.right) })
    }
    setAberta(!aberta)
  }

  return (
    <>
      <div className="hidden xl:block text-left rounded-lg bg-white ring-1 ring-slate-200 shadow-sm px-2 py-1.5">
        <p className="mb-0.5 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide text-marca-marinho">
          Legenda de risco
          <span title={NOTA} className="cursor-help normal-case text-[11px] text-slate-400 hover:text-marca-marinho" aria-label={NOTA}>ⓘ</span>
        </p>
        <Itens compacta />
      </div>
      <button
        ref={botaoRef}
        onClick={alternar}
        aria-expanded={aberta}
        className="xl:hidden inline-flex items-center gap-1.5 rounded-full bg-white shadow-sm ring-1 ring-slate-200 px-3 py-1.5 text-xs font-semibold text-marca-marinho hover:bg-marca-claro"
      >
        <span className="flex gap-0.5">
          {NIVEIS.map(n => (
            <span key={n.nivel} className="w-2 h-2 rounded-full" style={{ backgroundColor: COR_NIVEL[n.nivel].forte }} />
          ))}
        </span>
        Legenda
      </button>
      {aberta &&
        createPortal(
          <div
            ref={painelRef}
            className="fixed z-[60] w-80 rounded-xl bg-white border border-slate-200 shadow-lg p-3 animate-fade-in"
            style={{ top: posicao.top, right: posicao.right }}
          >
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Legenda de risco</p>
            <Itens />
          </div>,
          document.body,
        )}
    </>
  )
}
