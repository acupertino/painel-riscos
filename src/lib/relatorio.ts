// Relatório da área restrita (aba experimental, pedido de 06/11/2026): todas as linhas em aberto
// das abas restritas (quadros da Monday, Avaliações e registros feitos à mão), marcando como ponto
// de atenção o que está sem data, precisa de definição ou está com prazo estourado.
// Concluídas e canceladas ficam fora. Só fatos: o relatório não sugere encaminhamentos.

import { categoriaDe, type AcaoGav } from '@/lib/escritorio'
import type { AcaoDoPlano, FrenteDoPlano } from '@/lib/planos'
import type { AcaoQuadro, GrupoQuadro } from '@/lib/quadroRestrito'
import type { Planilha } from '@/lib/xlsx'

// Abas que não entram no relatório: Encaminhamentos de SQUAD é controle próprio da Isa (pedido de 06/11/2026).
export const ABAS_FORA_DO_RELATORIO = ['encaminhamentos-squad']

// Linhas que não entram (com todas as subações): esteiras de produção (pedido de 06/11/2026).
// Vale para o nome da ação e para o nome do grupo, sem diferença de acento ou maiúscula.
// Também as linhas que a Isa pediu para tirar pelo nome (06/11/2026); são subelementos, então a regra
// de elementos (ver ItemBase.elemento) não as alcança.
const FORA_DO_RELATORIO = [
  /esteira de producao/,
  /^conduzir reunioes de abertura de contato$/,
  /^co-construcao da proposta$/,
  /^bases finais tratadas$/,
]
const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
export const ficaForaDoRelatorio = (nome: string) => FORA_DO_RELATORIO.some(r => r.test(semAcento(nome)))

// Status “Previsto para 2027” na Monday: a linha foi adiada de propósito e não entra como pendência
// (pedido da Isa em 06/11/2026). Conta como linha lida, mas não como em aberto.
const ficaParaDepois = (status: string | null) => !!status && /previsto para 2027/i.test(status)

export type Motivo ='Prazo estourado' | 'Precisa de definição' | 'Sem data'

// Ordem fixa = ordem das cores nos gráficos e prioridade do "motivo principal".
export const MOTIVOS: Motivo[] = ['Prazo estourado', 'Precisa de definição', 'Sem data']

// Paleta categórica validada (3 primeiras posições passam em todos os pares, inclusive daltonismo).
export const COR_MOTIVO: Record<Motivo, string> = {
  'Prazo estourado': '#2a78d6',
  'Precisa de definição': '#eb6834',
  'Sem data': '#1baf7a',
}

// Uma linha de qualquer origem, já no formato comum.
interface ItemBase {
  nome: string
  responsavel: string | null
  status: string | null
  fim: string | null // prazo / fim previsto
  fechado: boolean // concluído ou cancelado
  subitens: ItemBase[]
  // Elemento da Monday (linha-mãe que se ramifica em subelementos): não entra na análise de pendências,
  // só os subelementos dele (pedido da Isa em 06/11/2026).
  elemento?: boolean
}

export interface LinhaRelatorio {
  aba: string
  href: string
  grupo: string // grupo do quadro, tópico ou frente
  acao: string | null // ação-mãe, quando a linha é subação ou entrega
  nome: string
  responsavel: string | null
  status: string | null
  fim: string | null
  diasAtraso: number // 0 quando não está vencida
  motivos: Motivo[]
  principal: Motivo | null // primeiro motivo na ordem de MOTIVOS
  detalhes: string[]
}

export interface FonteRelatorio {
  aba: string
  href: string
  grupos: { nome: string; itens: ItemBase[] }[]
}

// ---------- conversão de cada origem ----------

const fechadoPorStatus = (s: string | null) => !!s && /conclu|realizad|cancel/i.test(s)

const deQuadro = (a: AcaoQuadro, elemento = false): ItemBase => ({
  elemento,
  nome: a.nome,
  responsavel: a.responsavel,
  status: a.status,
  fim: a.fimPrevisto,
  fechado: fechadoPorStatus(a.status),
  subitens: a.subacoes.map(s => deQuadro(s)),
})

