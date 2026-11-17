'use client'

import { useEffect, useState } from 'react'
import { useSemana } from '@/components/semana/ContextoSemana'
import { Vazio } from '@/components/semana/Etiquetas'
import { baixar, gerarXlsx } from '@/lib/xlsx'
import {
  BLOCOS,
  DECISOES,
  ETAPAS,
  FICHA,
  LEITORES,
  POLITICAS,
  STATUS_LEITURA,
  esteiraEmPlanilhas,
  type AndamentoEsteira,
  type AndamentoPolitica,
  type Leitor,
} from '@/lib/esteiraPoliticas'

// Esteira de leitura das 15 políticas e normas (pedido de 17/11/2026), até 23/12/2026: etapas com datas,
// leitura de cada pessoa por política e a decisão da discussão. Regras e lista em src/lib/esteiraPoliticas.ts.

const COR_STATUS = { concluida: '#34d399', andamento: '#facc15', iniciar: '#3b82f6', atraso: '#f87171' }
const COR_LEITURA: Record<string, string> = { 'A ler': '#e5e7eb', Lendo: '#fde68a', Lida: '#93c5fd', 'Ficha pronta': '#6ee7b7' }
const COR_DECISAO: Record<string, string> = { Aplica: '#6ee7b7', Adaptar: '#fde68a', 'Não se aplica': '#e5e7eb' }
const dataBr = (d: string) => d.slice(8, 10) + '/' + d.slice(5, 7)

