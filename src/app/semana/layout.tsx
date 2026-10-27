'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import PageHeader from '@/components/PageHeader'
import { ABAS_SEMANA } from '@/components/navegacao'
import { ProvedorSemana, useSemana } from '@/components/semana/ContextoSemana'
import MiniAgenda from '@/components/semana/MiniAgenda'
import LegendaRisco from '@/components/semana/LegendaRisco'
import { dataCurta, estaVencida } from '@/lib/semana'

// Mesmo título em todas as abas; a aba atual aparece destacada na pílula logo abaixo.
const TITULO = 'Acompanhamento do Portfólio'
const SUBTITULO = 'Calendário Detalhado'

export default function LayoutSemana({ children }: { children: ReactNode }) {
  return (
    <ProvedorSemana>
      <Conteudo>{children}</Conteudo>
    </ProvedorSemana>
  )
}

function Conteudo({ children }: { children: ReactNode }) {
  const caminho = usePathname()
  const ctx = useSemana()
  const naPauta = caminho === '/semana/pauta'

  // O COMEX não depende da Monday nem da semana: só o cabeçalho e o conteúdo.
  if (caminho === '/semana/comex')
    return (
      <>
        <PageHeader titulo={TITULO} subtitulo={SUBTITULO} abas={ABAS_SEMANA} />
        <main className="pt-4 px-4 md:px-8 pb-8">
          <div className="animate-fade-in-up">{children}</div>
        </main>
      </>
    )

  return (
    <>
      <PageHeader titulo={TITULO} subtitulo={SUBTITULO} abas={ABAS_SEMANA} />
      <main className="pt-3 px-4 md:px-8 pb-8 space-y-4">
        <DadosMonday />
        <BarraSemana />
        {/* Filtros à esquerda e legenda de risco à direita, na mesma linha (na pauta, só a legenda). */}
        <div className="flex flex-wrap items-center gap-3">
          {!naPauta && <Filtros />}
          <div className="ml-auto">
            <LegendaRisco />
          </div>
        </div>
        {ctx.erro ? (
          <div className="rounded-xl bg-white border border-slate-200 border-l-4 shadow-sm p-4 text-sm text-slate-700" style={{ borderLeftColor: '#f87171' }}>
            Não foi possível ler a Monday: {ctx.erro}
          </div>
        ) : ctx.carregando && ctx.todas.length === 0 ? (
          <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-6 text-center text-sm text-slate-500 animate-pulse">
            Lendo o Calendário Detalhado na Monday…
          </div>
        ) : (
          <>
            {!naPauta && caminho !== '/semana/previsao' && <Indicadores />}
            <div key={caminho + ctx.semana.inicio} className="animate-fade-in-up">
              {children}
            </div>
          </>
        )}
      </main>
    </>
  )
}

const botao =
  'inline-flex items-center justify-center rounded-full px-3 py-1.5 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50'

function BarraSemana() {
  const { semana, mudarSemana, irParaHoje, hoje } = useSemana()
  const ehAtual = hoje >= semana.inicio && hoje <= semana.fim
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button className={botao} onClick={() => mudarSemana(-1)} aria-label="Semana anterior">←</button>
      <div className="rounded-full bg-white ring-1 ring-slate-200 px-4 py-1.5 text-sm font-semibold text-slate-800">
        Semana de {dataCurta(semana.inicio)} a {dataCurta(semana.fim)}
        {ehAtual && <span className="ml-2 text-xs font-medium text-slate-500">(atual)</span>}
      </div>
      <button className={botao} onClick={() => mudarSemana(1)} aria-label="Próxima semana">→</button>
      <MiniAgenda />
      {!ehAtual && <button className={botao} onClick={irParaHoje}>Esta semana</button>}
    </div>
  )
}

// Data da leitura da Monday e botão de atualizar, centralizados logo abaixo das abas.
function DadosMonday() {
  const { atualizar, carregando, geradoEm } = useSemana()
  return (
    <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
      {geradoEm && <span>Dados da Monday de {new Date(geradoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>}
      <button
        onClick={atualizar}
        disabled={carregando}
        className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-marca-marinho ring-1 ring-slate-200 bg-white hover:bg-marca-claro disabled:opacity-50"
      >
        {carregando ? 'Atualizando…' : 'Atualizar'}
      </button>
    </div>
  )
}

function Filtros() {
  const { filtros, setFiltros, opcoes } = useSemana()
  const campos: { chave: keyof typeof filtros; rotulo: string; valores: string[] }[] = [
    { chave: 'area', rotulo: 'Todas as áreas', valores: opcoes.areas },
    { chave: 'cluster', rotulo: 'Todos os clusters', valores: opcoes.clusters },
    { chave: 'curso', rotulo: 'Todos os cursos', valores: opcoes.cursos },
  ]
  const algum = Object.values(filtros).some(Boolean)
  return (
    <div className="flex flex-wrap items-center gap-2">
      {campos.map(c => (
        <select
          key={c.chave}
          value={filtros[c.chave]}
          onChange={e => setFiltros({ ...filtros, [c.chave]: e.target.value })}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm"
        >
          <option value="">{c.rotulo}</option>
          {c.valores.map(v => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
      ))}
      {algum && (
        <button className="text-sm text-slate-500 hover:text-slate-800 underline" onClick={() => setFiltros({ area: '', cluster: '', curso: '' })}>
          Limpar filtros
        </button>
      )}
    </div>
  )
}

function Indicadores() {
  const { filtradas, dependencias, hoje } = useSemana()
  const cards = [
    { rotulo: 'Ações com término na semana', valor: filtradas.length, cor: '#64748b' },
    { rotulo: 'Clusters', valor: new Set(filtradas.map(a => a.cluster)).size, cor: '#3b82f6' },
    { rotulo: 'Dependências críticas', valor: dependencias.filter(d => d.nivel === 'crítico').length, cor: '#f87171' },
    { rotulo: 'Vencidas sem conclusão', valor: filtradas.filter(a => estaVencida(a, hoje)).length, cor: '#facc15' },
  ]
  return (
    <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
      {cards.map(k => (
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
  )
}
