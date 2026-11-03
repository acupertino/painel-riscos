'use client'

import { useEffect, useState } from 'react'
import { notFound, useParams } from 'next/navigation'
import { Vazio } from '@/components/semana/Etiquetas'
import AvisoNaoSalvo, { useAvisoAoSair } from '@/components/AvisoNaoSalvo'
import {
  COR_STATUS_PLANO,
  STATUS_PLANO,
  novaAcao,
  novaEntrega,
  planoDe,
  type AcaoDoPlano,
  type EntregaDoPlano,
  type FrenteDoPlano,
  type StatusPlano,
} from '@/lib/planos'

// Planos da área restrita (Plano de Comunicação, Credenciamento IA no MEC etc.): uma subaba por
// frente, com objetivo, ações, status, responsável, prazo e entregas. Salvo pelo app em
// dados/plano-{slug}.json; não altera nada na Monday.

const botaoForte =
  'inline-flex items-center justify-center rounded-full bg-marca-marinho px-4 py-1.5 text-sm font-semibold text-white hover:bg-marca-azul-escuro disabled:opacity-50'
const campo = 'rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 shadow-sm'

export default function PaginaPlano() {
  const plano = planoDe(useParams<{ plano: string }>().plano)
  if (!plano) notFound()
  return <EditorPlano key={plano.slug} slug={plano.slug} titulo={plano.titulo} encaminhamentos={plano.formato === 'encaminhamentos'} />
}

