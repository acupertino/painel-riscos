// Físico do físico-financeiro (pedido de 10/11/2026): ações de todos os quadros conectados, separadas por
// programa e rubrica, com a evolução mês a mês do esperado (prazo) e do realizado (fim real).
//
// Programa: pelas siglas e nomes, procurando primeiro no nome da linha, depois na ação-mãe, no grupo e nas
// colunas Programa / TIPO DE OFERTA / Público. EDUFIN ou "Educação Financeira" → Educação Financeira;
// SE ou "Socioemocional" → Educação Socioemocional; CP, VDP, DE, "Coordenação Pedagógica" ou "Diretor" →
// Coordenadores Pedagógicos e Diretores. As siglas só valem em maiúsculas ("de" e "se" são palavras comuns) e o
// DE só quando vem separado por traço, barra, colchete ou parêntese ("BA - DE - Assíncrono", "DE/GE"), para não
// pegar o "DE" de títulos em maiúsculas ("DATA DE INÍCIO"). Uma linha pode entrar em mais de um programa.
//
// Rubrica: coluna RUBRICA (ou Rubrica / Texto, no quadro de GM e SEDUC) da própria linha; sem ela, a do
// elemento-mãe. Linhas sem rubrica aparecem à parte, para a Isa relacionar.
//
// Quase o mesmo universo do Resumo: contam subelementos e elementos sem subelementos; ficam de fora canceladas,
// "Previsto para 2027" (as esteiras de produção entram, como Conteúdo). No Avaliações_GAV só os marcos (Marco = Sim), sem os tópicos que
// têm quadro próprio (AVALIAÇÃO CP e SE) e sem Policy papers (está no quadro de Advocacy).

import { ficaForaDoRelatorio } from '@/lib/relatorio'

// As esteiras de produção ficam fora do Relatório e do Resumo, mas aqui entram: são a rubrica Conteúdo (pedido
// de 10/11/2026). As outras exclusões do Relatório continuam valendo.
const ficaFora = (nome: string) => ficaForaDoRelatorio(nome) && !/esteira de produ/i.test(nome.normalize('NFD').replace(/[̀-ͯ]/g, ''))
import { ultimaData } from '@/lib/quadroRestrito'
import type { Celula, Planilha } from '@/lib/xlsx'

export const PROGRAMAS = ['Educação Financeira', 'Educação Socioemocional', 'Coordenadores Pedagógicos e Diretores'] as const
export type Programa = (typeof PROGRAMAS)[number]

// Formação e Implementação são uma rubrica só (Isa, 10/11/2026): nos quadros só aparece "IMPLEMENTAÇÃO".
// Eixo Público (Isa, 10/11/2026): policy papers e Advocacy de Socioemocional, como no financeiro.
export const RUBRICAS = ['Articulação', 'Avaliação', 'Conteúdo', 'Eixo Público', 'Formação e Implementação'] as const
export type Rubrica = (typeof RUBRICAS)[number]

export interface LinhaBruta {
  quadro: string
  grupo: string
  mae: string | null
  nome: string
  temSubelementos: boolean
  colunas: Record<string, string>
}

export interface AcaoFisica {
  quadro: string
  grupo: string
  mae: string | null
  nome: string
  programas: Programa[]
  rubrica: Rubrica | null
  status: string | null
  fimPrevisto: string | null
  fimReal: string | null
  concluida: boolean
}

const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

const SIGLAS: [Programa, RegExp][] = [
  ['Educação Financeira', /EDUFIN|Edufin|edufin|[Ee]duca[cç][aã]o [Ff]inanceira/],
  ['Educação Socioemocional', /\bSE\b|[Ss]ocioemocional|SOCIOEMOCIONAL/],
  ['Coordenadores Pedagógicos e Diretores', /\bCP\b|\bVDP\b|(^|[\s[(/–-])DE(?=\s*[-–/)\]]|$)|[Cc]oordena[cç][aã]o [Pp]edag|[Dd]iretor/],
]

export const programasDoTexto = (t: string | null | undefined): Programa[] => (t ? SIGLAS.filter(([, re]) => re.test(t)).map(([p]) => p) : [])

const COLUNAS_PROGRAMA = ['Programa', 'TIPO DE OFERTA/TERRITÓRIO', 'Público']

export function rubricaDoTexto(t: string | null | undefined): Rubrica | null {
  if (!t) return null
  const s = semAcento(t)
  if (/^(formac|implementac)/.test(s)) return 'Formação e Implementação'
  return RUBRICAS.find(r => s.startsWith(semAcento(r).slice(0, 6))) ?? null
}

