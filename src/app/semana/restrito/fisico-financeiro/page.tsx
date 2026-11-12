'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, LabelList, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useSemana } from '@/components/semana/ContextoSemana'
import { Vazio } from '@/components/semana/Etiquetas'
import BarraMonday from '@/components/restrito/BarraMonday'
import { baixar, gerarXlsx } from '@/lib/xlsx'
import { PROGRAMAS, RUBRICAS, acoesFisicas, evolucao, fisicoAte, fisicoEmPlanilhas, type AcaoFisica, type EvolucaoFisica, type LinhaBruta, type MarcoFinanceiro, type Programa } from '@/lib/fisico'

// Físico-financeiro (pedido de 10/11/2026). Para cada programa (Educação Financeira, Socioemocional,
// Coordenadores Pedagógicos e Diretores), a evolução física mês a mês do esperado (prazo) e do realizado
// (fim real), no total e por rubrica, com os marcos da execução financeira (dados/financeiro.json).
// Regras de classificação em src/lib/fisico.ts.

const COR_ESPERADO = '#86b6ef'
const COR_REALIZADO = '#1c5cab'
const COR_FINANCEIRO = '#5b2a86' // marca-roxo: distinto dos dois azuis do físico
const EIXO = { fontSize: 12, fill: '#64748b' }
const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const SEM_RUBRICA = 'Sem rubrica'
const pct = (parte: number, total: number) => (total ? Math.round((parte / total) * 100) : 0)
const mesCurto = (data: string) => `${MESES[Number(data.slice(5, 7)) - 1].toLowerCase()}/${data.slice(2, 4)}`
const dataBr = (data: string) => data.split('-').reverse().join('/')
const financeiroDe = (m: MarcoFinanceiro | null, p: Programa, rubrica: string) => {
  const v = m?.programas[p]
  return v ? (rubrica === 'todas' ? v.total : v.rubricas[rubrica]) : undefined
}

