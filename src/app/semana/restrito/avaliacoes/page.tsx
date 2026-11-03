'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSemana } from '@/components/semana/ContextoSemana'
import { EtiquetaNivel, Vazio } from '@/components/semana/Etiquetas'
import AvisoNaoSalvo, { useAvisoAoSair } from '@/components/AvisoNaoSalvo'
import { novoId } from '@/lib/comex'
import { dataCurta } from '@/lib/semana'
import {
  COR_CATEGORIA,
  categoriaDe,
  estaVencidaGav,
  riscosEmTexto,
  type AcaoGav,
  type AvaliacaoGav,
  type CategoriaStatus,
  type RiscoSemana,
} from '@/lib/escritorio'

// Escritório de Projetos (quadro Avaliações_GAV): um tópico por avaliação com as ações,
// status e datas previstas, e os riscos da semana registrados à mão.

const botao =
  'inline-flex items-center justify-center rounded-full px-3 py-1.5 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50'
const botaoForte =
  'inline-flex items-center justify-center rounded-full bg-marca-marinho px-4 py-1.5 text-sm font-semibold text-white hover:bg-marca-azul-escuro disabled:opacity-50'
const campo = 'rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 shadow-sm'
const ORDEM_CATEGORIAS: CategoriaStatus[] = ['concluído', 'em andamento', 'em atraso', 'a iniciar', 'outros', 'sem status']

const periodoPrevisto = (a: AcaoGav) =>
  a.inicioPrevisto && a.fimPrevisto && a.inicioPrevisto !== a.fimPrevisto
    ? `${dataCurta(a.inicioPrevisto)}–${dataCurta(a.fimPrevisto)}`
    : dataCurta(a.fimPrevisto ?? a.inicioPrevisto)

interface Dados {
  geradoEm: string
  avaliacoes: AvaliacaoGav[]
}