const rubricaDaLinha = (c: Record<string, string>) => rubricaDoTexto(c['RUBRICA'] ?? c['Rubrica']) ?? rubricaDoTexto(c['Texto'])
const status = (c: Record<string, string>) => c['STATUS'] ?? c['Status'] ?? c['STATUS DO PROCESSO'] ?? null
const fimPrevisto = (c: Record<string, string>) => ultimaData(c['Fim projetado'] ?? c['Fim previsto'] ?? c['TÉRMINO PREVISTO'] ?? null)
const fimReal = (c: Record<string, string>) => ultimaData(c['Fim real'] ?? c['TÉRMINO REAL'] ?? null)

const GAV = 'Avaliações_GAV'
const GRUPOS_GAV_FORA = ['impacto coordenacao pedagogica', 'coordenacao pedagogica quali', 'diagnostica se 2026', 'diagnostica se 2025', 'policy papers']

// Relações da Isa (10/11/2026):
// - quadros sem coluna RUBRICA: Calendário Detalhado = Formação e Implementação; Avaliações_GAV = Avaliação;
// - ficam de fora os quadros de Comunicação e o Credenciamento IA no MEC (não são dos três programas);
// - no Calendário, ficam de fora as ofertas EDUAMB, Operação Resgate e Regular - Síncrono, e a oferta
//   BA - GM (Gestores Municipais) entra em Educação Socioemocional.
const RUBRICA_DO_QUADRO: Record<string, Rubrica> = { 'Calendário Detalhado 2026': 'Formação e Implementação', [GAV]: 'Avaliação' }
const QUADROS_FORA = ['COMUNICAÇÃO INSTITUCIONAL', 'COMUNICAÇÃO EDUCAÇÃO BÁSICA', 'CREDENCIAMENTO IA NO MEC']
const OFERTA = 'TIPO DE OFERTA/TERRITÓRIO'
const OFERTA_FORA = /EDUAMB|OPERA[CÇ][AÃ]O RESGATE|^REGULAR\s*-\s*S[IÍ]NCRONO/i
const OFERTA_SE = /^BA\s*-\s*GM\b/i

// Linhas sem sigla de programa, relacionadas pela Isa (10/11/2026). Só valem para linhas que não acharam
// programa pelas siglas. `fora: true` tira a linha da conta.
const ADVOCACY = 'EIXO ADVOCACY + POLICY PAPERS'
const RELACOES: { quadro: string; grupo?: string; programa?: Programa; rubrica?: Rubrica; fora?: boolean }[] = [
  { quadro: GAV, grupo: 'PdM SP', programa: 'Educação Financeira' },
  { quadro: 'CURSOS DE EXTENSÃO, GM E ENTREGÁVEIS COM SEDUC', fora: true },
  { quadro: ADVOCACY, programa: 'Educação Socioemocional' },
]
// Em Socioemocional, tudo o que vem do quadro de Advocacy (policy paper SE, Papo de Cabeça, ENAP...) é Eixo Público.
const eixoPublico = (quadro: string, programas: Programa[]) => quadro === ADVOCACY && programas.includes('Educação Socioemocional')
const relacaoDe = (l: LinhaBruta) => RELACOES.find(r => r.quadro === l.quadro && (!r.grupo || semAcento(r.grupo) === semAcento(l.grupo)))

export function acoesFisicas(linhas: LinhaBruta[]): AcaoFisica[] {
  const chave = (quadro: string, grupo: string, nome: string) => `${quadro}|${grupo}|${nome}`
  const maes = new Map(linhas.filter(l => !l.mae).map(l => [chave(l.quadro, l.grupo, l.nome), l]))
  const acoes: AcaoFisica[] = []
  for (const l of linhas) {
    const mae = l.mae ? maes.get(chave(l.quadro, l.grupo, l.mae)) : undefined
    if (l.temSubelementos) continue // linha-mãe: contam os subelementos
    if (QUADROS_FORA.includes(l.quadro)) continue
    const oferta = l.colunas[OFERTA] ?? mae?.colunas[OFERTA] ?? ''
    if (OFERTA_FORA.test(oferta)) continue
    if (l.quadro === GAV) {
      if (GRUPOS_GAV_FORA.includes(semAcento(l.grupo))) continue
      if (((mae ?? l).colunas['Marco'] ?? '') !== 'Sim') continue
    }
    if (ficaFora(l.nome) || (l.mae && ficaFora(l.mae)) || ficaFora(l.grupo)) continue
    const st = status(l.colunas)
    if (st && /cancel|previsto para 2027/i.test(st)) continue
    const fontes = [l.nome, l.mae, l.grupo, COLUNAS_PROGRAMA.map(c => l.colunas[c] ?? mae?.colunas[c]).filter(Boolean).join(' · ')]
    let programas: Programa[] = OFERTA_SE.test(oferta) ? ['Educação Socioemocional'] : (fontes.map(programasDoTexto).find(p => p.length) ?? [])
    const relacao = programas.length ? undefined : relacaoDe(l)
    if (relacao?.fora) continue
    if (relacao?.programa) programas = [relacao.programa]
    acoes.push({
      quadro: l.quadro,
      grupo: l.grupo,
      mae: l.mae,
      nome: l.nome,
      programas,
      rubrica: eixoPublico(l.quadro, programas) ? 'Eixo Público' : relacao?.rubrica ?? rubricaDaLinha(l.colunas) ?? (mae ? rubricaDaLinha(mae.colunas) : null) ?? RUBRICA_DO_QUADRO[l.quadro] ?? null,
      status: st,
      fimPrevisto: fimPrevisto(l.colunas),
      fimReal: fimReal(l.colunas),
      concluida: !!st && /conclu|realizad/i.test(st),
    })
  }
  return acoes
}