export default function FisicoFinanceiro() {
  const { hoje } = useSemana()
  const ano = hoje.slice(0, 4)
  const [linhas, setLinhas] = useState<LinhaBruta[] | null>(null)
  const [geradoEm, setGeradoEm] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [marcos, setMarcos] = useState<MarcoFinanceiro[]>([])

  const buscar = useCallback((forcar: boolean) => {
    setCarregando(true)
    fetch(`/api/fisico${forcar ? '?refresh=1' : ''}`)
      .then(r => r.json())
      .then(j => {
        if (j.error) throw new Error(j.error)
        setLinhas(j.linhas)
        setGeradoEm(j.geradoEm)
        setErro(null)
      })
      .catch(e => setErro(String(e.message ?? e)))
      .finally(() => setCarregando(false))
  }, [])

  useEffect(() => {
    buscar(false)
    fetch('/api/financeiro')
      .then(r => r.json())
      .then(j => setMarcos(j.marcos ?? []))
      .catch(() => setMarcos([]))
  }, [buscar])

  const acoes = useMemo(() => (linhas ? acoesFisicas(linhas) : null), [linhas])
  const [imprimindo, setImprimindo] = useState(false)
  const dataArquivo = hoje.split('-').reverse().join('-')

  // PDF (pedido de 10/11/2026), como no Resumo: fixa a largura da folha A4 deitada, desliga a animação dos
  // gráficos, espera eles se redesenharem e abre a janela de impressão ("Salvar como PDF").
  useEffect(() => {
    if (!imprimindo) return
    const titulo = document.title
    const t = setTimeout(() => {
      document.title = `Fisico-financeiro - ${dataArquivo}`
      window.print()
      document.title = titulo
      setImprimindo(false)
    }, 1500)
    return () => clearTimeout(t)
  }, [imprimindo, dataArquivo])

  // Marco mais recente do ano (setembro e outubro em dados/financeiro.json; mostra o último).
  const marco = marcos.filter(m => m.data.startsWith(ano)).sort((a, b) => b.data.localeCompare(a.data))[0] ?? null

  const baixarExcel = () => {
    if (acoes) baixar(gerarXlsx(fisicoEmPlanilhas(acoes, ano, hoje, marco)), `Fisico-financeiro - ${dataArquivo}.xlsx`)
  }

  return (
    <div className="space-y-4 print:space-y-3" style={imprimindo ? { width: 940 } : undefined}>
      <p className="hidden print:block text-sm text-slate-600">
        <b className="text-marca-marinho">Físico-financeiro</b> · gerado em {dataBr(hoje)}
      </p>
      <BarraMonday quadros="todos os quadros conectados" geradoEm={geradoEm} carregando={carregando} erro={erro} aoAtualizar={() => buscar(true)} />
      {!acoes ? (
        <Vazio texto={erro ? `Não foi possível ler a Monday: ${erro}` : 'Lendo todos os quadros…'} />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-end gap-2 print:hidden">
            <span className="mr-auto text-xs text-slate-500">Baixe o físico-financeiro para enviar:</span>
            <button
              onClick={() => setImprimindo(true)}
              disabled={imprimindo}
              className="inline-flex items-center gap-1.5 rounded-full bg-marca-marinho px-4 py-1.5 text-sm font-semibold text-white hover:bg-marca-azul-escuro disabled:opacity-60"
            >
              <IconeDownload />
              {imprimindo ? 'Preparando…' : 'Baixar PDF'}
            </button>
            <button
              onClick={baixarExcel}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-marca-marinho ring-1 ring-marca-marinho hover:bg-marca-claro"
            >
              <IconeDownload />
              Baixar Excel
            </button>
          </div>
          <CartoesProgramas acoes={acoes} ano={ano} hoje={hoje} marco={marco} />
          <Detalhe acoes={acoes} ano={ano} hoje={hoje} marco={marco} semAnimacao={imprimindo} />
          <ParaRelacionar acoes={acoes} />
          <p className="text-xs text-slate-500">
            Físico: ações com prazo em {ano} de todos os quadros conectados. Esperado = ações com prazo até o fim do mês; realizado = ações
            concluídas, no mês do fim real (sem fim real, no mês do prazo). Contam os subelementos e os elementos sem subelementos; ficam de fora
            as canceladas e as com status “Previsto para 2027”; as esteiras de produção entram como Conteúdo. No Avaliações_GAV entram só os marcos. Uma ação com mais
            de um programa (ex.: “CP e SE”) conta nos dois. Sem coluna RUBRICA, o Calendário Detalhado entra como Formação e Implementação
            e o Avaliações_GAV como Avaliação. Ficam fora os quadros de Comunicação e de Credenciamento, e, no Calendário, as ofertas
            EDUAMB, Operação Resgate e Regular - Síncrono; a oferta BA - GM entra em Socioemocional. Linhas sem sigla: PdM SP (Avaliações_GAV)
            entra em Educação Financeira; as de Advocacy, em Socioemocional. Em Socioemocional, tudo o que vem do quadro de Advocacy (policy paper SE, Papo de Cabeça, ENAP…) é Eixo Público; as de GM e SEDUC ficam de fora.
            {marco && ` Financeiro: % executado até ${dataBr(marco.data)}${marco.fonte ? ` (${marco.fonte})` : ''}, comparado ao físico acumulado até a mesma data.`}
          </p>
        </>
      )}
    </div>
  )
}

