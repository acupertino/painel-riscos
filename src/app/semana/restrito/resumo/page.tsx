'use client'

import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useSemana } from '@/components/semana/ContextoSemana'
import { Vazio } from '@/components/semana/Etiquetas'
import BarraMonday from '@/components/restrito/BarraMonday'
import { useFontesRestritas } from '@/components/restrito/useFontesRestritas'
import { LINKS_RESTRITOS } from '@/components/navegacao'
import { dataCurta } from '@/lib/semana'
import { montarAndamento, percentual, type Andamento } from '@/lib/relatorio'

// Resumo (pedido de 09/11/2026): resumo executivo (a lista operacional fica no Relatório), com o andamento do ano de todas as abas da área restrita. Uma bateria com o
// percentual realizado contra o previsto até hoje e colunas por frente. Regras em montarAndamento.

// Rampa azul ordinal (validada na skill de dataviz): previsto claro, realizado escuro.
const COR_PREVISTO = '#86b6ef'
const COR_REALIZADO = '#1c5cab'
const COR_MARCA_PREVISTO = '#0d366b'
const EIXO = { fontSize: 12, fill: '#64748b' }

const rotuloCurto = (href: string, aba: string) => {
  const l = LINKS_RESTRITOS.find(x => x.href === href)
  return l?.rotuloCurto ?? l?.rotulo ?? aba
}

export default function Resumo() {
  const { hoje } = useSemana()
  const { fontes, erros, carregando, geradoEm, buscar } = useFontesRestritas()
  const andamento = useMemo(() => (fontes ? montarAndamento(fontes, hoje) : null), [fontes, hoje])

  return (
    <div className="space-y-4">
      <BarraMonday
        quadros="todas as abas da área restrita"
        geradoEm={geradoEm}
        carregando={carregando}
        erro={erros.length ? erros.join(' · ') : null}
        aoAtualizar={() => buscar(true)}
      />
      {!andamento ? (
        <Vazio texto="Lendo todas as abas…" />
      ) : (
        <>
          <Bateria a={andamento} hoje={hoje} />
          <ColunasPorFrente a={andamento} />
          <p className="text-xs text-slate-500">
            Conta as ações com prazo previsto em {andamento.ano}, de todas as abas da área restrita. Ficam de fora as linhas-mãe da Monday (quando
            há subelementos, contam os subelementos), as canceladas, as com status “Previsto para 2027”, as esteiras de produção e os
            Encaminhamentos de SQUAD. {andamento.semPrazo} {andamento.semPrazo === 1 ? 'ação sem prazo não entra' : 'ações sem prazo não entram'} na conta.
          </p>
        </>
      )}
    </div>
  )
}