// ---------- Evolução mês a mês ----------

export interface MesFisico {
  esperadas: number // ações com prazo no mês
  realizadas: number // ações concluídas no mês (fim real; sem fim real, o mês do prazo)
}

export interface EvolucaoFisica {
  total: number // ações com prazo no ano
  meses: MesFisico[]
  previstasAteHoje: number
  realizadasAteHoje: number
}

export function evolucao(acoes: AcaoFisica[], ano: string, hoje: string): EvolucaoFisica {
  const meses = Array.from({ length: 12 }, () => ({ esperadas: 0, realizadas: 0 }))
  let total = 0
  let previstasAteHoje = 0
  let realizadasAteHoje = 0
  for (const a of acoes) {
    if (!a.fimPrevisto?.startsWith(ano)) continue
    total++
    meses[Number(a.fimPrevisto.slice(5, 7)) - 1].esperadas++
    if (a.fimPrevisto <= hoje) previstasAteHoje++
    if (!a.concluida) continue
    realizadasAteHoje++
    // Fim real; sem ele (ou com fim real no futuro), o prazo, mas nunca depois de hoje.
    const quando = a.fimReal && a.fimReal <= hoje ? a.fimReal : a.fimPrevisto < hoje ? a.fimPrevisto : hoje
    const mes = quando < `${ano}-01-01` ? 0 : quando > `${ano}-12-31` ? 11 : Number(quando.slice(5, 7)) - 1
    meses[mes].realizadas++
  }
  return { total, meses, previstasAteHoje, realizadasAteHoje }
}

// ---------- Financeiro ----------

// Marco da execução financeira: % executado até `data`, por programa e por rubrica (pode trazer rubricas que
// não existem no físico, como "Eixo Público"). Vem de dados/financeiro.json, fora do git.
export interface MarcoFinanceiro {
  data: string // AAAA-MM-DD
  fonte?: string
  // justificativas: texto da Isa explicando a variação físico x financeiro, por rubrica (pedido de 10/11/2026).
  programas: Partial<Record<Programa, { total: number; rubricas: Record<string, number>; justificativas?: Record<string, string> }>>
}

// Físico acumulado até uma data, em % das ações com prazo no ano (mesma base do gráfico acumulado).
export function fisicoAte(acoes: AcaoFisica[], ano: string, data: string, hoje: string) {
  const e = evolucao(acoes, ano, hoje)
  const ate = Math.min(Number(data.slice(5, 7)), 12)
  const soma = (k: keyof MesFisico) => e.meses.slice(0, ate).reduce((n, m) => n + m[k], 0)
  const pct = (n: number) => (e.total ? Math.round((n / e.total) * 100) : 0)
  return { total: e.total, esperado: pct(soma('esperadas')), realizado: pct(soma('realizadas')) }
}

// ---------- Download em Excel (pedido de 10/11/2026) ----------

const MESES_LONGOS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const pctDe = (parte: number, total: number) => (total ? Math.round((parte / total) * 100) : 0)

