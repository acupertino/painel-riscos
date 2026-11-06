'use client'

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useSemana } from '@/components/semana/ContextoSemana'
import { Vazio } from '@/components/semana/Etiquetas'
import BarraMonday from '@/components/restrito/BarraMonday'
import { RESTRITO } from '@/components/navegacao'
import { PLANOS } from '@/lib/planos'
import type { AvaliacaoGav } from '@/lib/escritorio'
import { comoErro, lerJson, lerPlano } from '@/lib/fontesRestritas'
import { dataCurta } from '@/lib/semana'
import { baixar, gerarXlsx } from '@/lib/xlsx'
import {
  ABAS_FORA_DO_RELATORIO,
  COR_MOTIVO,
  MOTIVOS,
  fonteDeAvaliacoes,
  fonteDePlano,
  fonteDeQuadros,
  montarRelatorio,
  relatorioEmPlanilhas,
  responsaveisDe,
  type FonteRelatorio,
  type LinhaRelatorio,
  type Motivo,
} from '@/lib/relatorio'

// Relatório (experimental): todos os pontos de atenção das abas restritas, com análises para a
// diretoria. Mostra só a lista de linhas com ponto de atenção (pedido de 06/11/2026). Critério: sem data, precisa de definição ou prazo estourado (regras em src/lib/relatorio.ts).

export default function Relatorio() {
  const { hoje } = useSemana()
  const [fontes, setFontes] = useState<FonteRelatorio[] | null>(null)
  const [erros, setErros] = useState<string[]>([])
  const [carregando, setCarregando] = useState(true)
  const [geradoEm, setGeradoEm] = useState<string | null>(null)

  const buscar = useCallback(async (atualizar: boolean) => {
    setCarregando(true)
    const falhas: string[] = []
    const avaliacoes = lerJson<{ avaliacoes: AvaliacaoGav[] }>(`/api/escritorio${atualizar ? '?refresh=1' : ''}`).then(
      j => [fonteDeAvaliacoes('Avaliações', `${RESTRITO}/avaliacoes`, j.avaliacoes)],
      e => (falhas.push(`Avaliações: ${comoErro(e)}`), []),
    )
    const planos = PLANOS.filter(p => !ABAS_FORA_DO_RELATORIO.includes(p.slug)).map(p =>
      lerPlano(p, atualizar).then(
        f => {
          const href = `${RESTRITO}/${p.slug}`
          return [
            ...(f.quadros.length ? [fonteDeQuadros(p.titulo, href, f.quadros)] : []),
            ...(f.manual.length ? [fonteDePlano(f.quadros.length ? `${p.titulo} (à mão)` : p.titulo, href, f.manual)] : []),
          ]
        },
        e => (falhas.push(`${p.titulo}: ${comoErro(e)}`), []),
      ),
    )
    const todas = (await Promise.all([avaliacoes, ...planos])).flat()
    setFontes(todas)
    setErros(falhas)
    setGeradoEm(new Date().toISOString())
    setCarregando(false)
  }, [])

  useEffect(() => {
    buscar(false)
  }, [buscar])

  const relatorio = useMemo(() => (fontes ? montarRelatorio(fontes, hoje) : null), [fontes, hoje])

  return (
    <div className="space-y-4">
      <BarraMonday
        quadros="todas as abas da área restrita"
        geradoEm={geradoEm}
        carregando={carregando}
        erro={erros.length ? erros.join(' · ') : null}
        aoAtualizar={() => buscar(true)}
      />
      <p className="text-xs text-slate-500">
        Aba experimental. Ponto de atenção = linha em aberto (nem concluída nem cancelada) que está <b>sem data</b>, <b>precisa de definição</b> (sem status,
        pendente, aguardando ou formulada como decisão) ou com <b>prazo estourado</b> (prazo vencido ou status de atraso). Da Monday entram só os subelementos; os elementos
        (linhas-mãe) aparecem apenas como referência na coluna da ação. Ficam de fora os Encaminhamentos de SQUAD e tudo o que for esteira de produção.
      </p>

      {!relatorio ? (
        <Vazio texto="Lendo todas as abas…" />
      ) : (
        <TabelaLinhas linhas={relatorio.linhas} porAba={relatorio.porAba} />
      )}
    </div>
  )
}

type Rel = ReturnType<typeof montarRelatorio>

const Cartao = ({ titulo, subtitulo, children, direita }: { titulo: string; subtitulo?: string; children: ReactNode; direita?: ReactNode }) => (
  <section className="rounded-xl bg-white border border-slate-200 shadow-sm p-4">
    <header className="flex flex-wrap items-start gap-2">
      <div>
        <h2 className="text-base font-semibold text-slate-800">{titulo}</h2>
        {subtitulo && <p className="text-xs text-slate-500">{subtitulo}</p>}
      </div>
      {direita && <div className="ml-auto">{direita}</div>}
    </header>
    <div className="mt-3">{children}</div>
  </section>
)

const POR_PAGINA = 60
const campo = 'rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm'