const deGav = (a: AcaoGav, elemento = false): ItemBase => ({
  elemento,
  nome: a.nome,
  responsavel: a.responsaveis,
  status: a.status,
  fim: a.fimPrevisto,
  fechado: categoriaDe(a.status) === 'concluído' || /cancel/i.test(a.status ?? '') || !!a.fimReal,
  subitens: a.subacoes.map(s => deGav(s)),
})

const dePlano = (a: AcaoDoPlano): ItemBase => ({
  nome: a.nome,
  responsavel: a.responsavel || null,
  status: a.status,
  fim: a.prazo || null,
  fechado: a.status === 'concluído',
  subitens: a.entregas.map(e => ({ nome: e.nome, responsavel: null, status: e.status, fim: e.prazo || null, fechado: e.status === 'concluído', subitens: [] })),
})

export const fonteDeQuadros = (aba: string, href: string, quadros: GrupoQuadro[][]): FonteRelatorio => ({
  aba,
  href,
  grupos: quadros.flat().map(g => ({ nome: g.nome, itens: g.acoes.map(a => deQuadro(a, true)) })),
})

// No Avaliações_GAV as ações são elementos; nos quadros próprios (com `fonte`) elas já são subelementos.
export const fonteDeAvaliacoes = (aba: string, href: string, avaliacoes: { nome: string; acoes: AcaoGav[]; fonte?: string }[]): FonteRelatorio => ({
  aba,
  href,
  grupos: avaliacoes.map(a => ({ nome: a.nome, itens: a.acoes.map(x => deGav(x, !a.fonte)) })),
})

export const fonteDePlano = (aba: string, href: string, frentes: FrenteDoPlano[]): FonteRelatorio => ({
  aba,
  href,
  grupos: frentes.map(f => ({ nome: f.nome, itens: f.acoes.map(dePlano) })),
})

// ---------- critérios ----------

const DIA = 864e5
const dias = (de: string, ate: string) => Math.round((Date.parse(ate) - Date.parse(de)) / DIA)

// Status que dependem de uma decisão ou de algo externo, e nomes de linha que são uma pergunta em aberto.
const STATUS_DEFINICAO = /pendente|aguardando|definir|defini[cç][aã]o|avaliar|parado|suspens/i
const NOME_DEFINICAO = /^(definir|avaliar|confirmar|decidir|validar se|verificar se|entender)\b|\?/i

function classificar(it: ItemBase, hoje: string): { motivos: Motivo[]; detalhes: string[]; diasAtraso: number } {
  const motivos: Motivo[] = []
  const detalhes: string[] = []
  let diasAtraso = 0
  if (it.fim && it.fim < hoje) {
    diasAtraso = dias(it.fim, hoje)
    motivos.push('Prazo estourado')
    detalhes.push(`prazo venceu há ${diasAtraso} ${diasAtraso === 1 ? 'dia' : 'dias'}`)
  } else if (it.status && /atras/i.test(it.status)) {
    motivos.push('Prazo estourado')
    detalhes.push(`status “${it.status.toLowerCase()}”`)
  }
  if (!it.status) {
    motivos.push('Precisa de definição')
    detalhes.push('sem status')
  } else if (STATUS_DEFINICAO.test(it.status)) {
    motivos.push('Precisa de definição')
    detalhes.push(`status “${it.status.toLowerCase()}”`)
  } else if (NOME_DEFINICAO.test(it.nome)) {
    motivos.push('Precisa de definição')
    detalhes.push('a própria ação é uma decisão em aberto')
  }
  if (!it.fim) {
    motivos.push('Sem data')
    detalhes.push('sem prazo previsto')
  }
  return { motivos: MOTIVOS.filter(m => motivos.includes(m)), detalhes, diasAtraso }
}