export function fisicoEmPlanilhas(acoes: AcaoFisica[], ano: string, hoje: string, marco: MarcoFinanceiro | null): Planilha[] {
  const mesMarco = marco ? `${MESES_LONGOS[Number(marco.data.slice(5, 7)) - 1].toLowerCase()}/${marco.data.slice(0, 4)}` : ''
  const colunasMarco = marco
    ? [
        { titulo: `Físico esperado até ${mesMarco} (%)`, largura: 16 },
        { titulo: `Físico realizado até ${mesMarco} (%)`, largura: 16 },
        { titulo: `Financeiro executado até ${mesMarco} (%)`, largura: 18 },
      ]
    : []
  const linha = (lista: AcaoFisica[], fin: number | undefined): Celula[] => {
    const e = evolucao(lista, ano, hoje)
    const m = marco ? fisicoAte(lista, ano, marco.data, hoje) : null
    return [
      e.total,
      e.previstasAteHoje,
      e.realizadasAteHoje,
      pctDe(e.previstasAteHoje, e.total),
      pctDe(e.realizadasAteHoje, e.total),
      ...(marco ? [m!.esperado, m!.realizado, fin ?? null] : []),
    ]
  }
  const base = [
    { titulo: `Ações com prazo em ${ano}`, largura: 14 },
    { titulo: 'Esperadas até hoje', largura: 12 },
    { titulo: 'Realizadas', largura: 12 },
    { titulo: '% esperado até hoje', largura: 12 },
    { titulo: '% realizado', largura: 12 },
  ]
  const doPrograma = (p: Programa) => acoes.filter(a => a.programas.includes(p))
  const rubricasDe = (p: Programa) => {
    const fisicas = RUBRICAS.filter(r => doPrograma(p).some(a => a.rubrica === r && a.fimPrevisto?.startsWith(ano)))
    const so = Object.keys(marco?.programas[p]?.rubricas ?? {}).filter(r => !(fisicas as string[]).includes(r))
    return [...fisicas, ...so]
  }

  const mesAMes: Celula[][] = []
  for (const p of PROGRAMAS)
    for (const r of ['Todas as rubricas', ...rubricasDe(p)]) {
      const lista = r === 'Todas as rubricas' ? doPrograma(p) : doPrograma(p).filter(a => a.rubrica === r)
      const e = evolucao(lista, ano, hoje)
      if (!e.total) continue
      let esp = 0
      let real = 0
      e.meses.forEach((m, i) => {
        esp += m.esperadas
        real += m.realizadas
        const passou = `${ano}-${String(i + 1).padStart(2, '0')}` <= hoje.slice(0, 7)
        mesAMes.push([p, r, `${MESES_LONGOS[i]}/${ano}`, m.esperadas, m.realizadas, pctDe(esp, e.total), passou ? pctDe(real, e.total) : null])
      })
    }

  return [
    {
      nome: 'Programas',
      colunas: [{ titulo: 'Programa', largura: 36 }, ...base, ...colunasMarco],
      linhas: PROGRAMAS.map(p => [p, ...linha(doPrograma(p), marco?.programas[p]?.total)]),
    },
    {
      nome: 'Por rubrica',
      colunas: [{ titulo: 'Programa', largura: 36 }, { titulo: 'Rubrica', largura: 26 }, ...base, ...colunasMarco, ...(marco ? [{ titulo: 'Justificativa da variação', largura: 70 }] : [])],
      linhas: PROGRAMAS.flatMap(p =>
        rubricasDe(p).map(r => [
          p,
          r,
          ...linha(doPrograma(p).filter(a => a.rubrica === r), marco?.programas[p]?.rubricas[r]),
          ...(marco ? [marco.programas[p]?.justificativas?.[r] ?? null] : []),
        ]),
      ),
    },
    {
      nome: 'Mês a mês',
      colunas: [
        { titulo: 'Programa', largura: 36 },
        { titulo: 'Rubrica', largura: 26 },
        { titulo: 'Mês', largura: 16 },
        { titulo: 'Esperadas no mês', largura: 12 },
        { titulo: 'Realizadas no mês', largura: 12 },
        { titulo: 'Esperado acumulado (%)', largura: 14 },
        { titulo: 'Realizado acumulado (%)', largura: 14 },
      ],
      linhas: mesAMes,
    },
    {
      nome: 'Ações',
      colunas: [
        { titulo: 'Programa', largura: 36 },
        { titulo: 'Rubrica', largura: 24 },
        { titulo: 'Quadro', largura: 34 },
        { titulo: 'Grupo', largura: 34 },
        { titulo: 'Ação-mãe', largura: 40 },
        { titulo: 'Ação', largura: 50 },
        { titulo: 'Prazo', largura: 12 },
        { titulo: 'Fim real', largura: 12 },
        { titulo: 'Status', largura: 20 },
      ],
      linhas: acoes
        .filter(a => a.programas.length)
        .flatMap(a =>
          a.programas.map(p => [p, a.rubrica, a.quadro, a.grupo, a.mae, a.nome, a.fimPrevisto ? { data: a.fimPrevisto } : null, a.fimReal ? { data: a.fimReal } : null, a.status] as Celula[]),
        ),
    },
  ]
}
