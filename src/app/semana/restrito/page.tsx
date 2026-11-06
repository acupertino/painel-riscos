'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSemana } from '@/components/semana/ContextoSemana'
import { EtiquetaNivel, Vazio } from '@/components/semana/Etiquetas'
import { RESTRITO } from '@/components/navegacao'
import type { AvaliacaoGav, RiscoSemana } from '@/lib/escritorio'
import type { ReuniaoComex } from '@/lib/comex'
import { PLANOS } from '@/lib/planos'
import { dataCurta } from '@/lib/semana'
import { comoErro, lerJson, lerPlano, type FontePlano } from '@/lib/fontesRestritas'
import {
  pendenciasDasAvaliacoes,
  pendenciasDoComex,
  pendenciasDoPlano,
  pendenciasDoQuadro,
  pendenciasDosClusters,
  pendenciasEmTexto,
  type BlocoPendencias,
  type Pendencia,
} from '@/lib/pendencias'

// Visão geral da área restrita: o que está pendente na semana em todas as abas (Clusters do
// Calendário Detalhado, Avaliações, planos da área restrita e perguntas do COMEX) e os riscos da semana.

const botao =
  'inline-flex items-center justify-center rounded-full px-3 py-1.5 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50'

interface Fontes {
  avaliacoes: AvaliacaoGav[] | string // string = mensagem de erro
  riscos: RiscoSemana[]
  comex: ReuniaoComex[] | string
  planos: Record<string, FontePlano | string>
}