function CartoesProgramas({ acoes, ano, hoje, marco }: { acoes: AcaoFisica[]; ano: string; hoje: string; marco: MarcoFinanceiro | null }) {
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {PROGRAMAS.map(p => {
        const e = evolucao(acoes.filter(a => a.programas.includes(p)), ano, hoje)
        const esperado = pct(e.previstasAteHoje, e.total)
        const realizado = pct(e.realizadasAteHoje, e.total)
        const dif = realizado - esperado
        const fin = financeiroDe(marco, p, 'todas')
        const fisMarco = marco ? fisicoAte(acoes.filter(a => a.programas.includes(p)), ano, marco.data, hoje) : null
        return (
          <section key={p} className="rounded-xl bg-white border border-slate-200 shadow-sm p-4">
            <h2 className="text-sm font-semibold text-slate-800">{p}</h2>
            <p className="text-xs text-slate-500">{e.total} ações com prazo em {ano}</p>
            <div className="mt-3 flex items-end gap-2">
              <p className="text-4xl font-bold text-marca-marinho tabular-nums">{realizado}%</p>
              <p className="pb-1 text-xs text-slate-600">
                realizado · esperado até hoje: <b className="text-slate-800">{esperado}%</b>
              </p>
            </div>
            <div className="relative mt-3 h-3 rounded-full bg-slate-100" role="img" aria-label={`Realizado ${realizado}%, esperado ${esperado}%`}>
              <div className="h-full rounded-full transition-[width] duration-[450ms] ease-out" style={{ width: `${realizado}%`, backgroundColor: COR_REALIZADO }} />
              <div className="absolute -top-1 -bottom-1 border-l-2 border-dashed border-slate-700" style={{ left: `${esperado}%` }} />
            </div>
            <p className="mt-2 text-xs text-slate-600">
              {dif === 0 ? 'no esperado' : `${Math.abs(dif)} ${Math.abs(dif) === 1 ? "ponto" : "pontos"} ${dif > 0 ? "acima" : "abaixo"} do esperado`} · {e.realizadasAteHoje} de {e.previstasAteHoje} previstas até hoje
            </p>
            {fin !== undefined && fisMarco && (
              <div className="mt-3 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-700">
                <p className="font-semibold text-slate-800">Marco financeiro · {mesCurto(marco!.data)}</p>
                <p className="mt-0.5">
                  <span className="inline-block h-2 w-2 rotate-45 mr-1.5" style={{ backgroundColor: COR_FINANCEIRO }} />
                  Financeiro executado: <b>{fin}%</b> · físico realizado: <b>{fisMarco.realizado}%</b> (esperado {fisMarco.esperado}%)
                </p>
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}

type Ponto = {
  mes: string
  esperado: number
  realizado: number | null
  esperadas: number
  realizadas: number
  acumEsperadas: number
  acumRealizadas: number | null
  financeiro?: number // só no mês do marco financeiro
}

function pontos(e: EvolucaoFisica, ano: string, mesHoje: number): Ponto[] {
  let esp = 0
  let real = 0
  return e.meses.map((m, i) => {
    esp += m.esperadas
    real += m.realizadas
    return {
      mes: `${MESES[i]}/${ano.slice(2)}`,
      esperado: pct(esp, e.total),
      realizado: i <= mesHoje ? pct(real, e.total) : null,
      esperadas: m.esperadas,
      realizadas: m.realizadas,
      acumEsperadas: esp,
      acumRealizadas: i <= mesHoje ? real : null,
    }
  })
}

function DicaMes({ active, payload, total }: { active?: boolean; payload?: { payload: Ponto }[]; total: number }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-lg bg-white border border-slate-200 shadow-md px-3 py-2 text-xs text-slate-700">
      <p className="font-semibold text-slate-800">{d.mes}</p>
      <p>
        <span className="inline-block h-2 w-2 rounded-sm mr-1" style={{ backgroundColor: COR_ESPERADO }} />
        Esperado no mês: {d.esperadas} · acumulado {d.esperado}% ({d.acumEsperadas} de {total})
      </p>
      {d.acumRealizadas !== null && (
        <p>
          <span className="inline-block h-2 w-2 rounded-sm mr-1" style={{ backgroundColor: COR_REALIZADO }} />
          Realizado no mês: {d.realizadas} · acumulado {d.realizado}% ({d.acumRealizadas} de {total})
        </p>
      )}
      {d.financeiro !== undefined && (
        <p>
          <span className="inline-block h-2 w-2 rotate-45 mr-1" style={{ backgroundColor: COR_FINANCEIRO }} />
          Financeiro executado (marco): {d.financeiro}%
        </p>
      )}
    </div>
  )
}

function Pilulas<T extends string>({ opcoes, valor, aoMudar }: { opcoes: { valor: T; rotulo: string }[]; valor: T; aoMudar: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {opcoes.map(o => (
        <button
          key={o.valor}
          onClick={() => aoMudar(o.valor)}
          className={
            'rounded-full px-3 py-1 text-xs ring-1 transition-colors ' +
            (o.valor === valor ? 'bg-marca-marinho text-white ring-marca-marinho' : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50')
          }
        >
          {o.rotulo}
        </button>
      ))}
    </div>
  )
}

function Detalhe({ acoes, ano, hoje, marco, semAnimacao }: { acoes: AcaoFisica[]; ano: string; hoje: string; marco: MarcoFinanceiro | null; semAnimacao: boolean }) {
  const [programa, setPrograma] = useState<Programa>(PROGRAMAS[0])
  const [rubrica, setRubrica] = useState<string>('todas')
  const doPrograma = acoes.filter(a => a.programas.includes(programa))
  const rubricaDe = (a: AcaoFisica) => a.rubrica ?? SEM_RUBRICA
  const presentes = [...RUBRICAS, SEM_RUBRICA].filter(r => doPrograma.some(a => rubricaDe(a) === r && a.fimPrevisto?.startsWith(ano)))
  const ativa = rubrica === 'todas' || presentes.includes(rubrica) ? rubrica : 'todas'
  const filtradas = ativa === 'todas' ? doPrograma : doPrograma.filter(a => rubricaDe(a) === ativa)
  const e = evolucao(filtradas, ano, hoje)
  const mesHoje = Number(hoje.slice(5, 7)) - 1
  const fin = financeiroDe(marco, programa, ativa)
  const mesMarco = marco ? Number(marco.data.slice(5, 7)) - 1 : -1
  const dados = pontos(e, ano, mesHoje).map((d, i) => (i === mesMarco && fin !== undefined ? { ...d, financeiro: fin } : d))
  const fisMarco = marco ? fisicoAte(filtradas, ano, marco.data, hoje) : null
  // Justificativas da variação físico x financeiro: a da rubrica escolhida, ou todas as do programa.
  const todasJustificativas = Object.entries(marco?.programas[programa]?.justificativas ?? {})
  const justificativas = ativa === 'todas' ? todasJustificativas : todasJustificativas.filter(([r]) => r === ativa)
  const fisMarcoDe = (r: string) => (marco ? fisicoAte(doPrograma.filter(a => rubricaDe(a) === r), ano, marco.data, hoje) : null)

  return (
    <section className="rounded-xl bg-white border border-slate-200 shadow-sm p-4">
      <header>
        <h2 className="text-base font-semibold text-slate-800">Evolução física mês a mês</h2>
        <p className="text-xs text-slate-500">Esperado (prazo) e realizado (conclusão) acumulados, em % das ações do programa com prazo em {ano}.</p>
      </header>
      <div className="mt-3 space-y-2">
        <Pilulas opcoes={PROGRAMAS.map(p => ({ valor: p, rotulo: p }))} valor={programa} aoMudar={setPrograma} />
        <Pilulas opcoes={[{ valor: 'todas', rotulo: 'Todas as rubricas' }, ...presentes.map(r => ({ valor: r, rotulo: r }))]} valor={ativa} aoMudar={setRubrica} />
      </div>

      <p className="mt-3 text-sm text-slate-700">
        {programa}
        {ativa !== 'todas' && ` · ${ativa}`}: {e.total} ações. Até hoje era esperado <b>{pct(e.previstasAteHoje, e.total)}%</b> e foi realizado{' '}
        <b>{pct(e.realizadasAteHoje, e.total)}%</b>.
        {fin !== undefined && fisMarco && (
          <>
            {' '}
            No marco financeiro de {dataBr(marco!.data)}: financeiro executado <b style={{ color: COR_FINANCEIRO }}>{fin}%</b>, físico realizado{' '}
            <b>{fisMarco.realizado}%</b> (esperado {fisMarco.esperado}%).
          </>
        )}
      </p>

      <h3 className="mt-3 text-sm font-semibold text-slate-800">Acumulado</h3>
      <div className={semAnimacao ? "mt-1" : "mt-1 lg:flex lg:items-start lg:gap-4"}>
      <div className={semAnimacao ? "overflow-x-auto" : "overflow-x-auto lg:flex-1 lg:min-w-0"}>
        <div className="h-72 min-w-[680px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dados} margin={{ top: 16, right: 28, left: -8, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="mes" interval={0} tick={EIXO} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
              <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={v => `${v}%`} tick={EIXO} tickLine={false} axisLine={false} />
              <ReferenceLine x={dados[mesHoje].mes} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: 'hoje', position: 'insideBottomLeft', fontSize: 11, fill: '#64748b' }} />
              <Tooltip content={<DicaMes total={e.total} />} cursor={{ stroke: '#cbd5e1' }} />
              <Legend itemSorter={null} verticalAlign="top" align="right" height={28} iconType="plainline" wrapperStyle={{ fontSize: 12 }} formatter={v => <span className="text-slate-600">{v}</span>} />
              <Line type="monotone" dataKey="esperado" name="Esperado" stroke={COR_ESPERADO} strokeWidth={2} strokeDasharray="6 4" dot={{ r: 4, fill: COR_ESPERADO, stroke: '#fff', strokeWidth: 2 }} animationDuration={450} animationEasing="ease-out" isAnimationActive={!semAnimacao} />
              <Line type="monotone" dataKey="realizado" name="Realizado" stroke={COR_REALIZADO} strokeWidth={2} dot={{ r: 4, fill: COR_REALIZADO, stroke: '#fff', strokeWidth: 2 }} animationDuration={450} animationEasing="ease-out" isAnimationActive={!semAnimacao} />
              {fin !== undefined && (
                <Line dataKey="financeiro" name="Financeiro (marco)" stroke={COR_FINANCEIRO} strokeWidth={0} legendType="diamond" isAnimationActive={false} dot={<Losango />} activeDot={<Losango />}>
                  <LabelList dataKey="financeiro" position="right" offset={10} formatter={(v: unknown) => (v === undefined || v === null ? '' : `${v}%`)} style={{ fontSize: 11, fill: COR_FINANCEIRO, fontWeight: 700 }} />
                </Line>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      {justificativas.length > 0 && (
        <div role="note" className={`mt-3 ${semAnimacao ? "" : "lg:mt-8 lg:w-80"} shrink-0 rounded-lg border border-slate-200 border-l-4 bg-slate-50 p-3`} style={{ borderLeftColor: COR_FINANCEIRO }}>
          <p className="text-xs font-semibold text-slate-800">Por que o físico e o financeiro variam{marco ? ` · ${mesCurto(marco.data)}` : ''}</p>
          <ul className="mt-2 space-y-2">
            {justificativas.map(([r, texto]) => (
              <li key={r} className="text-xs text-slate-700">
                <b className="text-slate-800">{r}</b>
                {fisMarcoDe(r) && financeiroDe(marco, programa, r) !== undefined && (
                  <span className="text-slate-500">
                    {' '}
                    · físico {fisMarcoDe(r)!.realizado}% x financeiro {financeiroDe(marco, programa, r)}%
                  </span>
                )}
                <p className="mt-0.5">{texto}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
      </div>

      <h3 className="mt-4 text-sm font-semibold text-slate-800">Ações por mês</h3>
      <div className="mt-1 overflow-x-auto">
        <div className="h-64 min-w-[680px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dados} margin={{ top: 16, right: 8, left: -12, bottom: 0 }} barGap={2} barCategoryGap="20%">
              <CartesianGrid vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="mes" interval={0} tick={EIXO} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
              <YAxis allowDecimals={false} tick={EIXO} tickLine={false} axisLine={false} />
              <Tooltip content={<DicaMes total={e.total} />} cursor={{ fill: '#f1f5f9' }} />
              <Legend itemSorter={null} verticalAlign="top" align="right" height={28} iconType="square" wrapperStyle={{ fontSize: 12 }} formatter={v => <span className="text-slate-600">{v}</span>} />
              <Bar dataKey="esperadas" name="Esperadas no mês" fill={COR_ESPERADO} radius={[4, 4, 0, 0]} animationDuration={450} animationEasing="ease-out" isAnimationActive={!semAnimacao} />
              <Bar dataKey="realizadas" name="Realizadas no mês" fill={COR_REALIZADO} radius={[4, 4, 0, 0]} animationDuration={450} animationEasing="ease-out" isAnimationActive={!semAnimacao} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </section>
  )
}

// Linhas que ainda não têm programa ou rubrica, agrupadas por quadro › grupo › ação-mãe, para a Isa relacionar.
function ParaRelacionar({ acoes }: { acoes: AcaoFisica[] }) {
  const grupos = (lista: AcaoFisica[]) => {
    const m = new Map<string, { quadro: string; caminho: string; n: number; exemplos: string[] }>()
    for (const a of lista) {
      const caminho = [a.grupo, a.mae].filter(Boolean).join(' › ')
      const k = `${a.quadro}|${caminho}`
      const g = m.get(k) ?? { quadro: a.quadro, caminho, n: 0, exemplos: [] }
      g.n++
      if (g.exemplos.length < 3) g.exemplos.push(a.nome)
      m.set(k, g)
    }
    return [...m.values()].sort((x, y) => x.quadro.localeCompare(y.quadro) || y.n - x.n)
  }
  const semPrograma = acoes.filter(a => !a.programas.length)
  const semRubrica = acoes.filter(a => a.programas.length && !a.rubrica)
  const blocos = [
    { titulo: 'Sem programa', texto: 'nenhuma sigla (EDUFIN, SE, CP, VDP, DE) nem nome de programa no nome, na ação-mãe, no grupo ou nas colunas', lista: semPrograma },
    { titulo: 'Com programa, sem rubrica', texto: 'a linha e a ação-mãe estão sem a coluna RUBRICA preenchida', lista: semRubrica },
  ].filter(b => b.lista.length)
  // Tudo relacionado: a seção só volta quando aparecer linha nova sem programa ou rubrica na Monday.
  if (!blocos.length) return null
  return (
    <section className="rounded-xl bg-white border border-slate-200 shadow-sm p-4">
      <h2 className="text-base font-semibold text-slate-800">Para relacionar</h2>
      <p className="text-xs text-slate-500">Ações que ainda não entram (ou entram sem rubrica) nos programas acima.</p>
      <div className="mt-3 space-y-3">
        {blocos.map(b => (
          <details key={b.titulo} className="rounded-lg border border-slate-200 p-3">
            <summary className="cursor-pointer text-sm text-slate-800">
              <b>{b.titulo}</b> · {b.lista.length} ações <span className="text-xs text-slate-500">({b.texto})</span>
            </summary>
            <ul className="mt-2 space-y-1.5">
              {grupos(b.lista).map(g => (
                <li key={g.quadro + g.caminho} className="text-xs text-slate-600">
                  <b className="text-slate-800">{g.quadro}</b> › {g.caminho} · {g.n} {g.n === 1 ? 'ação' : 'ações'}
                  <span className="text-slate-400"> (ex.: {g.exemplos.join('; ')})</span>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>
    </section>
  )
}

// Marcador do marco financeiro no gráfico acumulado: losango roxo, para não se confundir com os pontos do físico.
function Losango({ cx, cy, value }: { cx?: number; cy?: number; value?: number | null }) {
  if (cx === undefined || cy === undefined || value === undefined || value === null) return null
  return <path d={`M ${cx} ${cy - 7} L ${cx + 7} ${cy} L ${cx} ${cy + 7} L ${cx - 7} ${cy} Z`} fill={COR_FINANCEIRO} stroke="#fff" strokeWidth={2} />
}

function IconeDownload() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  )
}
