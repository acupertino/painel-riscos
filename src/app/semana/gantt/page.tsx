'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useSemana } from '@/components/semana/ContextoSemana'
import { EtiquetaArea, EtiquetaCluster, EtiquetaNivel, EtiquetaStatus, Vazio } from '@/components/semana/Etiquetas'
import { corDaArea, rotuloCurso, type Acao } from '@/lib/calendario'
import { COR_NIVEL, dataCurta, nomeBase, periodo, somarDias, type Dependencia, type NivelAlerta } from '@/lib/semana'

const NIVEIS: NivelAlerta[] = ['crítico', 'atenção', 'ok']
const DIA_MS = 86_400_000
const JANELA_DIAS = 21 // quanto o eixo mostra antes da semana selecionada
const dias = (de: string, ate: string) => Math.round((Date.parse(ate) - Date.parse(de)) / DIA_MS)

interface Dica {
  acao: Acao
  papel: string
  x: number
  y: number
}

// Gantt das dependências: para cada ação da semana que depende de outra área, a barra da
// etapa anterior (em cima) e a da ação (embaixo), ligadas por uma seta na cor do nível.
export default function Gantt() {
  const { dependencias, semana, hoje } = useSemana()
  const [nivel, setNivel] = useState<NivelAlerta | ''>('')
  const [dica, setDica] = useState<Dica | null>(null)
  const visiveis = nivel ? dependencias.filter(d => d.nivel === nivel) : dependencias

  if (!dependencias.length) return <Vazio texto="Nenhuma ação da semana depende de uma etapa de outra área." />

  // Eixo: até 3 semanas antes da semana selecionada (o que começa antes fica cortado com ◂)
  // e até o fim da semana, incluindo hoje.
  const datas = visiveis.flatMap(d => [d.anterior.inicio ?? d.anterior.termino!, d.acao.termino!])
  const inicioEixo = [...datas, semana.inicio, hoje].sort().find(d => d >= somarDias(semana.inicio, -JANELA_DIAS)) ?? semana.inicio
  const fimEixo = somarDias([...datas, semana.fim, hoje].sort().at(-1)!, 1)
  const total = dias(inicioEixo, fimEixo)
  const x = (iso: string) => Math.max(0, Math.min(100, (dias(inicioEixo, iso) / total) * 100))

  // Marcas a cada segunda-feira.
  const marcas: string[] = []
  for (let d = inicioEixo; d < fimEixo; d = somarDias(d, 1)) if (new Date(`${d}T12:00:00Z`).getUTCDay() === 1) marcas.push(d)

  const areas = [...new Set(visiveis.flatMap(d => [d.anterior.area, d.acao.area]))].sort()
  const mostrarDica = (acao: Acao, papel: string) => (e: React.MouseEvent) => setDica({ acao, papel, x: e.clientX, y: e.clientY })

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <Chip ativo={nivel === ''} onClick={() => setNivel('')}>Todas ({dependencias.length})</Chip>
          {NIVEIS.map(n => (
            <Chip key={n} ativo={nivel === n} onClick={() => setNivel(n)}>
              {n.charAt(0).toUpperCase() + n.slice(1)} ({dependencias.filter(d => d.nivel === n).length})
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600">
          <span className="font-semibold text-slate-500">Barras = área:</span>
          {areas.map(a => (
            <span key={a} className="inline-flex items-center gap-1.5">
              <span className="w-3 h-2 rounded-sm" style={{ backgroundColor: corDaArea(a) }} />
              {a}
            </span>
          ))}
          <span className="font-semibold text-slate-500 ml-2">Seta = nível:</span>
          {NIVEIS.map(n => (
            <span key={n} className="inline-flex items-center gap-1.5">
              <span className="w-4 h-0.5" style={{ backgroundColor: COR_NIVEL[n].forte }} />
              {n}
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5 ml-2">
            <span className="w-3 h-3 rounded-sm bg-slate-200/70" /> semana selecionada
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-0 h-3 border-l-2 border-marca-marinho" /> hoje
          </span>
        </div>
      </div>

      <div className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Eixo */}
          <div className="flex border-b border-slate-200 sticky top-0 bg-white">
            <div className="w-72 shrink-0 px-4 py-2 text-xs font-semibold text-slate-500">Dependência</div>
            <div className="relative flex-1 h-8 mr-4">
              {marcas.map(m => (
                <span key={m} className="absolute top-2 -translate-x-1/2 text-[11px] text-slate-500 tabular-nums" style={{ left: `${x(m)}%` }}>
                  {dataCurta(m)}
                </span>
              ))}
            </div>
          </div>

          {visiveis.map(d => (
            <Linha key={d.acao.id} d={d} x={x} inicioEixo={inicioEixo} marcas={marcas} semana={semana} hoje={hoje} aoPassar={mostrarDica} aoSair={() => setDica(null)} />
          ))}
        </div>
      </div>

      {dica &&
        createPortal(
          <div
            className="fixed z-[60] pointer-events-none w-72 rounded-xl bg-white border border-slate-200 shadow-lg p-3"
            style={{ top: dica.y + 14, left: Math.min(dica.x + 14, window.innerWidth - 300) }}
          >
            <p className="text-[11px] uppercase tracking-wide text-slate-400">{dica.papel}</p>
            <p className="mt-0.5 text-sm font-medium text-slate-800">{nomeBase(dica.acao.nome)}</p>
            <p className="text-xs text-slate-500">{rotuloCurso(dica.acao)}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
              <EtiquetaArea area={dica.acao.area} />
              <span className="text-xs text-slate-600 tabular-nums">{periodo(dica.acao)}</span>
              <EtiquetaStatus status={dica.acao.status} />
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}

function Chip({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-slate-200 ${ativo ? 'bg-marca-marinho text-white' : 'bg-white text-slate-600'}`}
    >
      {children}
    </button>
  )
}

const Y_ANTERIOR = 30 // centro da barra da etapa anterior (px)
const Y_ACAO = 52 // centro da barra da ação

function Linha({
  d,
  x,
  inicioEixo,
  marcas,
  semana,
  hoje,
  aoPassar,
  aoSair,
}: {
  d: Dependencia
  x: (iso: string) => number
  inicioEixo: string
  marcas: string[]
  semana: { inicio: string; fim: string }
  hoje: string
  aoPassar: (a: Acao, papel: string) => (e: React.MouseEvent) => void
  aoSair: () => void
}) {
  const cor = COR_NIVEL[d.nivel].forte
  const ini = (a: Acao) => x(a.inicio ?? a.termino!)
  const fim = (a: Acao) => x(somarDias(a.termino!, 1))
  const fimAnterior = fim(d.anterior)
  const inicioAcao = ini(d.acao)

  const barra = (a: Acao, y: number, papel: string) => {
    const cortada = (a.inicio ?? a.termino!) < inicioEixo
    return (
      <div
        onMouseMove={aoPassar(a, papel)}
        onMouseLeave={aoSair}
        className={`absolute h-2.5 cursor-default hover:ring-2 hover:ring-slate-400 ${cortada ? 'rounded-r' : 'rounded'}`}
        style={{ left: `${ini(a)}%`, width: `max(${fim(a) - ini(a)}%, 6px)`, top: y - 5, backgroundColor: corDaArea(a.area) }}
      >
        {cortada && <span className="absolute -left-2.5 -top-1 text-[11px] text-slate-400">◂</span>}
      </div>
    )
  }

  return (
    <div className="flex border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60">
      <div className="w-72 shrink-0 px-4 py-2 space-y-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <EtiquetaNivel nivel={d.nivel} />
          <EtiquetaCluster cluster={d.acao.cluster} />
        </div>
        <p className="text-xs text-slate-500 truncate" title={`${nomeBase(d.anterior.nome)} [${d.anterior.area}]`}>
          {nomeBase(d.anterior.nome)} <span className="text-slate-400">[{d.anterior.area}]</span>
        </p>
        <p className="text-xs font-medium text-slate-800 truncate" title={`${nomeBase(d.acao.nome)} [${d.acao.area}] · ${rotuloCurso(d.acao)}`}>
          {nomeBase(d.acao.nome)} <span className="font-normal text-slate-400">[{d.acao.area}] · {rotuloCurso(d.acao)}</span>
        </p>
      </div>
      <div className="relative flex-1 mr-4" style={{ minHeight: 72 }}>
        {/* fundo: semana selecionada, segundas e hoje */}
        <div className="absolute inset-y-0 bg-slate-200/50" style={{ left: `${x(semana.inicio)}%`, width: `${x(somarDias(semana.fim, 1)) - x(semana.inicio)}%` }} />
        {marcas.map(m => (
          <div key={m} className="absolute inset-y-0 border-l border-slate-100" style={{ left: `${x(m)}%` }} />
        ))}
        <div className="absolute inset-y-0 border-l-2 border-marca-marinho/70" style={{ left: `${x(hoje)}%` }} />

        {barra(d.anterior, Y_ANTERIOR, 'Etapa anterior')}
        {barra(d.acao, Y_ACAO, 'Ação da semana')}

        {/* seta: desce do fim da etapa anterior e segue até o início da ação */}
        <div className="absolute border-l-2" style={{ left: `${fimAnterior}%`, top: Y_ANTERIOR, height: Y_ACAO - Y_ANTERIOR, borderColor: cor }} />
        {inicioAcao > fimAnterior && (
          <>
            <div
              className="absolute border-t-2"
              style={{ left: `${fimAnterior}%`, width: `${inicioAcao - fimAnterior}%`, top: Y_ACAO - 1, borderColor: cor }}
            />
            <div
              className="absolute w-0 h-0 border-y-[5px] border-y-transparent border-l-[7px] -translate-x-full"
              style={{ left: `${inicioAcao}%`, top: Y_ACAO - 5, borderLeftColor: cor }}
            />
          </>
        )}
        {inicioAcao <= fimAnterior && (
          <div
            className="absolute w-0 h-0 border-x-[5px] border-x-transparent border-t-[7px] -translate-x-1/2"
            style={{ left: `${fimAnterior}%`, top: Y_ACAO - 12, borderTopColor: cor }}
          />
        )}
      </div>
    </div>
  )
}
