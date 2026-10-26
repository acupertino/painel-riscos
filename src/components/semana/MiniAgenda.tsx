'use client'

import { useMemo, useState } from 'react'
import { passaFiltro, useSemana } from '@/components/semana/ContextoSemana'
import { somarDias } from '@/lib/semana'

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const LETRAS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'] // por getUTCDay (0 = domingo)

// Primeiro dia (AAAA-MM-01) do mês da data, deslocado em `passo` meses.
const mesDe = (iso: string, passo = 0) => {
  const [a, m] = iso.split('-').map(Number)
  return new Date(Date.UTC(a, m - 1 + passo, 1)).toISOString().slice(0, 10)
}
const diaDaSemana = (iso: string) => new Date(`${iso}T12:00:00Z`).getUTCDay()

// Mini agenda horizontal: os dias do mês numa linha. Clicar num dia leva para a semana dele.
// A bolinha indica dias com prazos (término previsto), respeitando os filtros.
export default function MiniAgenda() {
  const { semana, hoje, irParaData, todas, filtros } = useSemana()
  const [mes, setMes] = useState(() => mesDe(semana.inicio))
  const [mesDaSemana, setMesDaSemana] = useState(semana.inicio)

  // Ao trocar de semana pelas setas, a agenda acompanha o mês da semana escolhida.
  if (mesDaSemana !== semana.inicio) {
    setMesDaSemana(semana.inicio)
    setMes(mesDe(semana.inicio))
  }

  const prazosPorDia = useMemo(() => {
    const m = new Map<string, number>()
    for (const a of todas) if (a.termino && passaFiltro(a, filtros)) m.set(a.termino, (m.get(a.termino) ?? 0) + 1)
    return m
  }, [todas, filtros])

  const dias: string[] = []
  for (let d = mes; d.slice(0, 7) === mes.slice(0, 7); d = somarDias(d, 1)) dias.push(d)
  const maximo = Math.max(1, ...dias.map(d => prazosPorDia.get(d) ?? 0))
  const [ano, numMes] = mes.split('-').map(Number)

  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-white ring-1 ring-slate-200 px-1.5 py-1 max-w-full overflow-x-auto">
      <button onClick={() => setMes(mesDe(mes, -1))} className="w-6 h-6 shrink-0 rounded-full text-slate-500 hover:bg-slate-100" aria-label="Mês anterior">‹</button>
      <span className="w-11 shrink-0 text-center text-[11px] font-semibold text-marca-marinho">
        {MESES[numMes - 1]} {String(ano).slice(2)}
      </span>
      <div className="flex">
        {dias.map(d => {
          const n = prazosPorDia.get(d) ?? 0
          const naSemana = d >= semana.inicio && d <= semana.fim
          const fds = [0, 6].includes(diaDaSemana(d))
          return (
            <button
              key={d}
              onClick={() => irParaData(d)}
              title={`${d.slice(8)}/${d.slice(5, 7)} · ${n ? `${n} ${n === 1 ? 'prazo' : 'prazos'}` : 'sem prazos'}`}
              className={`flex flex-col items-center w-[18px] py-0.5 ${naSemana ? 'bg-marca-claro' : 'hover:bg-slate-50'} ${
                naSemana && d === semana.inicio ? 'rounded-l-md' : ''
              } ${naSemana && d === semana.fim ? 'rounded-r-md' : ''}`}
            >
              <span className={`text-[8px] leading-3 ${fds ? 'text-slate-300' : 'text-slate-400'}`}>{LETRAS[diaDaSemana(d)]}</span>
              <span
                className={`w-4 h-4 flex items-center justify-center rounded-full text-[10px] tabular-nums ${
                  d === hoje ? 'bg-marca-marinho text-white font-semibold' : naSemana ? 'text-slate-800 font-semibold' : fds ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                {Number(d.slice(8))}
              </span>
              <span
                className="w-1 h-1 rounded-full mt-px"
                style={{ backgroundColor: '#3b82f6', opacity: n ? 0.35 + 0.65 * (n / maximo) : 0 }}
              />
            </button>
          )
        })}
      </div>
      <button onClick={() => setMes(mesDe(mes, 1))} className="w-6 h-6 shrink-0 rounded-full text-slate-500 hover:bg-slate-100" aria-label="Próximo mês">›</button>
    </div>
  )
}