function Bateria({ a, hoje }: { a: Andamento; hoje: string }) {
  const realizado = percentual(a.realizadas, a.doAno)
  const previsto = percentual(a.previstas, a.doAno)
  const diferenca = realizado - previsto
  const indicadores = [
    { rotulo: `Ações com prazo em ${a.ano}`, valor: a.doAno },
    { rotulo: 'Concluídas', valor: a.realizadas },
    { rotulo: 'Previstas até hoje', valor: a.previstas },
    { rotulo: 'Previstas e ainda abertas', valor: a.atrasadas },
  ]
  return (
    <section className="rounded-xl bg-white border border-slate-200 shadow-sm p-4">
      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-base font-semibold text-slate-800">Andamento do ano</h2>
        <p className="text-xs text-slate-500">
          Ações com prazo até 31/12/{a.ano}: quanto já foi realizado e quanto era previsto até hoje ({dataCurta(hoje)}).
        </p>
      </header>

      <div className="mt-4 flex flex-col lg:flex-row lg:items-center gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-end gap-3">
            <p className="text-5xl font-bold text-marca-marinho tabular-nums">{realizado}%</p>
            <p className="pb-1.5 text-sm text-slate-600">
              realizado <span className="text-slate-400">·</span> previsto até hoje: <b className="text-slate-800">{previsto}%</b>
            </p>
          </div>

          {/* Bateria: preenchimento = realizado; traço tracejado = previsto até hoje. */}
          <div className="mt-8 mb-6 flex items-center" role="img" aria-label={`Realizado ${realizado}%, previsto até hoje ${previsto}%`}>
            <div className="relative h-14 flex-1 rounded-xl border-[3px] border-slate-700 p-1">
              <div className="relative h-full w-full overflow-hidden rounded-md bg-slate-100">
                <div
                  className="h-full rounded-md transition-[width] duration-[450ms] ease-out"
                  style={{ width: `${realizado}%`, backgroundColor: COR_REALIZADO }}
                />
              </div>
              <div className="absolute -top-7 bottom-[-6px]" style={{ left: `calc(${previsto}% )` }}>
                <div className="h-full border-l-2 border-dashed" style={{ borderColor: COR_MARCA_PREVISTO }} />
                <span
                  className="absolute -top-0.5 -translate-x-1/2 whitespace-nowrap rounded bg-white px-1 text-[11px] font-semibold"
                  style={{ color: COR_MARCA_PREVISTO }}
                >
                  previsto {previsto}%
                </span>
              </div>
            </div>
            <div className="ml-1 h-6 w-2 rounded-r bg-slate-700" />
          </div>

          <p className="text-sm text-slate-700">
            {diferenca >= 0 ? (
              <>Realizado está <b>{diferenca} pontos acima</b> do previsto até hoje.</>
            ) : (
              <>
                Realizado está <b>{-diferenca} pontos abaixo</b> do previsto até hoje: {a.atrasadas}{' '}
                {a.atrasadas === 1 ? 'ação deveria estar concluída e segue aberta' : 'ações deveriam estar concluídas e seguem abertas'}.
              </>
            )}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:w-80">
          {indicadores.map(k => (
            <div key={k.rotulo} className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
              <p className="text-xs text-slate-500 leading-tight">{k.rotulo}</p>
              <p className="text-xl font-bold text-slate-800 tabular-nums">{k.valor}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Rótulo do eixo em até duas linhas (os nomes das frentes são longos).
function TickFrente({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) {
  const palavras = (payload?.value ?? '').split(' ')
  const linhas: string[] = ['']
  for (const p of palavras) {
    const atual = linhas[linhas.length - 1]
    if (atual && (atual + ' ' + p).length > 16 && linhas.length < 2) linhas.push(p)
    else linhas[linhas.length - 1] = atual ? `${atual} ${p}` : p
  }
  return (
    <text x={x} y={(y ?? 0) + 14} textAnchor="middle" fontSize={12} fill="#475569">
      {linhas.map((l, i) => (
        <tspan key={i} x={x} dy={i ? 14 : 0}>
          {l}
        </tspan>
      ))}
    </text>
  )
}

type LinhaGrafico = { frente: string; previsto: number; realizado: number; doAno: number; previstas: number; realizadas: number; atrasadas: number }

function DicaFrente({ active, payload }: { active?: boolean; payload?: { payload: LinhaGrafico }[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-lg bg-white border border-slate-200 shadow-md px-3 py-2 text-xs text-slate-700">
      <p className="font-semibold text-slate-800">{d.frente}</p>
      <p>{d.doAno} ações com prazo no ano</p>
      <p>
        <span className="inline-block h-2 w-2 rounded-sm mr-1" style={{ backgroundColor: COR_PREVISTO }} />
        Previsto até hoje: {d.previsto}% ({d.previstas})
      </p>
      <p>
        <span className="inline-block h-2 w-2 rounded-sm mr-1" style={{ backgroundColor: COR_REALIZADO }} />
        Realizado: {d.realizado}% ({d.realizadas})
      </p>
      {d.atrasadas > 0 && <p className="mt-1 text-slate-500">{d.atrasadas} previstas e ainda abertas</p>}
    </div>
  )
}

function ColunasPorFrente({ a }: { a: Andamento }) {
  const dados: LinhaGrafico[] = a.porAba
    .filter(x => x.doAno > 0)
    .map(x => ({
      frente: rotuloCurto(x.href, x.aba),
      previsto: percentual(x.previstas, x.doAno),
      realizado: percentual(x.realizadas, x.doAno),
      doAno: x.doAno,
      previstas: x.previstas,
      realizadas: x.realizadas,
      atrasadas: x.atrasadas,
    }))
  const semDados = a.porAba.filter(x => x.doAno === 0).map(x => rotuloCurto(x.href, x.aba))
  return (
    <section className="rounded-xl bg-white border border-slate-200 shadow-sm p-4">
      <header>
        <h2 className="text-base font-semibold text-slate-800">Resultado por frente</h2>
        <p className="text-xs text-slate-500">Percentual das ações do ano previsto até hoje e realizado, em cada aba.</p>
      </header>
      {/* No celular o gráfico rola de lado dentro do cartão, para as colunas não ficarem espremidas. */}
      <div className="mt-3 overflow-x-auto">
        <div className="h-80 min-w-[680px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dados} margin={{ top: 20, right: 8, left: -8, bottom: 8 }} barGap={2} barCategoryGap="24%">
            <CartesianGrid vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="frente" interval={0} tick={<TickFrente />} height={40} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
            <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={v => `${v}%`} tick={EIXO} tickLine={false} axisLine={false} />
            <Tooltip content={<DicaFrente />} cursor={{ fill: '#f1f5f9' }} />
            <Legend verticalAlign="top" align="right" height={28} iconType="square" wrapperStyle={{ fontSize: 12 }} formatter={v => <span className="text-slate-600">{v}</span>} />
            <Bar dataKey="previsto" name="Previsto até hoje" fill={COR_PREVISTO} radius={[4, 4, 0, 0]} animationDuration={450} animationEasing="ease-out">
              <LabelList dataKey="previsto" position="top" formatter={(v: unknown) => `${v}%`} style={{ fontSize: 11, fill: '#475569' }} />
            </Bar>
            <Bar dataKey="realizado" name="Realizado" fill={COR_REALIZADO} radius={[4, 4, 0, 0]} animationDuration={450} animationEasing="ease-out">
              <LabelList dataKey="realizado" position="top" formatter={(v: unknown) => `${v}%`} style={{ fontSize: 11, fill: '#1e293b', fontWeight: 600 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        </div>
      </div>
      {semDados.length > 0 && <p className="mt-2 text-xs text-slate-500">Sem ações com prazo em {a.ano}: {semDados.join(', ')}.</p>}
    </section>
  )
}
