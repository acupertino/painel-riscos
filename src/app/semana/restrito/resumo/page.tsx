'use client'

import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useSemana } from '@/components/semana/ContextoSemana'
import { Vazio } from '@/components/semana/Etiquetas'
import BarraMonday from '@/components/restrito/BarraMonday'
import { useFontesRestritas } from '@/components/restrito/useFontesRestritas'
import { LINKS_RESTRITOS } from '@/components/navegacao'
import { dataCurta } from '@/lib/semana'
import { montarAndamento, percentual, type AcaoAtrasada, type Andamento, type MesAndamento } from '@/lib/relatorio'

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
          <StatusAtrasos a={andamento} />
          <ColunasPorFrente a={andamento} />
          <MesAMes a={andamento} hoje={hoje} />
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

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

type LinhaMes = MesAndamento & { mes: string; futuro: boolean }

function DicaMes({ active, payload }: { active?: boolean; payload?: { payload: LinhaMes }[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-lg bg-white border border-slate-200 shadow-md px-3 py-2 text-xs text-slate-700">
      <p className="font-semibold text-slate-800">{d.mes}</p>
      <p>
        <span className="inline-block h-2 w-2 rounded-sm mr-1" style={{ backgroundColor: COR_PREVISTO }} />
        Projetado: {d.projetadas} {d.projetadas === 1 ? 'ação' : 'ações'} com prazo no mês
      </p>
      <p>
        <span className="inline-block h-2 w-2 rounded-sm mr-1" style={{ backgroundColor: COR_REALIZADO }} />
        Realizado: {d.realizadas} ({percentual(d.realizadas, d.projetadas)}%)
      </p>
      {!d.futuro && d.projetadas > d.realizadas && (
        <p className="mt-1 text-slate-500">{d.projetadas - d.realizadas} ainda abertas</p>
      )}
      {d.futuro && <p className="mt-1 text-slate-500">Mês ainda por vir: realizado = concluídas antes do prazo</p>}
    </div>
  )
}

// Mês a mês (pedido de 09/11/2026): projetado x realizado, no total ou por frente.
function MesAMes({ a, hoje }: { a: Andamento; hoje: string }) {
  const frentes = a.porAba.filter(x => x.doAno > 0)
  const [escolhida, setEscolhida] = useState<string | null>(null)
  const atual = frentes.find(f => f.href === escolhida)
  const meses = atual ? atual.porMes : a.porMes
  const mesHoje = Number(hoje.slice(5, 7)) - 1
  const dados: LinhaMes[] = meses.map((m, i) => ({ ...m, mes: `${MESES[i]}/${a.ano.slice(2)}`, futuro: i > mesHoje }))
  const ate = meses.slice(0, mesHoje + 1)
  const projAte = ate.reduce((n, m) => n + m.projetadas, 0)
  const realAte = ate.reduce((n, m) => n + m.realizadas, 0)
  const opcoes = [{ href: null as string | null, rotulo: 'Todas as frentes' }, ...frentes.map(f => ({ href: f.href as string | null, rotulo: rotuloCurto(f.href, f.aba) }))]
  return (
    <section className="rounded-xl bg-white border border-slate-200 shadow-sm p-4">
      <header>
        <h2 className="text-base font-semibold text-slate-800">Mês a mês</h2>
        <p className="text-xs text-slate-500">
          Ações com prazo em cada mês (projetado) e quantas delas já foram concluídas (realizado). Até {MESES[mesHoje].toLowerCase()}:{' '}
          <b className="text-slate-700">{realAte} de {projAte}</b> ({percentual(realAte, projAte)}%).
        </p>
      </header>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {opcoes.map(o => (
          <button
            key={o.href ?? 'todas'}
            onClick={() => setEscolhida(o.href)}
            className={
              'rounded-full px-3 py-1 text-xs ring-1 transition-colors ' +
              (o.href === escolhida ? 'bg-marca-marinho text-white ring-marca-marinho' : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50')
            }
          >
            {o.rotulo}
          </button>
        ))}
      </div>
      <div className="mt-3 overflow-x-auto">
        <div className="h-80 min-w-[680px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dados} margin={{ top: 20, right: 8, left: -12, bottom: 0 }} barGap={2} barCategoryGap="20%">
              <CartesianGrid vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="mes" interval={0} tick={EIXO} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
              <YAxis allowDecimals={false} tick={EIXO} tickLine={false} axisLine={false} />
              <Tooltip content={<DicaMes />} cursor={{ fill: '#f1f5f9' }} />
              <Legend verticalAlign="top" align="right" height={28} iconType="square" wrapperStyle={{ fontSize: 12 }} formatter={v => <span className="text-slate-600">{v}</span>} />
              <Bar dataKey="projetadas" name="Projetado" fill={COR_PREVISTO} radius={[4, 4, 0, 0]} animationDuration={450} animationEasing="ease-out">
                {dados.map(d => <Cell key={d.mes} fillOpacity={d.futuro ? 0.45 : 1} />)}
                <LabelList dataKey="projetadas" position="top" style={{ fontSize: 10, fill: '#64748b' }} />
              </Bar>
              <Bar dataKey="realizadas" name="Realizado" fill={COR_REALIZADO} radius={[4, 4, 0, 0]} animationDuration={450} animationEasing="ease-out">
                {dados.map(d => <Cell key={d.mes} fillOpacity={d.futuro ? 0.45 : 1} />)}
                <LabelList dataKey="realizadas" position="top" style={{ fontSize: 10, fill: '#1e293b', fontWeight: 600 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Colunas mais claras: meses que ainda não chegaram (o realizado são ações concluídas antes do prazo). A Monday não guarda a data em
        que cada ação foi concluída, por isso o realizado aparece no mês do prazo.
      </p>
    </section>
  )
}

// ---------- Status dos atrasos (pedido de 10/11/2026): leitura executiva para a diretoria ----------
// Só ações com prazo já vencido (ontem ou antes) e ainda abertas. Agrupa por ação-mãe (ou grupo do quadro)
// e mostra as ações mais atrasadas de cada assunto. Fatos, sem recomendação.

const FAIXAS = [
  { chave: 'ate30', rotulo: 'Até 30 dias', de: 1, ate: 30, cor: '#fca5a5' },
  { chave: 'ate90', rotulo: '31 a 90 dias', de: 31, ate: 90, cor: '#ef4444' },
  { chave: 'mais90', rotulo: 'Mais de 90 dias', de: 91, ate: Infinity, cor: '#991b1b' },
] as const

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`
// "fulano@institutoanimaeducacao.org.br" vira "fulano"; nomes repetidos aparecem uma vez.
const pessoas = (lista: (string | null)[]) =>
  [...new Set(lista.flatMap(r => (r ? r.split(',') : [])).map(r => r.trim().replace(/@.*$/, '')).filter(Boolean))]

interface Assunto {
  nome: string
  acoes: AcaoAtrasada[]
  maior: number
  responsaveis: string[]
}

function assuntosDe(atrasos: AcaoAtrasada[]): Assunto[] {
  const mapa = new Map<string, AcaoAtrasada[]>()
  for (const t of atrasos) {
    const chave = t.mae ?? t.grupo
    mapa.set(chave, [...(mapa.get(chave) ?? []), t])
  }
  return [...mapa.entries()]
    .map(([nome, acoes]) => ({ nome, acoes, maior: Math.max(...acoes.map(x => x.dias)), responsaveis: pessoas(acoes.map(x => x.responsavel)) }))
    .sort((a, b) => b.acoes.length - a.acoes.length || b.maior - a.maior)
}

const corDoAtraso = (dias: number) => FAIXAS.find(f => dias >= f.de && dias <= f.ate)?.cor ?? FAIXAS[0].cor

function StatusAtrasos({ a }: { a: Andamento }) {
  const frentes = a.porAba
    .filter(x => x.doAno > 0)
    .map(x => {
      const vencidas = x.atrasos.filter(t => t.dias > 0)
      return { ...x, rotulo: rotuloCurto(x.href, x.aba), vencidas, maior: vencidas.length ? Math.max(...vencidas.map(t => t.dias)) : 0 }
    })
  const comAtraso = frentes.filter(x => x.vencidas.length).sort((x, y) => y.vencidas.length - x.vencidas.length)
  const emDia = frentes.filter(x => !x.vencidas.length).map(x => x.rotulo)
  const total = comAtraso.reduce((n, x) => n + x.vencidas.length, 0)
  if (!total) return null
  const duas = comAtraso.slice(0, 2)
  const nasDuas = duas.reduce((n, x) => n + x.vencidas.length, 0)
  const pior = comAtraso.flatMap(x => x.vencidas.map(t => ({ ...t, frente: x.rotulo }))).sort((p, q) => q.dias - p.dias)[0]
  const grafico = comAtraso.map(x => ({
    frente: x.rotulo,
    ...Object.fromEntries(FAIXAS.map(f => [f.chave, x.vencidas.filter(t => t.dias >= f.de && t.dias <= f.ate).length])),
  }))

  return (
    <section className="rounded-xl bg-white border border-slate-200 shadow-sm p-4">
      <header>
        <h2 className="text-base font-semibold text-slate-800">Status dos atrasos</h2>
        <p className="text-xs text-slate-500">Ações com prazo vencido e ainda abertas na Monday, por frente.</p>
      </header>

      <ul className="mt-3 space-y-1.5 text-sm text-slate-700 list-disc pl-5">
        <li>
          <b>{plural(total, 'ação está', 'ações estão')} com prazo vencido</b> em {comAtraso.length} de {frentes.length} frentes.
        </li>
        {comAtraso.length > 1 && (
          <li>
            {duas.map(x => x.rotulo).join(' e ')} concentram <b>{percentual(nasDuas, total)}%</b> dos atrasos ({nasDuas} de {total}).
          </li>
        )}
        <li>
          Maior atraso: “{pior.nome}” ({pior.frente}), vencida há <b>{pior.dias} dias</b>.
        </li>
        {emDia.length > 0 && <li>Sem atrasos: {emDia.join(', ')}.</li>}
      </ul>

      <div className="mt-4 overflow-x-auto">
      <div className="min-w-[560px]" style={{ height: 40 + comAtraso.length * 38 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={grafico} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }} barCategoryGap="28%">
            <CartesianGrid horizontal={false} stroke="#e2e8f0" />
            <XAxis type="number" allowDecimals={false} tick={EIXO} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="frente" width={200} tick={EIXO} tickLine={false} axisLine={false} />
            <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Legend itemSorter={null} verticalAlign="top" align="right" height={28} iconType="square" wrapperStyle={{ fontSize: 12 }} formatter={v => <span className="text-slate-600">{v}</span>} />
            {FAIXAS.map(f => (
              <Bar key={f.chave} dataKey={f.chave} name={f.rotulo} stackId="atraso" fill={f.cor} stroke="#fff" strokeWidth={1} animationDuration={450} animationEasing="ease-out" />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {comAtraso.map(x => (
          <article key={x.href} className="rounded-lg border border-slate-200 border-l-4 p-3" style={{ borderLeftColor: corDoAtraso(x.maior) }}>
            <header className="flex items-baseline justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-800">{x.rotulo}</h3>
              <p className="text-xs text-slate-500 whitespace-nowrap">
                <b className="text-slate-800">{plural(x.vencidas.length, 'ação', 'ações')}</b> · até {x.maior} dias
              </p>
            </header>
            <ul className="mt-2 space-y-2">
              {assuntosDe(x.vencidas).map(s => {
                const nomes = [...new Set(s.acoes.map(t => t.nome))]
                return (
                  <li key={s.nome} className="text-xs text-slate-600">
                    <p className="text-slate-800">
                      <span className="inline-block h-2 w-2 rounded-full mr-1.5 align-middle" style={{ backgroundColor: corDoAtraso(s.maior) }} />
                      <b>{s.nome}</b> · {plural(s.acoes.length, 'ação', 'ações')}, até {s.maior} dias
                    </p>
                    <p className="pl-3.5">
                      {nomes.slice(0, 3).join('; ')}
                      {nomes.length > 3 && <span className="text-slate-400"> e mais {nomes.length - 3}</span>}
                    </p>
                    {s.responsaveis.length > 0 && <p className="pl-3.5 text-slate-400">Resp.: {s.responsaveis.join(', ')}</p>}
                  </li>
                )
              })}
            </ul>
          </article>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Ações com prazo até ontem e sem conclusão registrada na Monday, agrupadas pela ação-mãe (ou pelo grupo do quadro). A lista linha a linha
        fica na aba Relatório.
      </p>
    </section>
  )
}