export default function PendenciasDaSemana() {
  const ctx = useSemana()
  const { semana, hoje } = ctx
  const [fontes, setFontes] = useState<Fontes | null>(null)
  const [copiado, setCopiado] = useState(false)

  const buscar = useCallback(async () => {
    const [avaliacoes, riscos, comex, ...planos] = await Promise.all([
      lerJson<{ avaliacoes: AvaliacaoGav[] }>('/api/escritorio').then(j => j.avaliacoes, comoErro),
      lerJson<{ riscos: RiscoSemana[] }>('/api/escritorio/riscos').then(j => j.riscos, () => []),
      lerJson<{ reunioes: ReuniaoComex[] }>('/api/comex').then(j => j.reunioes, comoErro),
      ...PLANOS.map(p => lerPlano(p).catch(comoErro)),
    ])
    setFontes({ avaliacoes, riscos, comex, planos: Object.fromEntries(PLANOS.map((p, i) => [p.slug, planos[i]])) })
  }, [])

  useEffect(() => {
    buscar()
  }, [buscar])

  const blocos = useMemo<BlocoPendencias[]>(() => {
    const lista: BlocoPendencias[] = [
      {
        fonte: 'Clusters',
        href: '/semana/clusters',
        cor: '#3b82f6',
        itens: pendenciasDosClusters(ctx.daSemana, hoje),
        semPrazo: 0,
        erro: ctx.erro ?? undefined,
      },
    ]
    if (!fontes) return lista
    const av = fontes.avaliacoes
    lista.push({
      fonte: 'Avaliações',
      href: `${RESTRITO}/avaliacoes`,
      cor: '#5b2a86',
      ...(typeof av === 'string' ? { itens: [], semPrazo: 0, erro: av } : pendenciasDasAvaliacoes(av, semana, hoje)),
    })
    for (const p of PLANOS) {
      const f = fontes.planos[p.slug]
      if (typeof f === 'string') {
        lista.push({ fonte: p.titulo, href: `${RESTRITO}/${p.slug}`, cor: '#00347f', itens: [], semPrazo: 0, erro: f })
        continue
      }
      const partes = [pendenciasDoPlano(f.manual, semana, hoje, p.formato === 'encaminhamentos'), ...f.quadros.map(g => pendenciasDoQuadro(g, semana, hoje))]
      lista.push({
        fonte: p.titulo,
        href: `${RESTRITO}/${p.slug}`,
        cor: '#00347f',
        itens: partes.flatMap(x => x.itens).sort((a, b) => (a.prazo ?? '9999').localeCompare(b.prazo ?? '9999')),
        semPrazo: partes.reduce((n, x) => n + x.semPrazo, 0),
      })
    }
    const cx = fontes.comex
    lista.push({
      fonte: 'COMEX (perguntas em aberto)',
      href: '/semana/comex',
      cor: '#2ec4f6',
      ...(typeof cx === 'string' ? { itens: [], semPrazo: 0, erro: cx } : { itens: pendenciasDoComex(cx), semPrazo: 0 }),
    })
    return lista
  }, [ctx.daSemana, ctx.erro, fontes, semana, hoje])

  const riscos = (fontes?.riscos ?? []).filter(r => r.semana === semana.inicio)
  const total = blocos.reduce((n, b) => n + b.itens.length, 0)
  const atrasadas = blocos.reduce((n, b) => n + b.itens.filter(p => p.atrasada).length, 0)
  const ehAtual = hoje >= semana.inicio && hoje <= semana.fim

  const copiar = async () => {
    await navigator.clipboard.writeText(pendenciasEmTexto(blocos, semana))
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button className={botao} onClick={() => ctx.mudarSemana(-1)} aria-label="Semana anterior">←</button>
        <div className="rounded-full bg-white ring-1 ring-slate-200 px-4 py-1.5 text-sm font-semibold text-slate-800">
          Semana de {dataCurta(semana.inicio)} a {dataCurta(semana.fim)}
          {ehAtual && <span className="ml-2 text-xs font-medium text-slate-500">(atual)</span>}
        </div>
        <button className={botao} onClick={() => ctx.mudarSemana(1)} aria-label="Próxima semana">→</button>
        {!ehAtual && <button className={botao} onClick={ctx.irParaHoje}>Esta semana</button>}
        <button className={`${botao} ml-auto`} onClick={copiar} disabled={!fontes}>
          {copiado ? 'Copiado!' : 'Copiar pendências'}
        </button>
      </div>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        {[
          { rotulo: 'Pendências na semana', valor: total, cor: '#64748b' },
          { rotulo: 'Já atrasadas', valor: atrasadas, cor: '#f87171' },
          { rotulo: 'Abas com pendência', valor: blocos.filter(b => b.itens.length).length, cor: '#facc15' },
          { rotulo: 'Riscos da semana', valor: riscos.length, cor: '#5b2a86' },
        ].map(k => (
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

      {!fontes && <Vazio texto="Lendo as abas…" />}

      {riscos.length > 0 && (
        <section className="rounded-xl bg-white border border-slate-200 border-l-4 shadow-sm p-4" style={{ borderLeftColor: '#5b2a86' }}>
          <header className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-800">Riscos da semana</h2>
            <Link href={`${RESTRITO}/avaliacoes#riscos`} className="ml-auto text-sm font-semibold text-marca-marinho hover:underline">Abrir</Link>
          </header>
          <ul className="mt-3 space-y-2">
            {riscos.map(r => (
              <li key={r.id} className="rounded-lg bg-slate-50 px-3 py-2 flex flex-wrap items-center gap-2 text-sm text-slate-800">
                <EtiquetaNivel nivel={r.nivel} />
                {r.descricao}
                <span className="text-xs text-slate-500">{[r.avaliacao, r.responsavel].filter(Boolean).join(' · ')}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-4 xl:grid-cols-2 items-start">
        {blocos.map(b => (
          <CartaoFonte key={b.fonte} bloco={b} carregando={b.fonte === 'Clusters' ? ctx.carregando : !fontes} />
        ))}
      </div>
    </div>
  )
}

function CartaoFonte({ bloco: b, carregando }: { bloco: BlocoPendencias; carregando: boolean }) {
  const grupos = useMemo(() => {
    const m = new Map<string, Pendencia[]>()
    for (const p of b.itens) m.set(p.grupo, [...(m.get(p.grupo) ?? []), p])
    return [...m]
  }, [b.itens])

  return (
    <section className="rounded-xl bg-white border border-slate-200 border-l-4 shadow-sm p-4" style={{ borderLeftColor: b.cor }}>
      <header className="flex flex-wrap items-center gap-2">
        <h2 className="text-base font-semibold text-slate-800">{b.fonte}</h2>
        <span className="text-sm text-slate-500">
          {carregando ? 'carregando…' : `${b.itens.length} ${b.itens.length === 1 ? 'pendência' : 'pendências'}`}
        </span>
        <Link href={b.href} className="ml-auto text-sm font-semibold text-marca-marinho hover:underline">Abrir</Link>
      </header>
      {b.erro && <p className="mt-2 text-sm text-red-600">Não foi possível ler: {b.erro}</p>}
      {!carregando && !b.erro && !b.itens.length && <p className="mt-2 text-sm text-slate-500">Nada pendente nesta semana.</p>}
      {grupos.map(([grupo, itens]) => (
        <div key={grupo} className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{grupo}</p>
          <ul className="mt-1 space-y-1.5">
            {itens.map((p, i) => (
              <li key={i} className="rounded-lg bg-slate-50 px-3 py-2">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  {p.prazo && <span className="text-sm font-semibold text-slate-700 tabular-nums">{dataCurta(p.prazo)}</span>}
                  <span className="text-sm text-slate-800">{p.nome}</span>
                  {p.atrasada && (
                    <span className="rounded-full px-2 py-0.5 text-xs font-semibold text-slate-800" style={{ backgroundColor: '#fca5a5' }}>
                      atrasada
                    </span>
                  )}
                  <span className="ml-auto text-xs text-slate-500">{p.status}</span>
                </div>
                {p.detalhe && <p className="mt-0.5 text-xs text-slate-500">{p.detalhe}</p>}
              </li>
            ))}
          </ul>
        </div>
      ))}
      {b.semPrazo > 0 && (
        <p className="mt-3 text-xs text-slate-500">
          + {b.semPrazo} {b.semPrazo === 1 ? 'item' : 'itens'} em aberto sem prazo definido.
        </p>
      )}
    </section>
  )
}