export interface Relatorio {
  linhas: LinhaRelatorio[] // só as que têm ponto de atenção
  analisadas: number // todas as linhas lidas (inclusive concluídas)
  abertas: number
  porAba: { aba: string; href: string; analisadas: number; abertas: number; comPonto: number; porMotivo: Record<Motivo, number>; maiorAtraso: number }[]
}

export function montarRelatorio(fontes: FonteRelatorio[], hoje: string): Relatorio {
  const linhas: LinhaRelatorio[] = []
  let analisadas = 0
  let abertas = 0
  const porAba: Relatorio['porAba'] = []

  for (const f of fontes) {
    const resumo = { aba: f.aba, href: f.href, analisadas: 0, abertas: 0, comPonto: 0, porMotivo: { 'Prazo estourado': 0, 'Precisa de definição': 0, 'Sem data': 0 }, maiorAtraso: 0 }
    const visitar = (it: ItemBase, grupo: string, acao: string | null) => {
      if (ficaForaDoRelatorio(it.nome)) return
      if (!it.elemento) resumo.analisadas++
      if (!it.elemento && !it.fechado && !ficaParaDepois(it.status)) {
        resumo.abertas++
        const c = classificar(it, hoje)
        if (c.motivos.length) {
          resumo.comPonto++
          resumo.porMotivo[c.motivos[0]]++
          resumo.maiorAtraso = Math.max(resumo.maiorAtraso, c.diasAtraso)
          linhas.push({
            aba: f.aba,
            href: f.href,
            grupo,
            acao,
            nome: it.nome,
            responsavel: it.responsavel,
            status: it.status,
            fim: it.fim,
            diasAtraso: c.diasAtraso,
            motivos: c.motivos,
            principal: c.motivos[0] ?? null,
            detalhes: c.detalhes,
          })
        }
      }
      // Subações de uma ação fechada também contam: podem ter ficado para trás.
      for (const s of it.subitens) visitar(s, grupo, it.nome)
    }
    for (const g of f.grupos) if (!ficaForaDoRelatorio(g.nome)) for (const it of g.itens) visitar(it, g.nome, null)
    analisadas += resumo.analisadas
    abertas += resumo.abertas
    porAba.push(resumo)
  }

  linhas.sort((a, b) => b.diasAtraso - a.diasAtraso || MOTIVOS.indexOf(a.principal!) - MOTIVOS.indexOf(b.principal!) || a.aba.localeCompare(b.aba))
  return { linhas, analisadas, abertas, porAba }
}

// ---------- análises ----------

export const FAIXAS_ATRASO = [
  { rotulo: 'até 7 dias', de: 1, ate: 7 },
  { rotulo: '8 a 30 dias', de: 8, ate: 30 },
  { rotulo: '31 a 90 dias', de: 31, ate: 90 },
  { rotulo: 'mais de 90 dias', de: 91, ate: Infinity },
]

export const porFaixaDeAtraso = (linhas: LinhaRelatorio[]) =>
  FAIXAS_ATRASO.map(f => ({ faixa: f.rotulo, linhas: linhas.filter(l => l.diasAtraso >= f.de && l.diasAtraso <= f.ate).length }))

// Responsável pode vir como "Fulano, Beltrano": a linha conta para cada um.
export const responsaveisDe = (l: LinhaRelatorio) => (l.responsavel ? l.responsavel.split(',').map(r => r.trim()).filter(Boolean) : ['Sem responsável'])

export function porResponsavel(linhas: LinhaRelatorio[], limite = 10) {
  const m = new Map<string, Record<Motivo, number> & { total: number }>()
  for (const l of linhas)
    for (const r of responsaveisDe(l)) {
      const v = m.get(r) ?? { total: 0, 'Prazo estourado': 0, 'Precisa de definição': 0, 'Sem data': 0 }
      v.total++
      v[l.principal!]++
      m.set(r, v)
    }
  return [...m].map(([responsavel, v]) => ({ responsavel, ...v })).sort((a, b) => b.total - a.total).slice(0, limite)
}

const mediana = (xs: number[]) => {
  if (!xs.length) return 0
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2)
}

