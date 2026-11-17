'use client'

import { useEffect, useState } from 'react'
import { useSemana } from '@/components/semana/ContextoSemana'
import { Vazio } from '@/components/semana/Etiquetas'
import type { AreaRaci, RaciFrentes } from '@/lib/raci'

// Frentes por área (pedido de 17/11/2026): para cada área, os grandes clusters das ações em que ela é R na
// RACI. Clicar numa área abre os clusters com as ações. Dados em dados/raci.json; regras em src/lib/raci.ts.

export default function FrentesRaci() {
  const [dados, setDados] = useState<RaciFrentes | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [aberta, setAberta] = useState<string | null>(null)
  const { hoje } = useSemana()

  // PDF (pedido de 17/11/2026): abre a janela de impressão ("Salvar como PDF") com a tela como está,
  // inclusive a área aberta; no papel os cards ficam em 3 colunas.
  const baixarPdf = () => {
    const titulo = document.title
    document.title = `Frentes por area (RACI) - ${hoje.split('-').reverse().join('-')}`
    window.print()
    document.title = titulo
  }

  useEffect(() => {
    fetch('/api/raci')
      .then(r => r.json())
      .then(j => {
        if (j.error) throw new Error(j.error)
        setDados(j)
      })
      .catch(e => setErro(String(e.message ?? e)))
  }, [])

  if (erro) return <Vazio texto={erro} />
  if (!dados) return <Vazio texto="Carregando a RACI…" />

  const area = dados.areas.find(a => a.sigla === aberta) ?? null

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2 print:hidden">
        <span className="mr-auto text-xs text-slate-500">Baixe as frentes para enviar:</span>
        <button
          onClick={baixarPdf}
          className="inline-flex items-center gap-1.5 rounded-full bg-marca-marinho px-4 py-1.5 text-sm font-semibold text-white hover:bg-marca-azul-escuro"
        >
          <IconeDownload />
          Baixar PDF
        </button>
      </div>
      <section className="rounded-xl bg-white border border-slate-200 shadow-sm p-4">
        <h2 className="text-base font-semibold text-slate-800">Grandes frentes de cada área</h2>
        <p className="mt-1 text-sm text-slate-600">
          Agrupamento das ações em que cada área é <b>R (responsável)</b> na RACI. <span className="print:hidden">Clique numa área para ver as ações de cada frente.</span>
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <Chip rotulo="Ações na RACI" valor={dados.totalAcoes} />
          <Chip rotulo="Áreas" valor={dados.areas.length} />
          <Chip rotulo="Ações com mais de uma área R" valor={dados.comMaisDeUmR} />
          <Chip rotulo="Ações sem R" valor={dados.semR.length} />
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 print:grid-cols-3">
        {dados.areas.map(a => (
          <CartaoArea key={a.sigla} area={a} ativa={a.sigla === aberta} onClick={() => setAberta(a.sigla === aberta ? null : a.sigla)} />
        ))}
      </div>

      {area && <Detalhe area={area} onFechar={() => setAberta(null)} />}
    </div>
  )
}

function Chip({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600 ring-1 ring-slate-200">
      {rotulo}: <b className="text-slate-800 tabular-nums">{valor}</b>
    </span>
  )
}

function CartaoArea({ area, ativa, onClick }: { area: AreaRaci; ativa: boolean; onClick: () => void }) {
  const maior = Math.max(...area.clusters.map(c => c.acoes.length))
  return (
    <button
      onClick={onClick}
      aria-expanded={ativa}
      className={`break-inside-avoid text-left rounded-xl bg-white border shadow-sm p-4 border-l-4 transition-colors hover:bg-slate-50 ${
        ativa ? 'border-marca-marinho ring-2 ring-marca-marinho/30' : 'border-slate-200 border-l-marca-azul'
      }`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-lg font-bold text-marca-marinho">{area.sigla}</p>
        <p className="text-xs text-slate-500">
          <b className="text-slate-800 tabular-nums">{area.total}</b> ações como R
        </p>
      </div>
      <ul className="mt-3 space-y-1.5">
        {area.clusters.map(c => (
          <li key={c.nome}>
            <div className="flex justify-between gap-2 text-xs text-slate-700">
              <span className="truncate">{c.nome}</span>
              <span className="tabular-nums text-slate-500">{c.acoes.length}</span>
            </div>
            <div className="mt-0.5 h-1.5 rounded-full bg-slate-100">
              <div className="h-1.5 rounded-full bg-marca-azul" style={{ width: `${(c.acoes.length / maior) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </button>
  )
}

function Detalhe({ area, onFechar }: { area: AreaRaci; onFechar: () => void }) {
  return (
    <section className="rounded-xl bg-white border border-slate-200 shadow-sm p-4">
      <header className="flex items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-800">
          {area.sigla} · {area.clusters.length} frentes, {area.total} ações
        </h3>
        <button onClick={onFechar} className="print:hidden text-sm text-slate-500 hover:text-slate-800">
          Fechar
        </button>
      </header>
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        {area.clusters.map(c => (
          <article key={c.nome} className="break-inside-avoid rounded-lg bg-slate-50 p-3 border-l-4 border-marca-azul">
            <p className="text-sm font-semibold text-slate-800">
              {c.nome} <span className="font-normal text-slate-500">({c.acoes.length})</span>
            </p>
            <ul className="mt-1.5 space-y-1 text-sm text-slate-700">
              {c.acoes.map((a, i) => (
                <li key={i}>
                  {a.id != null && <span className="text-slate-400 tabular-nums">{a.id}. </span>}
                  {a.nome}
                  {a.comR.length > 0 && <span className="text-xs text-slate-500"> · também R: {a.comR.join(', ')}</span>}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  )
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