function TabelaLinhas({ linhas, porAba }: { linhas: LinhaRelatorio[]; porAba: Rel['porAba'] }) {
  const [aba, setAba] = useState('')
  const [responsavel, setResponsavel] = useState('')
  const [motivos, setMotivos] = useState<Motivo[]>([])
  const [busca, setBusca] = useState('')
  const [limite, setLimite] = useState(POR_PAGINA)

  const abas = useMemo(() => [...new Set(linhas.map(l => l.aba))].sort((a, b) => a.localeCompare(b, 'pt-BR')), [linhas])
  const responsaveis = useMemo(() => [...new Set(linhas.flatMap(responsaveisDe))].sort((a, b) => a.localeCompare(b, 'pt-BR')), [linhas])
  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    return linhas.filter(
      l =>
        (!aba || l.aba === aba) &&
        (!responsavel || responsaveisDe(l).includes(responsavel)) &&
        (!motivos.length || motivos.some(m => l.motivos.includes(m))) &&
        (!termo || [l.nome, l.acao, l.grupo].some(x => x?.toLowerCase().includes(termo))),
    )
  }, [linhas, aba, responsavel, motivos, busca])

  const exportar = () =>
    baixar(gerarXlsx(relatorioEmPlanilhas(filtradas, porAba)), `Relatório pontos de atenção - ${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.xlsx`)

  return (
    <Cartao
      titulo={`Todas as linhas com ponto de atenção (${filtradas.length})`}
      subtitulo="Ordenadas pelo maior atraso. Filtros combinam entre si."
      direita={
        <button onClick={exportar} className="inline-flex items-center rounded-full px-3 py-1.5 text-sm font-semibold text-marca-marinho ring-1 ring-slate-200 bg-white hover:bg-marca-claro">
          Exportar para Excel
        </button>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <select value={aba} onChange={e => (setAba(e.target.value), setLimite(POR_PAGINA))} className={campo} aria-label="Aba">
          <option value="">Todas as abas</option>
          {abas.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={responsavel} onChange={e => (setResponsavel(e.target.value), setLimite(POR_PAGINA))} className={campo} aria-label="Responsável">
          <option value="">Todos os responsáveis</option>
          {responsaveis.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        {MOTIVOS.map(m => {
          const ativo = motivos.includes(m)
          return (
            <button
              key={m}
              onClick={() => (setMotivos(ativo ? motivos.filter(x => x !== m) : [...motivos, m]), setLimite(POR_PAGINA))}
              aria-pressed={ativo}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ring-1 ${ativo ? 'bg-marca-claro text-marca-marinho ring-marca-marinho' : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'}`}
            >
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COR_MOTIVO[m] }} />
              {m}
            </button>
          )
        })}
        <input value={busca} onChange={e => (setBusca(e.target.value), setLimite(POR_PAGINA))} placeholder="Buscar ação…" className={`${campo} flex-1 min-w-[12rem]`} aria-label="Buscar" />
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
              <th className="py-2 pr-3 font-semibold">Linha</th>
              <th className="py-2 px-2 font-semibold">Aba / grupo</th>
              <th className="py-2 px-2 font-semibold">Responsável</th>
              <th className="py-2 px-2 font-semibold">Status</th>
              <th className="py-2 px-2 font-semibold text-right">Prazo</th>
              <th className="py-2 pl-2 font-semibold">Motivos</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.slice(0, limite).map((l, i) => (
              <tr key={i} className="border-b border-slate-100 last:border-0 align-top">
                <td className="py-2 pr-3 max-w-md">
                  <p className="text-slate-800">{l.nome}</p>
                  {l.acao && <p className="text-xs text-slate-500">de: {l.acao}</p>}
                </td>
                <td className="py-2 px-2 text-xs text-slate-600">
                  <Link href={l.href} className="font-semibold text-slate-700 hover:text-marca-marinho hover:underline">{l.aba}</Link>
                  <p>{l.grupo}</p>
                </td>
                <td className="py-2 px-2 text-xs text-slate-600">{l.responsavel ?? <span className="italic text-slate-400">sem responsável</span>}</td>
                <td className="py-2 px-2 text-xs text-slate-600">{l.status ?? <span className="italic text-slate-400">sem status</span>}</td>
                <td className="py-2 px-2 text-right text-xs tabular-nums whitespace-nowrap">
                  {l.fim ? dataCurta(l.fim) + (l.fim.slice(0, 4) !== new Date().getFullYear().toString() ? `/${l.fim.slice(2, 4)}` : '') : '–'}
                  {l.diasAtraso > 0 && <p className="font-semibold text-slate-800">{l.diasAtraso} dias</p>}
                </td>
                <td className="py-2 pl-2">
                  <div className="flex flex-wrap gap-1">
                    {l.motivos.map(m => (
                      <span key={m} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 whitespace-nowrap">
                        <span className="inline-block h-2 w-2 rounded-sm" style={{ backgroundColor: COR_MOTIVO[m] }} />
                        {m}
                      </span>
                    ))}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">{l.detalhes.join(' · ')}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtradas.length > limite && (
        <button onClick={() => setLimite(limite + POR_PAGINA)} className="mt-3 text-sm font-semibold text-marca-marinho hover:underline">
          Mostrar mais {Math.min(POR_PAGINA, filtradas.length - limite)} de {filtradas.length - limite} restantes
        </button>
      )}
      {!filtradas.length && <p className="mt-3 text-sm text-slate-500">Nenhuma linha com esses filtros.</p>}
    </Cartao>
  )
}