const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0)

// Leitura rápida para a diretoria: frases curtas só com fatos tirados das linhas.
export function leituraRapida(r: Relatorio): string[] {
  const frases: string[] = []
  const vencidas = r.linhas.filter(l => l.diasAtraso > 0)
  frases.push(`${r.linhas.length} de ${r.abertas} linhas em aberto (${pct(r.linhas.length, r.abertas)}%) têm ao menos um ponto de atenção, em ${r.analisadas} linhas lidas.`)
  if (vencidas.length) {
    const pior = vencidas[0]
    frases.push(
      `${vencidas.length} linhas estão com prazo vencido; metade delas venceu há ${mediana(vencidas.map(l => l.diasAtraso))} dias ou mais. O maior atraso é “${pior.nome}” (${pior.aba}), vencido há ${pior.diasAtraso} dias.`,
    )
    const longas = vencidas.filter(l => l.diasAtraso > 90).length
    if (longas) frases.push(`${longas} linhas venceram há mais de 90 dias e seguem abertas.`)
  }
  const abaAtraso = [...r.porAba].sort((a, b) => b.porMotivo['Prazo estourado'] - a.porMotivo['Prazo estourado'])[0]
  if (abaAtraso?.porMotivo['Prazo estourado'])
    frases.push(`${abaAtraso.aba} concentra mais prazos estourados: ${abaAtraso.porMotivo['Prazo estourado']} (${pct(abaAtraso.porMotivo['Prazo estourado'], abaAtraso.abertas)}% das linhas abertas da aba).`)
  const semData = r.linhas.filter(l => l.motivos.includes('Sem data'))
  if (semData.length) {
    const cont = new Map<string, number>()
    for (const l of semData) cont.set(l.aba, (cont.get(l.aba) ?? 0) + 1)
    const [aba, n] = [...cont].sort((a, b) => b[1] - a[1])[0]
    frases.push(`${semData.length} linhas em aberto não têm prazo; ${n} delas estão em ${aba}.`)
  }
  const definicao = r.linhas.filter(l => l.motivos.includes('Precisa de definição')).length
  if (definicao) frases.push(`${definicao} linhas dependem de definição (sem status, pendentes, aguardando ou formuladas como decisão).`)
  const semResp = r.linhas.filter(l => !l.responsavel).length
  if (semResp) frases.push(`${semResp} linhas com ponto de atenção não têm responsável indicado.`)
  const top = porResponsavel(r.linhas.filter(l => l.responsavel), 1)[0]
  if (top) frases.push(`${top.responsavel} é quem mais acumula pontos de atenção: ${top.total} linhas.`)
  return frases
}

// Planilhas do Excel: as linhas (com os filtros aplicados na tela) e o resumo por aba.
export function relatorioEmPlanilhas(linhas: LinhaRelatorio[], porAba: Relatorio['porAba']): Planilha[] {
  return [
    {
      nome: 'Pontos de atenção',
      colunas: [
        { titulo: 'Aba', largura: 30 },
        { titulo: 'Grupo', largura: 30 },
        { titulo: 'Ação', largura: 40 },
        { titulo: 'Linha', largura: 60 },
        { titulo: 'Responsável', largura: 26 },
        { titulo: 'Status', largura: 22 },
        { titulo: 'Prazo', largura: 12 },
        { titulo: 'Dias de atraso', largura: 10 },
        ...MOTIVOS.map(m => ({ titulo: m, largura: 12 })),
        { titulo: 'Detalhes', largura: 45 },
      ],
      linhas: linhas.map(l => [
        l.aba,
        l.grupo,
        l.acao,
        l.nome,
        l.responsavel,
        l.status,
        l.fim ? { data: l.fim } : null,
        l.diasAtraso || null,
        ...MOTIVOS.map(m => (l.motivos.includes(m) ? 'Sim' : null)),
        l.detalhes.join('; '),
      ]),
    },
    {
      nome: 'Resumo por aba',
      colunas: [
        { titulo: 'Aba', largura: 45 },
        { titulo: 'Em aberto', largura: 11 },
        { titulo: 'Com ponto de atenção', largura: 12 },
        { titulo: '% com ponto', largura: 10 },
        ...MOTIVOS.map(m => ({ titulo: `${m} (motivo principal)`, largura: 16 })),
        { titulo: 'Maior atraso (dias)', largura: 12 },
      ],
      linhas: [...porAba]
        .sort((a, b) => b.comPonto - a.comPonto)
        .map(a => [a.aba, a.abertas, a.comPonto, pct(a.comPonto, a.abertas), ...MOTIVOS.map(m => a.porMotivo[m]), a.maiorAtraso || null]),
    },
  ]
}

