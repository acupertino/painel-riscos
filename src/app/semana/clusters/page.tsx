'use client'

import { useSemana } from '@/components/semana/ContextoSemana'
import { EtiquetaArea, EtiquetaNivel, Vazio } from '@/components/semana/Etiquetas'
import { CLUSTER_COR } from '@/lib/calendario'
import { agruparPorAssunto, dataCurta, estaVencida, nomeBase } from '@/lib/semana'

// Visão por assunto: um card por cluster; ações iguais de cursos diferentes numa linha só.
export default function Clusters() {
  const { filtradas, dependencias, hoje } = useSemana()
  if (!filtradas.length) return <Vazio texto="Nenhuma ação com término nesta semana." />
  const assuntos = agruparPorAssunto(filtradas, dependencias)

  return (
    <div className="grid gap-4 xl:grid-cols-2 items-start">
      {assuntos.map(a => (
        <section
          key={a.cluster}
          className="rounded-xl bg-white border border-slate-200 border-l-4 shadow-sm p-4"
          style={{ borderLeftColor: CLUSTER_COR[a.cluster] }}
        >
          <header className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-slate-800">{a.cluster}</h2>
            <span className="text-sm text-slate-500">
              {a.acoes.length} {a.acoes.length === 1 ? 'ação' : 'ações'}
            </span>
            {a.criticas > 0 && <EtiquetaNivel nivel="crítico" />}
            <div className="ml-auto flex flex-wrap gap-1">
              {a.areas.map(x => (
                <EtiquetaArea key={x} area={x} />
              ))}
            </div>
          </header>
          <ul className="mt-3 space-y-2">
            {a.linhas.map(l => {
              const vencida = l.acoes.some(x => estaVencida(x, hoje))
              const deps = dependencias.filter(d => l.acoes.some(x => x.id === d.acao.id) && d.nivel !== 'ok')
              return (
                <li key={[l.nome, l.area, l.inicio, l.termino].join('|')}className="rounded-lg bg-slate-50 px-3 py-2">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-semibold text-slate-700 tabular-nums">
                      {l.inicio && l.inicio !== l.termino ? `${dataCurta(l.inicio)}–` : ''}
                      {dataCurta(l.termino)}
                    </span>
                    <span className="text-sm text-slate-800">
                      {vencida && '⚠️ '}
                      {l.nome}
                    </span>
                    <EtiquetaArea area={l.area} />
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">{l.cursos.join(' · ')}</p>
                  {deps.map(d => (
                    <p key={d.acao.id} className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
                      <EtiquetaNivel nivel={d.nivel} />
                      depende de {nomeBase(d.anterior.nome)} [{d.anterior.area}]
                    </p>
                  ))}
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
