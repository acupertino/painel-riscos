'use client'

import { useMemo, useState } from 'react'
import { useSemana } from '@/components/semana/ContextoSemana'
import { EtiquetaNivel, Vazio } from '@/components/semana/Etiquetas'
import { COR_NIVEL, dataCurta, montarPauta, pautaEmTexto } from '@/lib/semana'

// Pauta do squad: usa todas as ações da semana (sem os filtros das outras abas).
export default function Pauta() {
  const { semana, daSemana, todas, hoje } = useSemana()
  const blocos = useMemo(() => montarPauta(semana, daSemana, todas, hoje), [semana, daSemana, todas, hoje])
  const [copiado, setCopiado] = useState(false)

  if (!daSemana.length) return <Vazio texto="Nenhuma ação com término nesta semana: sem pauta." />

  const copiar = async () => {
    await navigator.clipboard.writeText(pautaEmTexto(semana, blocos))
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <article className="rounded-xl bg-white border border-slate-200 shadow-sm p-4 md:p-6 space-y-6">
      <header className="flex flex-wrap items-start gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            Pauta do Squad · semana de {dataCurta(semana.inicio)} a {dataCurta(semana.fim)}
          </h2>
          <p className="text-sm text-slate-500">
            Gerada a partir do Calendário Detalhado da Monday ({daSemana.length} ações com término na semana).
          </p>
        </div>
        <button
          onClick={copiar}
          className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-marca-marinho px-4 py-2 text-sm font-semibold text-white hover:bg-marca-azul-escuro"
        >
          {copiado ? 'Copiado!' : 'Copiar pauta'}
        </button>
      </header>

      {blocos.map((b, i) => (
        <section key={b.titulo}>
          <h3 className="text-base font-semibold text-slate-800">
            {i + 1}. {b.titulo}
          </h3>
          <p className="text-xs text-slate-500">{b.descricao}</p>
          <ul className="mt-2 space-y-2">
            {b.itens.map((it, j) => (
              <li
                key={j}
                className="rounded-lg bg-slate-50 px-3 py-2 border-l-4"
                style={{ borderLeftColor: it.nivel ? COR_NIVEL[it.nivel].forte : '#e2e8f0' }}
              >
                <div className="flex flex-wrap items-start gap-2">
                  {it.nivel && <EtiquetaNivel nivel={it.nivel} />}
                  <p className="text-sm text-slate-800 flex-1 min-w-0">{it.texto}</p>
                </div>
                {it.detalhes && it.detalhes.length > 0 && (
                  <ul className="mt-1 ml-1 space-y-0.5">
                    {it.detalhes.map((d, k) => (
                      <li key={k} className="text-xs text-slate-600">– {d}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </article>
  )
}
