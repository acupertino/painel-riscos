'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSemana } from '@/components/semana/ContextoSemana'
import { Vazio } from '@/components/semana/Etiquetas'
import BarraMonday from '@/components/restrito/BarraMonday'
import { dataCurta } from '@/lib/semana'
import {
  DIAS_PONTOS_DE_ATENCAO,
  corDoStatus,
  estaAbertaQuadro,
  estaConcluidaQuadro,
  estaVencidaQuadro,
  type AcaoQuadro,
  type DadosQuadroRestrito,
  type PontoDeAtencao,
} from '@/lib/quadroRestrito'

// Aba da área restrita alimentada por um quadro da Monday (só leitura): pontos de atenção vindos
// dos comentários das linhas, indicadores e as ações por grupo, com subações.

const periodo = (inicio: string | null, fim: string | null) =>
  inicio && fim && inicio !== fim ? `${dataCurta(inicio)}–${dataCurta(fim)}` : fim || inicio ? dataCurta(fim ?? inicio) : 'sem data'
const dataHora = (iso: string) => new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

export default function QuadroMonday({ slug, frente }: { slug: string; frente?: string }) {
  const { hoje } = useSemana()
  const [dados, setDados] = useState<DadosQuadroRestrito | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [soAbertas, setSoAbertas] = useState(false)

  const buscar = useCallback(
    (forcar: boolean) => {
      const params = new URLSearchParams()
      if (frente) params.set('frente', frente)
      if (forcar) params.set('refresh', '1')
      fetch(`/api/quadros/${slug}?${params}`)
        .then(r => r.json())
        .then(j => {
          if (j.error) throw new Error(j.error)
          setDados(j)
          setErro(null)
        })
        .catch(e => setErro(String(e.message ?? e)))
        .finally(() => setCarregando(false))
    },
    [slug, frente],
  )

  useEffect(() => buscar(false), [buscar])

  const todas = useMemo(() => dados?.grupos.flatMap(g => g.acoes) ?? [], [dados])
  const grupos = useMemo(
    () =>
      (dados?.grupos ?? [])
        .map(g => ({ ...g, acoes: soAbertas ? g.acoes.filter(estaAbertaQuadro) : g.acoes }))
        .filter(g => g.acoes.length > 0),
    [dados, soAbertas],
  )

  if (erro && !dados) return <Vazio texto={`Não foi possível ler a Monday: ${erro}`} />
  if (!dados) return <Vazio texto="Lendo o quadro na Monday…" />

  const indicadores = [
    { rotulo: 'Ações', valor: todas.length, cor: '#64748b' },
    { rotulo: 'Concluídas', valor: todas.filter(estaConcluidaQuadro).length, cor: '#34d399' },
    { rotulo: 'Em aberto', valor: todas.filter(estaAbertaQuadro).length, cor: '#3b82f6' },
    { rotulo: 'Com prazo vencido', valor: todas.filter(a => estaVencidaQuadro(a, hoje)).length, cor: '#f87171' },
  ]

  return (
    <div className="space-y-4">
      <BarraMonday
        quadros={dados.quadro}
        geradoEm={dados.geradoEm}
        carregando={carregando}
        erro={erro}
        aoAtualizar={() => {
          setCarregando(true)
          buscar(true)
        }}
      />

      {dados.pontos.length > 0 && <PontosDeAtencao pontos={dados.pontos} />}

      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        {indicadores.map(k => (
          <div
            key={k.rotulo}
            className="flex items-center justify-between gap-2 rounded-lg bg-white border border-slate-200 border-l-4 shadow-sm px-3 py-2"
            style={{ borderLeftColor: k.cor }}
          >
            <p className="text-xs text-slate-500 leading-tight">{k.rotulo}</p>
            <p className="text-xl font-bold text-slate-800 tabular-nums">{k.valor}</p>
          </div>
        ))}
      </div>

      <label className="inline-flex items-center gap-2 text-sm text-slate-600">
        <input type="checkbox" checked={soAbertas} onChange={e => setSoAbertas(e.target.checked)} className="accent-marca-marinho" />
        Só ações não concluídas
      </label>

      {!grupos.length && <Vazio texto="Nenhuma ação em aberto neste quadro." />}

      {grupos.map(g => (
        <section key={g.nome} className="rounded-xl bg-white border border-slate-200 border-l-4 border-l-marca-marinho shadow-sm p-4">
          <header className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-slate-800">{g.nome}</h2>
            <span className="text-sm text-slate-500">
              {g.acoes.length} {g.acoes.length === 1 ? 'ação' : 'ações'}
            </span>
          </header>
          <ul className="mt-3 space-y-2">
            {g.acoes.map(a => (
              <LinhaAcao key={a.id} acao={a} hoje={hoje} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

export function PontosDeAtencao({ pontos }: { pontos: PontoDeAtencao[] }) {
  return (
    <section className="rounded-xl bg-white border border-amber-200 border-l-4 shadow-sm p-4" style={{ borderLeftColor: '#facc15' }}>
      <h2 className="text-base font-semibold text-slate-800">⚠️ Pontos de atenção</h2>
      <p className="text-xs text-slate-500">Comentários dos últimos {DIAS_PONTOS_DE_ATENCAO} dias nas linhas do quadro na Monday.</p>
      <ul className="mt-3 space-y-3">
        {pontos.map((p, i) => (
          <li key={i} className="rounded-lg bg-amber-50 px-3 py-2">
            <p className="text-sm font-semibold text-slate-800">{p.acao}</p>
            <p className="mt-1 text-sm text-slate-700 whitespace-pre-line">{p.texto}</p>
            <p className="mt-1 text-xs text-slate-500">
              {p.autor} · {dataHora(p.data)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}

function LinhaAcao({ acao: a, hoje, sub = false }: { acao: AcaoQuadro; hoje: string; sub?: boolean }) {
  const [aberta, setAberta] = useState(false)
  const vencida = estaVencidaQuadro(a, hoje)
  return (
    <li className={sub ? 'rounded-md bg-white px-3 py-1.5 ring-1 ring-slate-100' : 'rounded-lg bg-slate-50 px-3 py-2'}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="rounded-full px-2 py-0.5 text-xs font-semibold text-slate-800 whitespace-nowrap" style={{ backgroundColor: corDoStatus(a.status) }}>
          {a.status ?? 'sem status'}
        </span>
        <span className="text-sm text-slate-800">{a.nome}</span>
        {vencida && (
          <span className="rounded-full px-2 py-0.5 text-xs font-semibold text-slate-800" style={{ backgroundColor: '#fca5a5' }}>
            prazo vencido
          </span>
        )}
        {a.subacoes.length > 0 && (
          <button onClick={() => setAberta(!aberta)} className="text-xs font-semibold text-marca-marinho hover:underline">
            {aberta ? 'ocultar' : `${a.subacoes.length} ${a.subacoes.length === 1 ? 'subação' : 'subações'}`}
          </button>
        )}
      </div>
      <p className="mt-0.5 text-xs text-slate-500">
        {[a.responsavel, `previsto: ${periodo(a.inicioPrevisto, a.fimPrevisto)}`, (a.inicioReal || a.fimReal) && `real: ${periodo(a.inicioReal, a.fimReal)}`]
          .filter(Boolean)
          .join(' · ')}
      </p>
      {a.extras.length > 0 && (
        <dl className="mt-1 grid gap-x-3 gap-y-0.5 text-xs text-slate-600 sm:grid-cols-[auto_1fr]">
          {a.extras.map(x => (
            <div key={x.titulo} className="contents">
              <dt className="font-semibold text-slate-500">{x.titulo}</dt>
              <dd className="whitespace-pre-line">{x.texto}</dd>
            </div>
          ))}
        </dl>
      )}
      {aberta && (
        <ul className="mt-2 space-y-1.5">
          {a.subacoes.map(s => (
            <LinhaAcao key={s.id} acao={s} hoje={hoje} sub />
          ))}
        </ul>
      )}
    </li>
  )
}