// ---------- Resumo (aba de gráficos, pedido de 09/11/2026) ----------
// Mesmo universo do Relatório (sem esteiras de produção, sem "Previsto para 2027" e sem Encaminhamentos
// de SQUAD), olhando o andamento do ano. Conta subelementos e também elementos sem subelementos (nos
// quadros sem subelementos, como Credenciamento, a ação é o próprio elemento); linha-mãe não conta.
//
// - do ano: linhas com prazo previsto entre 01/01 e 31/12 do ano corrente (canceladas ficam fora);
// - previstas até hoje: as do ano cujo prazo já chegou (deveriam estar concluídas);
// - realizadas: as do ano já concluídas (no prazo ou não, e também as adiantadas).
// Linhas sem prazo não entram na conta e são mostradas à parte.

export interface AndamentoAba {
  aba: string
  href: string
  doAno: number
  previstas: number
  realizadas: number
  atrasadas: number // previstas até hoje e ainda não concluídas
  semPrazo: number
}

export interface Andamento extends Omit<AndamentoAba, 'aba' | 'href'> {
  ano: string
  porAba: AndamentoAba[]
}

const cancelada = (status: string | null) => !!status && /cancel/i.test(status)
// "Plano X (à mão)" soma na mesma aba que "Plano X" (as duas partes apontam para a mesma página).
const nomeDaAba = (aba: string) => aba.replace(/ \(à mão\)$/, '')

export function montarAndamento(fontes: FonteRelatorio[], hoje: string): Andamento {
  const ano = hoje.slice(0, 4)
  const inicio = `${ano}-01-01`
  const fim = `${ano}-12-31`
  const abas = new Map<string, AndamentoAba>()
  for (const f of fontes) {
    const nome = nomeDaAba(f.aba)
    const r = abas.get(nome) ?? { aba: nome, href: f.href, doAno: 0, previstas: 0, realizadas: 0, atrasadas: 0, semPrazo: 0 }
    abas.set(nome, r)
    const visitar = (it: ItemBase) => {
      if (ficaForaDoRelatorio(it.nome)) return
      const conta = !it.elemento || !it.subitens.length
      if (conta && !ficaParaDepois(it.status) && !cancelada(it.status)) {
        if (!it.fim) r.semPrazo++
        else if (it.fim >= inicio && it.fim <= fim) {
          r.doAno++
          if (it.fim <= hoje) r.previstas++
          if (it.fim <= hoje && !it.fechado) r.atrasadas++
          if (it.fechado) r.realizadas++
        }
      }
      for (const s of it.subitens) visitar(s)
    }
    for (const g of f.grupos) if (!ficaForaDoRelatorio(g.nome)) for (const it of g.itens) visitar(it)
  }
  const porAba = [...abas.values()]
  const soma = (k: 'doAno' | 'previstas' | 'realizadas' | 'atrasadas' | 'semPrazo') => porAba.reduce((n, a) => n + a[k], 0)
  return { ano, doAno: soma('doAno'), previstas: soma('previstas'), realizadas: soma('realizadas'), atrasadas: soma('atrasadas'), semPrazo: soma('semPrazo'), porAba }
}

export const percentual = (parte: number, total: number) => (total ? Math.round((parte / total) * 100) : 0)
