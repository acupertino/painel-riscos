'use client'

import { useState } from 'react'
import { useSemana } from '@/components/semana/ContextoSemana'
import { EtiquetaArea, EtiquetaCluster, EtiquetaNivel, EtiquetaStatus, Vazio } from '@/components/semana/Etiquetas'
import { rotuloCurso, type Acao } from '@/lib/calendario'
import { COR_NIVEL, nomeBase, periodo, type NivelAlerta } from '@/lib/semana'

const NIVEIS: NivelAlerta[] = ['crítico', 'atenção', 'ok']

// Alertas de dependência: a ação da semana (à direita) depende da etapa de outra área (à esquerda).
export default function Dependencias() {
  const { dependencias } = useSemana()
  const [nivel, setNivel] = useState<NivelAlerta | ''>('')
  const visiveis = nivel ? dependencias.filter(d => d.nivel === nivel) : dependencias

  if (!dependencias.length) return <Vazio texto="Nenhuma ação da semana depende de uma etapa de outra área." />

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-4 text-sm text-slate-600">
        A Monday não tem coluna de dependência. A etapa anterior é encontrada pelo fluxo do mesmo curso,
        módulo e UC (ex.: entrega → correção → tratamento dos dados → divulgação → nanocertificação).
        Só entram dependências entre áreas diferentes.
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => setNivel('')}
            className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-slate-200 ${nivel === '' ? 'bg-marca-marinho text-white' : 'bg-white text-slate-600'}`}
          >
            Todas ({dependencias.length})
          </button>
          {NIVEIS.map(n => (
            <button
              key={n}
              onClick={() => setNivel(n)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-slate-200 ${nivel === n ? 'bg-marca-marinho text-white' : 'bg-white text-slate-600'}`}
            >
              {n.charAt(0).toUpperCase() + n.slice(1)} ({dependencias.filter(d => d.nivel === n).length})
            </button>
          ))}
        </div>
      </div>

      {visiveis.map(d => (
        <article
          key={d.acao.id}
          className="rounded-xl bg-white border border-slate-200 border-l-4 shadow-sm p-4"
          style={{ borderLeftColor: COR_NIVEL[d.nivel].forte }}
        >
          <header className="flex flex-wrap items-center gap-2">
            <EtiquetaNivel nivel={d.nivel} />
            <EtiquetaCluster cluster={d.acao.cluster} />
            <span className="text-sm text-slate-500">· {rotuloCurso(d.acao)}</span>
          </header>
          <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
            <Caixa acao={d.anterior} legenda="Etapa anterior" />
            <div className="flex items-center justify-center text-slate-400" aria-hidden="true">
              <svg className="w-6 h-6 rotate-90 md:rotate-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <path d="m13 6 6 6-6 6" />
              </svg>
            </div>
            <Caixa acao={d.acao} legenda="Ação da semana" destaque />
          </div>
          <p className="mt-3 text-sm text-slate-700">
            <span className="font-semibold">{d.acao.area}</span> depende de{' '}
            <span className="font-semibold">{d.anterior.area}</span>: {d.motivo}.
          </p>
        </article>
      ))}
    </div>
  )
}

function Caixa({ acao, legenda, destaque }: { acao: Acao; legenda: string; destaque?: boolean }) {
  return (
    <div className={`rounded-lg p-3 ${destaque ? 'bg-slate-50 ring-1 ring-slate-200' : 'bg-slate-50'}`}>
      <p className="text-xs uppercase tracking-wide text-slate-400">{legenda}</p>
      <p className="mt-1 text-sm font-medium text-slate-800">{nomeBase(acao.nome)}</p>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <EtiquetaArea area={acao.area} />
        <span className="text-xs text-slate-500">{periodo(acao)}</span>
        <EtiquetaStatus status={acao.status} />
      </div>
    </div>
  )
}
