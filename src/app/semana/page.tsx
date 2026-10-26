'use client'

import { useSemana } from '@/components/semana/ContextoSemana'
import { EtiquetaArea, EtiquetaCluster, EtiquetaNivel, EtiquetaStatus, Vazio } from '@/components/semana/Etiquetas'
import { rotuloCurso, type Acao } from '@/lib/calendario'
import { dataCurta, diaDaSemana, estaVencida, nomeBase, periodo } from '@/lib/semana'

// Visão por linha: cada ação com término na semana, agrupada pelo dia do término.
export default function AcoesDaSemana() {
  const { filtradas, dependencias, hoje } = useSemana()
  if (!filtradas.length) return <Vazio texto="Nenhuma ação com término nesta semana." />

  const porDia = new Map<string, Acao[]>()
  for (const a of filtradas) porDia.set(a.termino!, [...(porDia.get(a.termino!) ?? []), a])
  const depDe = new Map(dependencias.map(d => [d.acao.id, d]))

  return (
    <div className="space-y-4">
      {[...porDia.entries()].map(([dia, acoes]) => (
        <section key={dia} className="rounded-xl bg-white border border-slate-200 shadow-sm">
          <h2 className="px-4 pt-3 pb-2 text-sm font-semibold text-slate-800 border-b border-slate-100">
            {dataCurta(dia)} · {diaDaSemana(dia)}
            <span className="ml-2 font-normal text-slate-500">
              {acoes.length} {acoes.length === 1 ? 'prazo' : 'prazos'}
            </span>
            {dia === hoje && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">hoje</span>}
          </h2>
          <ul className="divide-y divide-slate-100">
            {acoes.map(a => {
              const dep = depDe.get(a.id)
              const vencida = estaVencida(a, hoje)
              return (
                <li key={a.id} className="px-4 py-3 grid gap-2 md:grid-cols-[1fr_auto] md:items-start">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800">
                      {vencida && <span title="Prazo vencido sem conclusão">⚠️ </span>}
                      {nomeBase(a.nome)}
                      <span className="font-normal text-slate-500"> · {rotuloCurso(a)}</span>
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <EtiquetaCluster cluster={a.cluster} />
                      <span className="text-xs text-slate-500">{periodo(a)}</span>
                      <EtiquetaStatus status={a.status} />
                    </div>
                    {dep && (
                      <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
                        <EtiquetaNivel nivel={dep.nivel} />
                        depende de <span className="font-medium text-slate-800">{nomeBase(dep.anterior.nome)}</span>
                        <EtiquetaArea area={dep.anterior.area} />
                        <span className="text-slate-500">· {dep.motivo}</span>
                      </p>
                    )}
                    {(a.repactuacao || a.observacoes) && (
                      <p className="mt-1.5 text-xs text-slate-500">{a.repactuacao ?? a.observacoes}</p>
                    )}
                  </div>
                  <div className="md:text-right">
                    <EtiquetaArea area={a.area} />
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