export default function EscritorioDeProjetos() {
  const { hoje } = useSemana()
  const [dados, setDados] = useState<Dados | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [filtroAvaliacao, setFiltroAvaliacao] = useState('')
  const [soPendentes, setSoPendentes] = useState(false)

  const buscar = useCallback((forcar: boolean) => {
    fetch(`/api/escritorio${forcar ? '?refresh=1' : ''}`)
      .then(r => r.json())
      .then(j => {
        if (j.error) throw new Error(j.error)
        setDados(j)
        setErro(null)
      })
      .catch(e => setErro(String(e)))
      .finally(() => setCarregando(false))
  }, [])

  useEffect(() => buscar(false), [buscar])

  const avaliacoes = useMemo(() => {
    if (!dados) return []
    return dados.avaliacoes
      .filter(a => !filtroAvaliacao || a.nome === filtroAvaliacao)
      .map(a => ({ ...a, acoes: soPendentes ? a.acoes.filter(x => categoriaDe(x.status) !== 'concluído') : a.acoes }))
      .filter(a => a.acoes.length > 0)
  }, [dados, filtroAvaliacao, soPendentes])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
        {dados && <span>Dados da Monday de {new Date(dados.geradoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>}
        <button
          onClick={() => {
            setCarregando(true)
            buscar(true)
          }}
          disabled={carregando}
          className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-marca-marinho ring-1 ring-slate-200 bg-white hover:bg-marca-claro disabled:opacity-50"
        >
          {carregando ? 'Atualizando…' : 'Atualizar'}
        </button>
      </div>

      {erro && !dados ? (
        <Vazio texto={`Não foi possível ler o quadro Avaliações_GAV na Monday: ${erro}`} />
      ) : !dados ? (
        <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-6 text-center text-sm text-slate-500 animate-pulse">
          Lendo o quadro Avaliações_GAV na Monday…
        </div>
      ) : (
        <>
          <Indicadores avaliacoes={dados.avaliacoes} hoje={hoje} />

          <div className="flex flex-wrap items-center gap-3">
            <select value={filtroAvaliacao} onChange={e => setFiltroAvaliacao(e.target.value)} className={campo}>
              <option value="">Todas as avaliações</option>
              {dados.avaliacoes.map(a => (
                <option key={a.nome} value={a.nome}>{a.nome}</option>
              ))}
            </select>
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={soPendentes} onChange={e => setSoPendentes(e.target.checked)} className="accent-marca-marinho" />
              Só ações não concluídas
            </label>
            <a href="#riscos" className="ml-auto text-sm font-semibold text-marca-marinho hover:underline">Ir para os riscos da semana ↓</a>
          </div>

          {avaliacoes.length === 0 ? (
            <Vazio texto="Nenhuma ação com esses filtros." />
          ) : (
            <div className="space-y-4">
              {avaliacoes.map(a => (
                <CartaoAvaliacao key={a.nome} avaliacao={a} hoje={hoje} />
              ))}
            </div>
          )}

          <RiscosDaSemana avaliacoes={dados.avaliacoes.map(a => a.nome)} />
        </>
      )}
    </div>
  )
}

function Indicadores({ avaliacoes, hoje }: { avaliacoes: AvaliacaoGav[]; hoje: string }) {
  const acoes = avaliacoes.flatMap(a => a.acoes)
  const daqui30 = new Date(Date.parse(hoje) + 30 * 864e5).toISOString().slice(0, 10)
  const cards = [
    { rotulo: 'Avaliações', valor: avaliacoes.length, cor: '#64748b' },
    { rotulo: 'Ações em andamento', valor: acoes.filter(a => categoriaDe(a.status) === 'em andamento').length, cor: COR_CATEGORIA['em andamento'] },
    {
      rotulo: 'Em atraso ou com prazo vencido',
      valor: acoes.filter(a => categoriaDe(a.status) === 'em atraso' || estaVencidaGav(a, hoje)).length,
      cor: COR_CATEGORIA['em atraso'],
    },
    {
      rotulo: 'Prazos nos próximos 30 dias',
      valor: acoes.filter(a => a.fimPrevisto && a.fimPrevisto >= hoje && a.fimPrevisto <= daqui30 && categoriaDe(a.status) !== 'concluído').length,
      cor: COR_CATEGORIA['a iniciar'],
    },
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

function CartaoAvaliacao({ avaliacao, hoje }: { avaliacao: AvaliacaoGav; hoje: string }) {
  const contagem = ORDEM_CATEGORIAS.map(c => ({ c, n: avaliacao.acoes.filter(a => categoriaDe(a.status) === c).length })).filter(x => x.n)
  const concluidas = contagem.find(x => x.c === 'concluído')?.n ?? 0
  const total = avaliacao.acoes.length
  return (
    <section className="rounded-xl bg-white border border-slate-200 border-l-4 border-l-marca-marinho shadow-sm p-4">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h2 className="text-base font-bold text-slate-800">{avaliacao.nome}</h2>
        <span className="text-xs text-slate-500">
          {concluidas} de {total} {total === 1 ? 'ação concluída' : 'ações concluídas'}
        </span>
        <div className="ml-auto flex h-2 w-40 overflow-hidden rounded-full bg-slate-100" title={contagem.map(x => `${x.c}: ${x.n}`).join(' · ')}>
          {contagem.map(x => (
            <div key={x.c} style={{ width: `${(x.n / total) * 100}%`, backgroundColor: COR_CATEGORIA[x.c] }} />
          ))}
        </div>
      </header>
      <ul className="mt-3 divide-y divide-slate-100">
        {avaliacao.acoes.map(a => (
          <LinhaAcao key={a.id} acao={a} hoje={hoje} />
        ))}
      </ul>
    </section>
  )
}

function Status({ status }: { status: string | null }) {
  const cor = COR_CATEGORIA[categoriaDe(status)]
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 whitespace-nowrap">
      <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cor }} />
      {status ? status.charAt(0) + status.slice(1).toLowerCase() : 'Sem status'}
    </span>
  )
}

function Datas({ acao, hoje }: { acao: AcaoGav; hoje: string }) {
  const vencida = estaVencidaGav(acao, hoje)
  return (
    <span className="text-xs text-slate-500 whitespace-nowrap tabular-nums">
      Previsto: <span className={vencida ? 'font-semibold text-red-600' : 'text-slate-700'}>{periodoPrevisto(acao)}</span>
      {acao.fimReal && <> · Fim real: <span className="text-slate-700">{dataCurta(acao.fimReal)}</span></>}
      {vencida && <span className="ml-1.5 rounded-full bg-red-100 px-1.5 py-0.5 font-semibold text-red-700">prazo vencido</span>}
    </span>
  )
}

