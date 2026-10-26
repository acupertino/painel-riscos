'use client'

import { useMemo, useState } from 'react'
import { passaFiltro, useSemana } from '@/components/semana/ContextoSemana'
import { EtiquetaArea, EtiquetaNivel, Vazio } from '@/components/semana/Etiquetas'
import { preverRiscos, TIPOS, type TipoRisco } from '@/lib/previsao'
import { COR_NIVEL, dataCurta, somarDias } from '@/lib/semana'

const HORIZONTES = [2, 4, 6, 8]
const SEMANAS_POR_BLOCO = 2

// Previsão: riscos das semanas seguintes à selecionada. Só aponta o risco; o que fazer é
// decisão da diretoria.
export default function Previsao() {
  const { todas, filtros, semana, hoje } = useSemana()
  const [semanas, setSemanas] = useState(4)
  const [tipo, setTipo] = useState<TipoRisco | ''>('')
  const [bloco, setBloco] = useState(0)

  const inicio = somarDias(semana.fim, 1)
  const { riscos, semanas: semanasHorizonte, fim } = useMemo(
    () => preverRiscos(todas.filter(a => passaFiltro(a, filtros)), hoje, inicio, semanas),
    [todas, filtros, hoje, inicio, semanas],
  )
  const visiveis = tipo ? riscos.filter(r => r.tipo === tipo) : riscos
  const criticos = riscos.filter(r => r.nivel === 'crítico').length

  // A lista mostra duas semanas por vez, para não virar um listão.
  const blocos = Array.from({ length: Math.ceil(semanasHorizonte.length / SEMANAS_POR_BLOCO) }, (_, i) =>
    semanasHorizonte.slice(i * SEMANAS_POR_BLOCO, (i + 1) * SEMANAS_POR_BLOCO),
  )
  const atual = Math.min(bloco, blocos.length - 1)
  const contar = (ss: string[]) => visiveis.filter(r => ss.includes(r.semana)).length
  const porSemana = (blocos[atual] ?? []).map(s => ({ semana: s, riscos: visiveis.filter(r => r.semana === s) }))

  return (
    <div className="space-y-4">
      <section className="rounded-xl bg-white border border-slate-200 shadow-sm p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-slate-700">Horizonte:</span>
          {HORIZONTES.map(n => (
            <Chip
              key={n}
              ativo={semanas === n}
              onClick={() => {
                setSemanas(n)
                setBloco(0)
              }}
            >
              {n} semanas
            </Chip>
          ))}
          <span className="text-sm text-slate-500">
            de {dataCurta(inicio)} a {dataCurta(fim)} · {riscos.length} {riscos.length === 1 ? 'risco' : 'riscos'}
            {criticos > 0 && `, ${criticos} ${criticos === 1 ? 'crítico' : 'críticos'}`}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Chip ativo={tipo === ''} onClick={() => setTipo('')}>Todos ({riscos.length})</Chip>
          {TIPOS.map(t => (
            <Chip key={t.tipo} ativo={tipo === t.tipo} onClick={() => setTipo(t.tipo)}>
              {t.tipo.charAt(0).toUpperCase() + t.tipo.slice(1)} ({riscos.filter(r => r.tipo === t.tipo).length})
            </Chip>
          ))}
        </div>
        <details className="text-xs text-slate-600">
          <summary className="cursor-pointer font-semibold text-slate-500 hover:text-slate-700">Como a previsão é calculada</summary>
          <ul className="mt-2 space-y-1">
            {TIPOS.map(t => (
              <li key={t.tipo}>
                <span className="font-semibold text-slate-700">{t.tipo.charAt(0).toUpperCase() + t.tipo.slice(1)}:</span> {t.criterio}
              </li>
            ))}
          </ul>
        </details>
      </section>

      {riscos.length === 0 && <Vazio texto="Nenhum risco previsto no horizonte escolhido." />}

      {blocos.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setBloco(Math.max(0, atual - 1))}
            disabled={atual === 0}
            className="w-8 h-8 rounded-full bg-white ring-1 ring-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            aria-label="Duas semanas anteriores"
          >
            ‹
          </button>
          {blocos.map((ss, i) => (
            <button
              key={ss[0]}
              onClick={() => setBloco(i)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ring-1 ring-slate-200 ${
                i === atual ? 'bg-marca-marinho text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {dataCurta(ss[0])} a {dataCurta(somarDias(ss[ss.length - 1], 6))}
              <span className={`ml-1.5 font-normal ${i === atual ? 'text-slate-200' : 'text-slate-400'}`}>({contar(ss)})</span>
            </button>
          ))}
          <button
            onClick={() => setBloco(Math.min(blocos.length - 1, atual + 1))}
            disabled={atual === blocos.length - 1}
            className="w-8 h-8 rounded-full bg-white ring-1 ring-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            aria-label="Próximas duas semanas"
          >
            ›
          </button>
        </div>
      )}

      {riscos.length > 0 && porSemana.every(p => p.riscos.length === 0) && <Vazio texto="Nenhum risco nestas duas semanas." />}

      {porSemana.map(({ semana: s, riscos: rs }) =>
        rs.length === 0 ? null : (
          <section key={s} className="space-y-2">
            <h2 className="text-sm font-semibold text-slate-800">
              Semana de {dataCurta(s)} a {dataCurta(somarDias(s, 6))}
              <span className="ml-2 font-normal text-slate-500">
                {rs.length} {rs.length === 1 ? 'risco' : 'riscos'}
              </span>
            </h2>
            <div className="grid gap-3 xl:grid-cols-2 items-start">
              {rs.map((r, i) => (
                <article
                  key={i}
                  className="rounded-xl bg-white border border-slate-200 border-l-4 shadow-sm p-4"
                  style={{ borderLeftColor: COR_NIVEL[r.nivel].forte }}
                >
                  <header className="flex flex-wrap items-center gap-2">
                    <EtiquetaNivel nivel={r.nivel} />
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{r.tipo}</span>
                    <div className="ml-auto flex flex-wrap gap-1">
                      {r.areas.map(a => (
                        <EtiquetaArea key={a} area={a} />
                      ))}
                    </div>
                  </header>
                  <p className="mt-2 text-sm font-medium text-slate-800">{r.titulo}</p>
                  <p className="mt-1 text-xs text-slate-600">{r.detalhe}</p>
                  {r.cursos.length > 0 && <p className="mt-1 text-xs text-slate-500">{r.cursos.join(' · ')}</p>}
                </article>
              ))}
            </div>
          </section>
        ),
      )}
    </div>
  )
}

function Chip({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-slate-200 ${ativo ? 'bg-marca-marinho text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
    >
      {children}
    </button>
  )
}