function EditorPlano({ slug, titulo, encaminhamentos }: { slug: string; titulo: string; encaminhamentos: boolean }) {
  const url = `/api/planos/${slug}`
  const [frentes, setFrentes] = useState<FrenteDoPlano[] | null>(null)
  const [selecionada, setSelecionada] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [erroSalvar, setErroSalvar] = useState<string | null>(null)
  const [pendente, setPendente] = useState<FrenteDoPlano[] | null>(null) // lista que falhou ao salvar
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    fetch(url)
      .then(r => r.json())
      .then((j: { frentes: FrenteDoPlano[]; error?: string }) => {
        if (j.error) throw new Error(j.error)
        setFrentes(j.frentes)
        setSelecionada(j.frentes[0]?.id ?? null)
      })
      .catch(e => setErro(String(e.message ?? e)))
  }, [url])

  const salvar = async (lista: FrenteDoPlano[]) => {
    setFrentes(lista)
    setSalvando(true)
    try {
      const r = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ frentes: lista }) })
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? `erro ${r.status}`)
      setErroSalvar(null)
      setPendente(null)
    } catch (e) {
      setErroSalvar(String(e))
      setPendente(lista)
    } finally {
      setSalvando(false)
    }
  }

  if (erro && !frentes) return <Vazio texto={`Não foi possível ler ${titulo}: ${erro}`} />
  if (!frentes) return <Vazio texto={`Carregando ${titulo}…`} />

  const frente = frentes.find(f => f.id === selecionada) ?? frentes[0]
  const mudarAcoes = (acoes: AcaoDoPlano[]) => salvar(frentes.map(f => (f.id === frente.id ? { ...f, acoes } : f)))

  return (
    <div className="space-y-4">
      {/* Subabas: uma por frente (só aparecem quando o plano tem mais de uma). */}
      <div className="flex flex-wrap items-center gap-2">
        {frentes.length > 1 && (
          <nav className="inline-flex flex-wrap gap-1 rounded-full bg-slate-100 ring-1 ring-slate-200 p-1">
            {frentes.map(f => (
              <button
                key={f.id}
                onClick={() => setSelecionada(f.id)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
                  f.id === frente.id ? 'bg-marca-marinho text-white' : 'text-slate-600 hover:bg-white'
                }`}
              >
                {f.nome}
              </button>
            ))}
          </nav>
        )}
        <span className={`ml-auto text-xs ${erroSalvar ? 'font-semibold text-red-600' : 'text-slate-500'}`}>
          {salvando ? 'Salvando…' : erroSalvar ? 'Não salvo' : ''}
        </span>
      </div>
      <AvisoNaoSalvo erro={erroSalvar} aoTentarDeNovo={() => pendente && salvar(pendente)} />

      {encaminhamentos ? (
        <ListaEncaminhamentos key={frente.id} frente={frente} aoMudar={mudarAcoes} />
      ) : (
      <article key={frente.id} className="rounded-xl bg-white border border-slate-200 shadow-sm p-4 md:p-6 space-y-4 animate-fade-in-up">
        <header>
          <h2 className="text-lg font-bold text-slate-800">{frente.nome}</h2>
          <Resumo acoes={frente.acoes} />
        </header>

        <Objetivo
          valor={frente.objetivo ?? ''}
          aoMudar={objetivo => salvar(frentes.map(f => (f.id === frente.id ? { ...f, objetivo } : f)))}
        />

        {frente.acoes.length === 0 && <p className="text-sm text-slate-500">Nenhuma ação cadastrada nesta frente ainda.</p>}

        {frente.acoes.map((a, i) => (
          <CartaoAcao
            key={a.id}
            numero={i + 1}
            acao={a}
            aoMudar={nova => mudarAcoes(frente.acoes.map(x => (x.id === a.id ? nova : x)))}
            aoExcluir={() => mudarAcoes(frente.acoes.filter(x => x.id !== a.id))}
          />
        ))}

        <NovaAcao
          aoCriar={nome => mudarAcoes([...frente.acoes, novaAcao(nome)])}
        />
      </article>
      )}
    </div>
  )
}

// Encaminhamentos de uma reunião: uma linha por encaminhamento, com botão feito/pendente
// (status "concluído" ou "a iniciar"), responsável, prazo e o tema da ata em observações.
function ListaEncaminhamentos({ frente, aoMudar }: { frente: FrenteDoPlano; aoMudar: (acoes: AcaoDoPlano[]) => void }) {
  const [soPendentes, setSoPendentes] = useState(false)
  const feitos = frente.acoes.filter(a => a.status === 'concluído').length
  const visiveis = soPendentes ? frente.acoes.filter(a => a.status !== 'concluído') : frente.acoes
  const mudar = (a: AcaoDoPlano) => aoMudar(frente.acoes.map(x => (x.id === a.id ? a : x)))

  return (
    <article className="rounded-xl bg-white border border-slate-200 shadow-sm p-4 md:p-6 space-y-4 animate-fade-in-up">
      <header className="flex flex-wrap items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800">{frente.nome}</h2>
          <p className="text-sm text-slate-500">
            {feitos} de {frente.acoes.length} {frente.acoes.length === 1 ? 'encaminhamento feito' : 'encaminhamentos feitos'}
          </p>
        </div>
        <label className="ml-auto inline-flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={soPendentes} onChange={e => setSoPendentes(e.target.checked)} className="accent-marca-marinho" />
          Só pendentes
        </label>
      </header>

      {!visiveis.length && <p className="text-sm text-slate-500">{frente.acoes.length ? 'Tudo feito nesta reunião.' : 'Nenhum encaminhamento ainda.'}</p>}

      <ul className="space-y-2">
        {visiveis.map(a => (
          <LinhaEncaminhamento key={a.id} acao={a} aoMudar={mudar} aoExcluir={() => aoMudar(frente.acoes.filter(x => x.id !== a.id))} />
        ))}
      </ul>

      <NovaAcao item="encaminhamento" aoCriar={nome => aoMudar([...frente.acoes, novaAcao(nome)])} />
    </article>
  )
}

function LinhaEncaminhamento({ acao: a, aoMudar, aoExcluir }: { acao: AcaoDoPlano; aoMudar: (a: AcaoDoPlano) => void; aoExcluir: () => void }) {
  const [nome, setNome] = useState(a.nome)
  const [responsavel, setResponsavel] = useState(a.responsavel)
  useAvisoAoSair(nome !== a.nome || responsavel !== a.responsavel)
  const feito = a.status === 'concluído'

  return (
    <li className={`rounded-lg px-3 py-2 grid gap-2 md:grid-cols-[auto_minmax(0,1fr)_11rem_9.5rem_auto] md:items-start ${feito ? 'bg-emerald-50' : 'bg-slate-50'}`}>
      <button
        onClick={() => aoMudar({ ...a, status: feito ? 'a iniciar' : 'concluído' })}
        className="inline-flex w-28 items-center justify-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-slate-800 ring-1 ring-black/5"
        style={{ backgroundColor: feito ? '#6ee7b7' : '#fde68a' }}
        aria-pressed={feito}
        title={feito ? 'Marcar como pendente' : 'Marcar como feito'}
      >
        {feito ? '✓ Feito' : 'Pendente'}
      </button>
      <div className="min-w-0">
        <textarea
          value={nome}
          onChange={ev => setNome(ev.target.value)}
          onBlur={() => (nome.trim() && nome !== a.nome ? aoMudar({ ...a, nome: nome.trim() }) : setNome(a.nome))}
          rows={Math.max(1, Math.ceil(nome.length / 95))}
          className={`w-full resize-none rounded-md border border-transparent bg-transparent px-1 text-sm hover:border-slate-200 focus:border-slate-300 focus:bg-white focus:outline-none ${
            feito ? 'text-slate-500 line-through' : 'text-slate-800'
          }`}
          aria-label="Encaminhamento"
        />
        {a.observacoes && <p className="px-1 text-xs text-slate-500">{a.observacoes}</p>}
      </div>
      <input
        value={responsavel}
        onChange={ev => setResponsavel(ev.target.value)}
        onBlur={() => responsavel !== a.responsavel && aoMudar({ ...a, responsavel: responsavel.trim() })}
        placeholder="Responsável"
        className={campo}
        aria-label="Responsável"
      />
      <input type="date" value={a.prazo} onChange={ev => aoMudar({ ...a, prazo: ev.target.value })} className={campo} aria-label="Prazo" />
      <button className="text-xs text-slate-400 hover:text-red-600 justify-self-end mt-1.5" onClick={() => confirm('Excluir este encaminhamento?') && aoExcluir()} aria-label="Excluir encaminhamento">
        ✕
      </button>
    </li>
  )
}

function Resumo({ acoes }: { acoes: AcaoDoPlano[] }) {
  if (!acoes.length) return null
  const contagem = STATUS_PLANO.map(s => [s, acoes.filter(a => a.status === s).length] as const).filter(([, n]) => n > 0)
  return (
    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
      <span>{acoes.length} {acoes.length === 1 ? 'ação' : 'ações'}:</span>
      {contagem.map(([s, n]) => (
        <span key={s} className="rounded-full px-2 py-0.5 text-xs font-semibold text-slate-800" style={{ backgroundColor: COR_STATUS_PLANO[s] }}>
          {n} {s}
        </span>
      ))}
    </div>
  )
}

// Objetivo da frente, editável no próprio quadro.
function Objetivo({ valor, aoMudar }: { valor: string; aoMudar: (v: string) => void }) {
  const [texto, setTexto] = useState(valor)
  useAvisoAoSair(texto !== valor)
  return (
    <div className="rounded-lg bg-marca-claro border-l-4 border-l-marca-marinho px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-marca-marinho">Objetivo</p>
      <textarea
        value={texto}
        onChange={ev => setTexto(ev.target.value)}
        onBlur={() => texto.trim() !== valor && aoMudar(texto.trim())}
        rows={Math.max(1, Math.ceil(texto.length / 120))}
        placeholder="Qual é o objetivo desta frente?"
        className="w-full resize-none rounded-md border border-transparent bg-transparent px-1 -mx-1 text-sm font-medium text-slate-800 hover:border-slate-300 focus:border-slate-300 focus:bg-white focus:outline-none"
        aria-label="Objetivo"
      />
    </div>
  )
}

function CartaoAcao({
  numero,
  acao: a,
  aoMudar,
  aoExcluir,
}: {
  numero: number
  acao: AcaoDoPlano
  aoMudar: (a: AcaoDoPlano) => void
  aoExcluir: () => void
}) {
  const [nome, setNome] = useState(a.nome)
  const [responsavel, setResponsavel] = useState(a.responsavel)
  const [observacoes, setObservacoes] = useState(a.observacoes)
  useAvisoAoSair(nome !== a.nome || responsavel !== a.responsavel || observacoes !== a.observacoes)

  return (
    <section className="rounded-xl border border-slate-200 border-l-4 bg-white p-4 space-y-3" style={{ borderLeftColor: COR_STATUS_PLANO[a.status] }}>
      <div className="flex items-start gap-3">
        <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-marca-marinho text-xs font-bold text-white">{numero}</span>
        <input
          value={nome}
          onChange={ev => setNome(ev.target.value)}
          onBlur={() => (nome.trim() && nome !== a.nome ? aoMudar({ ...a, nome: nome.trim() }) : setNome(a.nome))}
          className="flex-1 min-w-0 rounded-md border border-transparent px-1 -mx-1 text-base font-semibold text-slate-800 hover:border-slate-200 focus:border-slate-300 focus:outline-none"
          aria-label="Nome da ação"
        />
        <button className="text-xs text-slate-400 hover:text-red-600" onClick={() => confirm(`Excluir a ação “${a.nome}”?`) && aoExcluir()}>
          Excluir
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <label className="text-xs font-semibold text-slate-500 space-y-1">
          <span>Status</span>
          <select
            value={a.status}
            onChange={ev => aoMudar({ ...a, status: ev.target.value as StatusPlano })}
            className={`${campo} w-full font-semibold`}
            style={{ backgroundColor: COR_STATUS_PLANO[a.status] }}
          >
            {STATUS_PLANO.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-500 space-y-1">
          <span>Responsável</span>
          <input
            value={responsavel}
            onChange={ev => setResponsavel(ev.target.value)}
            onBlur={() => responsavel !== a.responsavel && aoMudar({ ...a, responsavel: responsavel.trim() })}
            placeholder="Quem cuida da ação"
            className={`${campo} w-full font-normal`}
          />
        </label>
        <label className="text-xs font-semibold text-slate-500 space-y-1">
          <span>Prazo</span>
          <input type="date" value={a.prazo} onChange={ev => aoMudar({ ...a, prazo: ev.target.value })} className={`${campo} w-full font-normal`} />
        </label>
      </div>

      <label className="block text-xs font-semibold text-slate-500 space-y-1">
        <span>Observações</span>
        <textarea
          value={observacoes}
          onChange={ev => setObservacoes(ev.target.value)}
          onBlur={() => observacoes !== a.observacoes && aoMudar({ ...a, observacoes: observacoes.trim() })}
          rows={2}
          placeholder="Público, canais, mensagens…"
          className={`${campo} w-full font-normal`}
        />
      </label>

      <Entregas entregas={a.entregas} aoMudar={entregas => aoMudar({ ...a, entregas })} />
    </section>
  )
}

function Entregas({ entregas, aoMudar }: { entregas: EntregaDoPlano[]; aoMudar: (e: EntregaDoPlano[]) => void }) {
  const [nova, setNova] = useState('')
  useAvisoAoSair(!!nova.trim())
  const mudar = (e: EntregaDoPlano) => aoMudar(entregas.map(x => (x.id === e.id ? e : x)))
  const criar = () => {
    if (!nova.trim()) return
    aoMudar([...entregas, novaEntrega(nova.trim())])
    setNova('')
  }
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Entregas</p>
      <ul className="space-y-2">
        {entregas.map(e => (
          <LinhaEntrega key={e.id} entrega={e} aoMudar={mudar} aoExcluir={() => aoMudar(entregas.filter(x => x.id !== e.id))} />
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={nova}
          onChange={ev => setNova(ev.target.value)}
          onKeyDown={ev => ev.key === 'Enter' && criar()}
          placeholder="Nova entrega"
          className={`${campo} flex-1 min-w-[14rem]`}
          aria-label="Nova entrega"
        />
        <button className="text-sm font-semibold text-marca-marinho hover:underline disabled:opacity-50" onClick={criar} disabled={!nova.trim()}>
          + Entrega
        </button>
      </div>
    </div>
  )
}

function LinhaEntrega({ entrega: e, aoMudar, aoExcluir }: { entrega: EntregaDoPlano; aoMudar: (e: EntregaDoPlano) => void; aoExcluir: () => void }) {
  const [nome, setNome] = useState(e.nome)
  useAvisoAoSair(nome !== e.nome)
  return (
    <li className="rounded-lg bg-slate-50 px-3 py-2 grid gap-2 md:grid-cols-[minmax(0,1fr)_10rem_10rem_auto] md:items-center">
      <input
        value={nome}
        onChange={ev => setNome(ev.target.value)}
        onBlur={() => (nome.trim() && nome !== e.nome ? aoMudar({ ...e, nome: nome.trim() }) : setNome(e.nome))}
        className="min-w-0 rounded-md border border-transparent bg-transparent px-1 text-sm font-semibold text-slate-800 hover:border-slate-200 focus:border-slate-300 focus:bg-white focus:outline-none"
        aria-label="Nome da entrega"
      />
      <select
        value={e.status}
        onChange={ev => aoMudar({ ...e, status: ev.target.value as StatusPlano })}
        className={`${campo} font-semibold`}
        style={{ backgroundColor: COR_STATUS_PLANO[e.status] }}
        aria-label="Status da entrega"
      >
        {STATUS_PLANO.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      <input type="date" value={e.prazo} onChange={ev => aoMudar({ ...e, prazo: ev.target.value })} className={campo} aria-label="Prazo da entrega" />
      <button className="text-xs text-slate-400 hover:text-red-600 justify-self-end" onClick={() => confirm(`Excluir a entrega “${e.nome}”?`) && aoExcluir()} aria-label="Excluir entrega">
        ✕
      </button>
    </li>
  )
}

function NovaAcao({ aoCriar, item = 'ação' }: { aoCriar: (nome: string) => void; item?: string }) {
  const [nome, setNome] = useState('')
  useAvisoAoSair(!!nome.trim())
  const criar = () => {
    if (!nome.trim()) return
    aoCriar(nome.trim())
    setNome('')
  }
  return (
    <div className="rounded-xl border border-dashed border-slate-300 p-4 flex flex-wrap items-center gap-2">
      <input
        value={nome}
        onChange={ev => setNome(ev.target.value)}
        onKeyDown={ev => ev.key === 'Enter' && criar()}
        placeholder={item === 'ação' ? 'Nova ação' : `Novo ${item}`}
        className={`${campo} flex-1 min-w-[16rem]`}
        aria-label="Nova ação"
      />
      <button className={botaoForte} onClick={criar} disabled={!nome.trim()}>Adicionar {item}</button>
    </div>
  )
}