function LinhaAcao({ acao, hoje }: { acao: AcaoGav; hoje: string }) {
  const [aberta, setAberta] = useState(false)
  const n = acao.subacoes.length
  return (
    <li className="py-2">
      <div className="grid gap-1 md:grid-cols-[minmax(0,1fr)_9rem_15rem] md:items-center md:gap-3">
        <div className="flex items-start gap-2 min-w-0">
          <button
            onClick={() => setAberta(!aberta)}
            disabled={!n}
            className="mt-0.5 w-4 shrink-0 text-xs text-slate-400 hover:text-marca-marinho disabled:invisible"
            aria-label={aberta ? 'Esconder subações' : 'Mostrar subações'}
          >
            {aberta ? '▾' : '▸'}
          </button>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-800">{acao.nome}</p>
            <p className="text-xs text-slate-500">
              {acao.responsaveis && <>Responsáveis: {acao.responsaveis}</>}
              {n > 0 && (
                <button onClick={() => setAberta(!aberta)} className="ml-2 font-semibold text-marca-marinho hover:underline">
                  {n} {n === 1 ? 'subação' : 'subações'}
                </button>
              )}
            </p>
          </div>
        </div>
        <Status status={acao.status} />
        <Datas acao={acao} hoje={hoje} />
      </div>
      {aberta && (
        <ul className="mt-2 ml-6 rounded-lg bg-slate-50 divide-y divide-slate-100">
          {acao.subacoes.map(s => (
            <li key={s.id} className="px-3 py-1.5 grid gap-1 md:grid-cols-[minmax(0,1fr)_9rem_15rem] md:items-center md:gap-3">
              <p className="text-sm text-slate-700 min-w-0">
                {s.nome}
                {s.responsaveis && <span className="text-xs text-slate-500"> · {s.responsaveis}</span>}
              </p>
              <Status status={s.status} />
              <Datas acao={s} hoje={hoje} />
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

function RiscosDaSemana({ avaliacoes }: { avaliacoes: string[] }) {
  const { semana, mudarSemana, irParaHoje, hoje } = useSemana()
  const [riscos, setRiscos] = useState<RiscoSemana[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [erroSalvar, setErroSalvar] = useState<string | null>(null)
  const [pendente, setPendente] = useState<RiscoSemana[] | null>(null) // lista que falhou ao salvar
  const [copiado, setCopiado] = useState(false)
  const [novo, setNovo] = useState({ descricao: '', avaliacao: 'Geral', nivel: 'atenção' as RiscoSemana['nivel'], responsavel: '' })
  useAvisoAoSair(!!novo.descricao.trim())

  useEffect(() => {
    fetch('/api/escritorio/riscos')
      .then(r => r.json())
      .then(j => setRiscos(j.riscos))
      .catch(e => setErro(String(e)))
  }, [])

  const salvar = async (lista: RiscoSemana[]) => {
    setRiscos(lista)
    try {
      const r = await fetch('/api/escritorio/riscos', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ riscos: lista }) })
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? `erro ${r.status}`)
      setErroSalvar(null)
      setPendente(null)
    } catch (e) {
      setErroSalvar(String(e))
      setPendente(lista)
    }
  }

  const daSemana = (riscos ?? [])
    .filter(r => r.semana === semana.inicio)
    .sort((a, b) => (a.nivel === b.nivel ? 0 : a.nivel === 'crítico' ? -1 : 1))
  const periodo = `${dataCurta(semana.inicio)} a ${dataCurta(semana.fim)}`
  const ehAtual = hoje >= semana.inicio && hoje <= semana.fim

  const adicionar = () => {
    if (!riscos || !novo.descricao.trim()) return
    salvar([...riscos, { id: novoId(), semana: semana.inicio, ...novo, descricao: novo.descricao.trim(), responsavel: novo.responsavel.trim() }])
    setNovo({ ...novo, descricao: '', responsavel: '' })
  }
  const mudar = (r: RiscoSemana) => riscos && salvar(riscos.map(x => (x.id === r.id ? r : x)))

  const copiar = async () => {
    await navigator.clipboard.writeText(riscosEmTexto(daSemana, periodo))
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <section id="riscos" className="scroll-mt-36 rounded-xl bg-white border border-slate-200 shadow-sm p-4 md:p-6 space-y-4">
      <header className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-bold text-slate-800 mr-2">Riscos da semana</h2>
        <button className={botao} onClick={() => mudarSemana(-1)} aria-label="Semana anterior">←</button>
        <span className="rounded-full bg-white ring-1 ring-slate-200 px-4 py-1.5 text-sm font-semibold text-slate-800">
          Semana de {periodo}
          {ehAtual && <span className="ml-2 text-xs font-medium text-slate-500">(atual)</span>}
        </span>
        <button className={botao} onClick={() => mudarSemana(1)} aria-label="Próxima semana">→</button>
        {!ehAtual && <button className={botao} onClick={irParaHoje}>Esta semana</button>}
        <button className={`${botao} ml-auto`} onClick={copiar} disabled={!daSemana.length}>
          {copiado ? 'Copiado!' : 'Copiar riscos'}
        </button>
      </header>
      {erro && <p className="text-xs text-red-600">Não foi possível ler os riscos: {erro}</p>}
      <AvisoNaoSalvo erro={erroSalvar} aoTentarDeNovo={() => pendente && salvar(pendente)} />

      {!riscos ? (
        <p className="text-sm text-slate-500">Carregando riscos…</p>
      ) : daSemana.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhum risco registrado nesta semana.</p>
      ) : (
        <ul className="space-y-2">
          {daSemana.map(r => (
            <LinhaRisco key={r.id} risco={r} aoMudar={mudar} aoExcluir={() => salvar(riscos.filter(x => x.id !== r.id))} />
          ))}
        </ul>
      )}

      <div className="rounded-xl border border-dashed border-slate-300 p-4 space-y-2">
        <p className="text-sm font-semibold text-slate-700">Novo risco para a semana de {periodo}</p>
        <textarea
          value={novo.descricao}
          onChange={e => setNovo({ ...novo, descricao: e.target.value })}
          rows={2}
          placeholder="Qual é o risco?"
          className={`${campo} w-full`}
        />
        <div className="flex flex-wrap items-center gap-2">
          <select value={novo.avaliacao} onChange={e => setNovo({ ...novo, avaliacao: e.target.value })} className={campo} aria-label="Avaliação">
            <option value="Geral">Geral</option>
            {avaliacoes.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <select value={novo.nivel} onChange={e => setNovo({ ...novo, nivel: e.target.value as RiscoSemana['nivel'] })} className={campo} aria-label="Nível">
            <option value="atenção">Atenção</option>
            <option value="crítico">Crítico</option>
          </select>
          <input
            value={novo.responsavel}
            onChange={e => setNovo({ ...novo, responsavel: e.target.value })}
            placeholder="Responsável (opcional)"
            className={`${campo} w-56`}
          />
          <button className={botaoForte} onClick={adicionar} disabled={!novo.descricao.trim()}>Adicionar risco</button>
        </div>
      </div>
    </section>
  )
}

function LinhaRisco({ risco: r, aoMudar, aoExcluir }: { risco: RiscoSemana; aoMudar: (r: RiscoSemana) => void; aoExcluir: () => void }) {
  const [descricao, setDescricao] = useState(r.descricao)
  return (
    <li className="rounded-lg bg-slate-50 px-3 py-2 flex flex-wrap items-start gap-2">
      <button
        onClick={() => aoMudar({ ...r, nivel: r.nivel === 'crítico' ? 'atenção' : 'crítico' })}
        title="Clique para trocar entre crítico e atenção"
      >
        <EtiquetaNivel nivel={r.nivel} />
      </button>
      <div className="flex-1 min-w-[16rem]">
        <textarea
          value={descricao}
          onChange={e => setDescricao(e.target.value)}
          onBlur={() => descricao.trim() && descricao !== r.descricao && aoMudar({ ...r, descricao: descricao.trim() })}
          rows={Math.max(1, Math.ceil(descricao.length / 120))}
          className="w-full resize-none rounded-md border border-transparent bg-transparent px-1 -mx-1 text-sm text-slate-800 hover:border-slate-200 focus:border-slate-300 focus:bg-white focus:outline-none"
        />
        <p className="text-xs text-slate-500">
          {r.avaliacao}
          {r.responsavel && <> · Responsável: {r.responsavel}</>}
        </p>
      </div>
      <button
        className="text-xs text-slate-400 hover:text-red-600"
        onClick={() => confirm('Excluir este risco?') && aoExcluir()}
        aria-label="Excluir risco"
      >
        Excluir
      </button>
    </li>
  )
}