export default function EsteiraPoliticas() {
  const { hoje } = useSemana()
  const [andamento, setAndamento] = useState<AndamentoEsteira | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string>('')

  useEffect(() => {
    fetch('/api/esteira-politicas')
      .then(r => r.json())
      .then(j => {
        if (j.error) throw new Error(j.error)
        setAndamento(j.andamento)
      })
      .catch(e => setErro(String(e.message ?? e)))
  }, [])

  const salvar = async (novo: AndamentoEsteira) => {
    setAndamento(novo)
    setAviso('Salvando…')
    try {
      const r = await fetch('/api/esteira-politicas', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ andamento: novo }) })
      const j = await r.json()
      if (j.error) throw new Error(j.error)
      setAviso('Salvo')
    } catch (e) {
      setAviso(`Não salvo: ${String((e as Error).message ?? e)}`)
    }
  }

  const mudar = (codigo: string, parte: Partial<AndamentoPolitica>) => andamento && salvar({ ...andamento, [codigo]: { ...andamento[codigo], ...parte } })

  if (erro) return <Vazio texto={erro} />
  if (!andamento) return <Vazio texto="Carregando a esteira…" />

  return (
    <div className="space-y-4">
      <section className="rounded-xl bg-white border border-slate-200 shadow-sm p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-800">Esteira de leitura das políticas e normas · até 23/12</h2>
          <div className="flex items-center gap-3">
            <span className={`text-xs ${aviso.startsWith('Não') ? 'text-red-600' : 'text-slate-500'}`}>{aviso}</span>
            <button
              onClick={() => baixar(gerarXlsx(esteiraEmPlanilhas(andamento)), `Esteira de politicas - ${hoje.split('-').reverse().join('-')}.xlsx`)}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-marca-marinho ring-1 ring-marca-marinho hover:bg-marca-claro"
            >
              Baixar Excel
            </button>
          </div>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          {LEITORES.join(' e ')} leem as {POLITICAS.length} políticas, discutem numa agenda, sistematizam o que se aplica ao Instituto e começam
          a elaborar as políticas internas.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {ETAPAS.map((e, i) => {
            const st = hoje > e.fim ? 'concluida' : hoje >= e.inicio ? 'andamento' : 'iniciar'
            return (
              <div key={e.nome} className="rounded-lg bg-slate-50 p-3 border-l-4" style={{ borderLeftColor: COR_STATUS[st] }}>
                <p className="text-xs text-slate-500">
                  {i + 1}. {e.inicio === e.fim ? dataBr(e.inicio) : `${dataBr(e.inicio)} a ${dataBr(e.fim)}`} ·{' '}
                  {st === 'concluida' ? 'prazo encerrado' : st === 'andamento' ? 'em andamento' : 'a iniciar'}
                </p>
                <p className="text-sm font-semibold text-slate-800">{e.nome}</p>
                <p className="mt-0.5 text-xs text-slate-600">{e.entrega}</p>
              </div>
            )
          })}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {LEITORES.map(l => {
            const prontas = POLITICAS.filter(p => andamento[p.codigo]?.leitura[l] === 'Ficha pronta').length
            const esperadas = POLITICAS.filter(p => BLOCOS[p.bloco].fim < hoje).length
            return (
              <div key={l}>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>
                    <b className="text-slate-800">{l}</b>: {prontas} de {POLITICAS.length} fichas prontas
                  </span>
                  <span>esperado até hoje: {esperadas}</span>
                </div>
                <div className="relative mt-1 h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-marca-azul" style={{ width: `${(prontas / POLITICAS.length) * 100}%` }} />
                  <div className="absolute top-[-3px] h-[14px] w-0.5 bg-slate-500" style={{ left: `${(esperadas / POLITICAS.length) * 100}%` }} title="Esperado até hoje" />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {BLOCOS.map((b, i) => {
        const doBloco = POLITICAS.filter(p => p.bloco === i)
        const vencido = b.fim < hoje
        return (
          <section key={b.rotulo} className="rounded-xl bg-white border border-slate-200 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-slate-800">
              {b.rotulo} · leitura de {dataBr(b.inicio)} a {dataBr(b.fim)} <span className="font-normal text-slate-500">({doBloco.length} políticas)</span>
            </h3>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500">
                    <th className="py-1 pr-2 font-medium">Política</th>
                    {LEITORES.map(l => (
                      <th key={l} className="py-1 pr-2 font-medium w-36">
                        {l}
                      </th>
                    ))}
                    <th className="py-1 pr-2 font-medium w-36">Decisão</th>
                    <th className="py-1 font-medium w-56">Observação</th>
                  </tr>
                </thead>
                <tbody>
                  {doBloco.map(p => {
                    const a = andamento[p.codigo]
                    return (
                      <tr key={p.codigo} className="border-t border-slate-100 align-top">
                        <td className="py-2 pr-2">
                          <p className="text-slate-800">
                            <span className="text-slate-400 tabular-nums">{p.codigo} · </span>
                            {p.nome}
                          </p>
                          <p className="text-xs text-slate-500">{p.tema}</p>
                        </td>
                        {LEITORES.map(l => {
                          const st = a.leitura[l]
                          const atrasada = vencido && st !== 'Ficha pronta'
                          return (
                            <td key={l} className="py-2 pr-2">
                              <select
                                value={st}
                                onChange={e => mudar(p.codigo, { leitura: { ...a.leitura, [l]: e.target.value } as Record<Leitor, typeof st> })}
                                className="w-full rounded-full px-2 py-1 text-xs font-semibold text-slate-800 ring-1 ring-slate-200"
                                style={{ backgroundColor: COR_LEITURA[st] }}
                                aria-label={`Leitura de ${l}`}
                              >
                                {STATUS_LEITURA.map(s => (
                                  <option key={s}>{s}</option>
                                ))}
                              </select>
                              {atrasada && <p className="mt-0.5 text-[11px] font-semibold" style={{ color: '#dc2626' }}>Atrasada</p>}
                            </td>
                          )
                        })}
                        <td className="py-2 pr-2">
                          <select
                            value={a.decisao}
                            onChange={e => mudar(p.codigo, { decisao: e.target.value as AndamentoPolitica['decisao'] })}
                            className="w-full rounded-full px-2 py-1 text-xs font-semibold text-slate-800 ring-1 ring-slate-200"
                            style={{ backgroundColor: COR_DECISAO[a.decisao] ?? '#fff' }}
                            aria-label="Decisão da discussão"
                          >
                            {DECISOES.map(d => (
                              <option key={d} value={d}>
                                {d || 'Após a discussão'}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2">
                          <textarea
                            defaultValue={a.observacao}
                            onBlur={e => e.target.value !== a.observacao && mudar(p.codigo, { observacao: e.target.value })}
                            rows={1}
                            placeholder="Anotação curta"
                            className="w-full resize-y rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700"
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )
      })}

      <details className="rounded-xl bg-white border border-slate-200 shadow-sm p-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-800">Ficha de leitura (uma por pessoa, por política)</summary>
        <ol className="mt-2 list-decimal pl-5 space-y-1 text-sm text-slate-700">
          {FICHA.map(f => (
            <li key={f}>{f}</li>
          ))}
        </ol>
        <p className="mt-2 text-xs text-slate-500">Cada pessoa preenche a própria ficha antes da agenda, sem combinar; as divergências são resolvidas na discussão.</p>
      </details>
    </div>
  )
}
