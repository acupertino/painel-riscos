'use client'

import PageHeader from '@/components/PageHeader'
import GraficoRiscosPorQuadro from '@/components/GraficoRiscosPorQuadro'
import { ABAS } from '@/components/navegacao'
import { EXEMPLO_RISCOS_POR_QUADRO, NIVEIS, type ContagemRiscos } from '@/lib/riscos'

export default function VisaoGeral() {
  const totais = Object.fromEntries(
    NIVEIS.map(n => [n.chave, EXEMPLO_RISCOS_POR_QUADRO.reduce((s, q) => s + q[n.chave], 0)]),
  ) as ContagemRiscos
  const mapeados = Object.values(totais).reduce((s, v) => s + v, 0)

  const kpis = [
    { rotulo: 'Riscos mapeados', valor: mapeados, cor: '#64748b' },
    { rotulo: 'Altos', valor: totais.alto, cor: '#f87171' },
    { rotulo: 'Médios', valor: totais.medio, cor: '#facc15' },
    { rotulo: 'Baixos', valor: totais.baixo, cor: '#34d399' },
  ]

  return (
    <>
      <PageHeader titulo="Painel de Riscos" subtitulo="Análise de riscos dos quadros da Monday" abas={ABAS} />
      <main className="pt-[120px] px-4 md:px-8 pb-8 space-y-4 animate-fade-in-up">
        <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
          {kpis.map(k => (
            <div
              key={k.rotulo}
              className="rounded-xl bg-white border border-slate-200 shadow-sm p-4 border-l-4"
              style={{ borderLeftColor: k.cor }}
            >
              <p className="text-sm text-slate-500">{k.rotulo}</p>
              <p className="mt-1 text-3xl font-bold text-slate-800 tabular-nums">{k.valor}</p>
            </div>
          ))}
        </div>

        <section className="rounded-xl bg-white border border-slate-200 shadow-sm p-4">
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <h2 className="text-base font-semibold text-slate-800">Riscos por quadro</h2>
            <span className="text-xs text-slate-400">dados fictícios</span>
          </div>
          <GraficoRiscosPorQuadro dados={EXEMPLO_RISCOS_POR_QUADRO} />
        </section>
      </main>
    </>
  )
}
