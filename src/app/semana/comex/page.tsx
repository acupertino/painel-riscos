'use client'

import { useEffect, useState } from 'react'
import { useSemana } from '@/components/semana/ContextoSemana'
import { EtiquetaArea, Vazio } from '@/components/semana/Etiquetas'
import { dataCurta } from '@/lib/semana'
import {
  AREAS_COMEX,
  comexEmTexto,
  estaRespondido,
  novoId,
  type Encaminhamento,
  type PontoComex,
  type ReuniaoComex,
} from '@/lib/comex'

// Encaminhamentos de cada reunião do COMEX e o que cada área precisa responder.
// Salvo pelo app em dados/comex.json; não altera nada na Monday.

const dataLonga = (d: string) => d.split('-').reverse().join('/')
const botaoClaro =
  'inline-flex items-center justify-center rounded-full px-3 py-1.5 text-sm font-semibold text-marca-marinho ring-1 ring-slate-200 bg-white hover:bg-marca-claro disabled:opacity-50'
const botaoForte =
  'inline-flex items-center justify-center rounded-full bg-marca-marinho px-4 py-1.5 text-sm font-semibold text-white hover:bg-marca-azul-escuro disabled:opacity-50'
const campo = 'rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 shadow-sm'

export default function Comex() {
  const { hoje } = useSemana()
  const [reunioes, setReunioes] = useState<ReuniaoComex[] | null>(null)
  const [selecionada, setSelecionada] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [novaData, setNovaData] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    fetch('/api/comex')
      .then(r => r.json())
      .then((j: { reunioes: ReuniaoComex[] }) => {
        const ordenadas = [...j.reunioes].sort((a, b) => b.data.localeCompare(a.data))
        setReunioes(ordenadas)
        setSelecionada(ordenadas[0]?.id ?? null)
      })
      .catch(e => setErro(String(e)))
  }, [])

  const salvar = async (lista: ReuniaoComex[]) => {
    const ordenadas = [...lista].sort((a, b) => b.data.localeCompare(a.data))
    setReunioes(ordenadas)
    setSalvando(true)
    try {
      const r = await fetch('/api/comex', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reunioes: ordenadas }) })
      if (!r.ok) throw new Error((await r.json()).error)
      setErro(null)
    } catch (e) {
      setErro(String(e))
    } finally {
      setSalvando(false)
    }
  }

  if (erro && !reunioes) return <Vazio texto={`Não foi possível ler as reuniões do COMEX: ${erro}`} />
  if (!reunioes) return <Vazio texto="Carregando reuniões do COMEX…" />

  const reuniao = reunioes.find(r => r.id === selecionada) ?? null

  const criarReuniao = () => {
    if (!novaData) return
    const existente = reunioes.find(r => r.data === novaData)
    if (existente) {
      setSelecionada(existente.id)
    } else {
      const nova: ReuniaoComex = { id: novoId(), data: novaData, encaminhamentos: [] }
      salvar([...reunioes, nova])
      setSelecionada(nova.id)
    }
    setNovaData(null)
  }

  const mudarReuniao = (r: ReuniaoComex) => salvar(reunioes.map(x => (x.id === r.id ? r : x)))

  const excluirReuniao = () => {
    if (!reuniao || !confirm(`Excluir a reunião do COMEX de ${dataLonga(reuniao.data)} e todos os encaminhamentos?`)) return
    const resto = reunioes.filter(r => r.id !== reuniao.id)
    salvar(resto)
    setSelecionada(resto[0]?.id ?? null)
  }

  const copiar = async () => {
    if (!reuniao) return
    await navigator.clipboard.writeText(comexEmTexto(reuniao, dataLonga))
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div className="space-y-4">
      {/* Reuniões por data e botão para inserir a data de uma nova reunião. */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-slate-700">Reuniões do COMEX:</span>
        {reunioes.map(r => (
          <button
            key={r.id}
            onClick={() => setSelecionada(r.id)}
            className={`rounded-full px-3 py-1 text-sm font-semibold ring-1 ${
              r.id === selecionada ? 'bg-marca-marinho text-white ring-marca-marinho' : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {dataCurta(r.data)}
          </button>
        ))}
        {novaData === null ? (
          <button className={botaoForte} onClick={() => setNovaData(hoje)}>+ Data do COMEX</button>
        ) : (
          <span className="inline-flex items-center gap-2">
            <input type="date" value={novaData} onChange={e => setNovaData(e.target.value)} className={campo} aria-label="Data da reunião do COMEX" />
            <button className={botaoForte} onClick={criarReuniao} disabled={!novaData}>Criar</button>
            <button className="text-sm text-slate-500 hover:text-slate-800 underline" onClick={() => setNovaData(null)}>Cancelar</button>
          </span>
        )}
        <span className="ml-auto text-xs text-slate-500">{salvando ? 'Salvando…' : erro ? `Erro ao salvar: ${erro}` : ''}</span>
      </div>

      {!reuniao ? (
        <Vazio texto="Nenhuma reunião do COMEX registrada. Use “+ Data do COMEX” para começar." />
      ) : (
        <article className="rounded-xl bg-white border border-slate-200 shadow-sm p-4 md:p-6 space-y-5">
          <header className="flex flex-wrap items-start gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-800">COMEX de {dataLonga(reuniao.data)}</h2>
              <ResumoReuniao reuniao={reuniao} />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button className={botaoClaro} onClick={copiar} disabled={!reuniao.encaminhamentos.length}>
                {copiado ? 'Copiado!' : 'Copiar encaminhamentos'}
              </button>
              <button className="text-sm text-slate-500 hover:text-red-600 underline" onClick={excluirReuniao}>Excluir reunião</button>
            </div>
          </header>

          {reuniao.encaminhamentos.map((e, i) => (
            <CartaoEncaminhamento
              key={e.id}
              numero={i + 1}
              encaminhamento={e}
              aoMudar={novo => mudarReuniao({ ...reuniao, encaminhamentos: reuniao.encaminhamentos.map(x => (x.id === e.id ? novo : x)) })}
              aoExcluir={() => mudarReuniao({ ...reuniao, encaminhamentos: reuniao.encaminhamentos.filter(x => x.id !== e.id) })}
            />
          ))}

          <NovoEncaminhamento
            aoCriar={texto => mudarReuniao({ ...reuniao, encaminhamentos: [...reuniao.encaminhamentos, { id: novoId(), texto, pontos: [] }] })}
          />
        </article>
      )}
    </div>
  )
}

function ResumoReuniao({ reuniao }: { reuniao: ReuniaoComex }) {
  const pontos = reuniao.encaminhamentos.flatMap(e => e.pontos)
  const abertos = pontos.filter(p => !estaRespondido(p)).length
  const n = reuniao.encaminhamentos.length
  return (
    <p className="text-sm text-slate-500">
      {n} {n === 1 ? 'encaminhamento' : 'encaminhamentos'} · {abertos} {abertos === 1 ? 'pergunta em aberto' : 'perguntas em aberto'} para as áreas
    </p>
  )
}

function CartaoEncaminhamento({
  numero,
  encaminhamento: e,
  aoMudar,
  aoExcluir,
}: {
  numero: number
  encaminhamento: Encaminhamento
  aoMudar: (e: Encaminhamento) => void
  aoExcluir: () => void
}) {
  const [texto, setTexto] = useState(e.texto)
  const mudarPonto = (p: PontoComex) => aoMudar({ ...e, pontos: e.pontos.map(x => (x.id === p.id ? p : x)) })

  return (
    <section className="rounded-xl border border-slate-200 border-l-4 border-l-marca-marinho bg-white p-4 space-y-3">
      <div className="flex items-start gap-3">
        <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-marca-marinho text-xs font-bold text-white">{numero}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Encaminhamento</p>
          <textarea
            value={texto}
            onChange={ev => setTexto(ev.target.value)}
            onBlur={() => texto.trim() && texto !== e.texto && aoMudar({ ...e, texto: texto.trim() })}
            rows={Math.max(1, Math.ceil(texto.length / 110))}
            className="w-full resize-none rounded-md border border-transparent px-1 -mx-1 text-base font-semibold text-slate-800 hover:border-slate-200 focus:border-slate-300 focus:outline-none"
          />
        </div>
        <button
          className="text-xs text-slate-400 hover:text-red-600"
          onClick={() => confirm('Excluir este encaminhamento?') && aoExcluir()}
          aria-label="Excluir encaminhamento"
        >
          Excluir
        </button>
      </div>

      <ul className="space-y-2">
        {e.pontos.map(p => (
          <LinhaPonto key={p.id} ponto={p} aoMudar={mudarPonto} aoExcluir={() => aoMudar({ ...e, pontos: e.pontos.filter(x => x.id !== p.id) })} />
        ))}
      </ul>

      <NovoPonto aoCriar={p => aoMudar({ ...e, pontos: [...e.pontos, p] })} />
    </section>
  )
}

function LinhaPonto({ ponto: p, aoMudar, aoExcluir }: { ponto: PontoComex; aoMudar: (p: PontoComex) => void; aoExcluir: () => void }) {
  const [resposta, setResposta] = useState(p.resposta)
  const respondido = estaRespondido(p)
  return (
    <li className="rounded-lg bg-slate-50 px-3 py-2 grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center">
      <div className="flex flex-wrap items-center gap-2 min-w-0">
        <EtiquetaArea area={p.area} />
        <p className="text-sm text-slate-800">{p.pergunta}</p>
      </div>
      <input
        value={resposta}
        onChange={ev => setResposta(ev.target.value)}
        onBlur={() => resposta !== p.resposta && aoMudar({ ...p, resposta: resposta.trim() })}
        placeholder="Resposta da área…"
        className={`${campo} w-full`}
      />
      <div className="flex items-center gap-2 justify-end">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold text-slate-800 whitespace-nowrap"
          style={{ backgroundColor: respondido ? '#6ee7b7' : '#fde68a' }}
        >
          {respondido ? 'Respondido' : 'Em aberto'}
        </span>
        <button className="text-xs text-slate-400 hover:text-red-600" onClick={aoExcluir} aria-label={`Excluir pergunta para ${p.area}`}>✕</button>
      </div>
    </li>
  )
}

function NovoPonto({ aoCriar }: { aoCriar: (p: PontoComex) => void }) {
  const [aberto, setAberto] = useState(false)
  const [area, setArea] = useState('')
  const [pergunta, setPergunta] = useState('')
  if (!aberto)
    return (
      <button className="text-sm font-semibold text-marca-marinho hover:underline" onClick={() => setAberto(true)}>
        + Pergunta para uma área
      </button>
    )
  const criar = () => {
    if (!area.trim() || !pergunta.trim()) return
    aoCriar({ id: novoId(), area: area.trim(), pergunta: pergunta.trim(), resposta: '' })
    setArea('')
    setPergunta('')
    setAberto(false)
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input list="areas-comex" value={area} onChange={ev => setArea(ev.target.value)} placeholder="Área" className={`${campo} w-40`} aria-label="Área" />
      <datalist id="areas-comex">
        {AREAS_COMEX.map(a => <option key={a} value={a} />)}
      </datalist>
      <input
        value={pergunta}
        onChange={ev => setPergunta(ev.target.value)}
        onKeyDown={ev => ev.key === 'Enter' && criar()}
        placeholder="Pergunta para a área"
        className={`${campo} flex-1 min-w-[16rem]`}
        aria-label="Pergunta"
      />
      <button className={botaoForte} onClick={criar} disabled={!area.trim() || !pergunta.trim()}>Adicionar</button>
      <button className="text-sm text-slate-500 hover:text-slate-800 underline" onClick={() => setAberto(false)}>Cancelar</button>
    </div>
  )
}

function NovoEncaminhamento({ aoCriar }: { aoCriar: (texto: string) => void }) {
  const [texto, setTexto] = useState('')
  const criar = () => {
    if (!texto.trim()) return
    aoCriar(texto.trim())
    setTexto('')
  }
  return (
    <div className="rounded-xl border border-dashed border-slate-300 p-4 space-y-2">
      <p className="text-sm font-semibold text-slate-700">Novo encaminhamento</p>
      <textarea value={texto} onChange={ev => setTexto(ev.target.value)} rows={2} placeholder="O que foi decidido no COMEX?" className={`${campo} w-full`} />
      <button className={botaoForte} onClick={criar} disabled={!texto.trim()}>Adicionar encaminhamento</button>
    </div>
  )
}
