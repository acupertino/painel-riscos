// Ações do Calendário Detalhado 2026 já normalizadas: cluster (assunto), etapa do fluxo,
// curso/módulo/UC e datas. As regras de cluster e etapa são inferidas dos nomes usados no
// quadro em 26/10/2026 (o quadro não tem coluna de dependência nem de cluster).

import type { Elemento } from '@/lib/monday'

export interface Acao {
  id: string
  nome: string
  grupo: string
  modulo: string // M1, M2, M3 ou Ext
  oferta: string // como na Monday, ex.: "BA - CP - Assíncrono"
  curso: string // forma curta, ex.: "CP-BA"
  uc: string // UC1, UC2… ou o texto original (ex.: "2 Oferta")
  area: string // ÁREA RESPONSÁVEL, ex.: "GFOR" ou "CURSISTA/GDE"
  tipo: string // TIPO DE ATIVIDADE
  cluster: Cluster
  etapa: Etapa
  inicio: string | null // AAAA-MM-DD (previsto)
  termino: string | null
  status: string | null // STATUS DO PROCESSO
  observacoes: string | null
  repactuacao: string | null
}

export type Cluster =
  | 'Recuperação extraordinária'
  | 'Recuperação tardios'
  | 'Reoferta'
  | 'TCC'
  | 'Recuperação'
  | 'Nanocertificação'
  | 'Aprovação final'
  | 'Frequência'
  | 'Oferta regular'
  | 'Material das eletivas'
  | 'Configuração de TN'
  | 'Painéis'
  | 'Encontros e lives'
  | 'Pesquisa de satisfação'
  | 'Plantões'
  | 'Extensão'
  | 'Pausado'
  | 'Outros'

// Cor da borda dos cards de cada cluster (paleta de categorias do guia).
export const CLUSTER_COR: Record<Cluster, string> = {
  'Recuperação extraordinária': '#f43f5e',
  'Recuperação tardios': '#fb923c',
  Reoferta: '#f59e0b',
  TCC: '#8b5cf6',
  Recuperação: '#f87171',
  Nanocertificação: '#c084fc',
  'Aprovação final': '#10b981',
  Frequência: '#60a5fa',
  'Oferta regular': '#3b82f6',
  'Material das eletivas': '#34d399',
  'Configuração de TN': '#64748b',
  Painéis: '#f472b6',
  'Encontros e lives': '#4ade80',
  'Pesquisa de satisfação': '#facc15',
  Plantões: '#94a3b8',
  Extensão: '#0ea5e9',
  Pausado: '#d1d5db',
  Outros: '#d1d5db',
}

const CLUSTER_POR_TIPO: Record<string, Cluster> = {
  'Recuperação Extraordinária': 'Recuperação extraordinária',
  'Recuperação Tardios': 'Recuperação tardios',
  Reoferta: 'Reoferta',
  TCC: 'TCC',
  Recuperação: 'Recuperação',
  Nanocertificação: 'Nanocertificação',
  'Aprovação final': 'Aprovação final',
  Frequência: 'Frequência',
  'Oferta Regular': 'Oferta regular',
  'Entrega de Material': 'Material das eletivas',
  TN: 'Configuração de TN',
  Painel: 'Painéis',
  Encontro: 'Encontros e lives',
  'Pesquisa de Satisfação': 'Pesquisa de satisfação',
  Plantão: 'Plantões',
  Pausado: 'Pausado',
}

const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// "Rec Ext", "REC EXTRA", "rec. extraordinária", "extraordinária" e a UC "Rec Extra, UC4" contam
// como recuperação extraordinária, mesmo quando o tipo de atividade é outro (ex.: nanocertificação).
const REGEX_REC_EXT = /rec\.?\s*ext|recuperacao\s+extra|extraordinari/

export function clusterDe(nome: string, tipo: string, uc: string, grupo: string): Cluster {
  const n = semAcento(`${nome} ${uc}`)
  if (tipo === 'Plantão') return 'Plantões'
  if (tipo === 'Pausado') return 'Pausado'
  if (/extensao/.test(semAcento(grupo))) return 'Extensão'
  if (tipo === 'Recuperação Extraordinária' || REGEX_REC_EXT.test(n)) return 'Recuperação extraordinária'
  if (tipo === 'Recuperação Tardios' || /tardio/.test(n)) return 'Recuperação tardios'
  if (tipo === 'TCC' || /\btcc\b/.test(n)) return 'TCC'
  if (tipo === 'Reoferta' || /reoferta/.test(n)) return 'Reoferta'
  return CLUSTER_POR_TIPO[tipo] ?? 'Outros'
}

// Etapas do fluxo de cada UC, na ordem em que acontecem.
export type Etapa =
  | 'preparação'
  | 'liberação'
  | 'aulas'
  | 'entrega'
  | 'correção'
  | 'validação'
  | 'frequência'
  | 'tratamento'
  | 'divulgação'
  | 'comunicação'
  | 'nanocertificação'
  | 'outra'

export function etapaDe(nome: string): Etapa {
  const n = semAcento(nome)
  if (/frequencia/.test(n)) return 'frequência'
  if (/nanocertifica/.test(n)) return 'nanocertificação'
  if (/tratamento/.test(n)) return 'tratamento'
  if (/validacao da correcao/.test(n)) return 'validação'
  if (/correcao/.test(n)) return 'correção'
  if (/divulgacao|homologacao/.test(n)) return 'divulgação'
  if (/comunica/.test(n)) return 'comunicação'
  if (/liberacao da uc|liberacao do modulo/.test(n)) return 'liberação'
  if (/envio de material|envio da atividade|configuracao de tn|liberacao, vinculacao|entrega material/.test(n)) return 'preparação'
  if (/entrega/.test(n)) return 'entrega'
  if (/aulas|encontro|live|mentoria/.test(n)) return 'aulas'
  return 'outra'
}

// Encurta "BA - CP - Assíncrono" → "CP-BA", "MG - SE - MOODLE" → "SE-MG", "Regular - Síncrono" → "Regular".
export function cursoCurto(oferta: string): string {
  const partes = oferta.split(' - ').map(p => p.trim())
  if (partes[0] === 'Regular') return 'Regular'
  if (/^[A-Z]{2}$/.test(partes[0]) && partes[1]) return `${partes[1]}-${partes[0]}`
  return partes[0] || 'Sem curso'
}

function moduloDe(grupo: string): string {
  const m = grupo.match(/M[ÓO]DULO\s+(\d)/i)
  if (m) return `M${m[1]}`
  return /extens/i.test(grupo) ? 'Ext' : grupo
}

function ucDe(uc: string): string {
  return uc.match(/UC\s*\d+/i)?.[0].replace(/\s/g, '').toUpperCase() ?? uc
}

const valor = (e: Elemento, titulo: string) => e.colunas.find(c => c.titulo === titulo)?.texto ?? null

export function normalizarAcao(e: Elemento): Acao {
  const tipo = valor(e, 'TIPO DE ATIVIDADE') ?? ''
  const ucOriginal = valor(e, 'UC') ?? ''
  const oferta = valor(e, 'TIPO DE OFERTA/TERRITÓRIO') ?? ''
  return {
    id: e.id,
    nome: e.nome.trim(),
    grupo: e.grupo,
    modulo: moduloDe(e.grupo),
    oferta,
    curso: cursoCurto(oferta),
    uc: ucDe(ucOriginal),
    area: valor(e, 'ÁREA RESPONSÁVEL') ?? 'Sem área',
    tipo,
    cluster: clusterDe(e.nome, tipo, ucOriginal, e.grupo),
    etapa: etapaDe(e.nome),
    inicio: valor(e, 'INÍCIO PREVISTO'),
    termino: valor(e, 'TÉRMINO PREVISTO') ?? valor(e, 'INÍCIO PREVISTO'),
    status: valor(e, 'STATUS DO PROCESSO'),
    observacoes: valor(e, 'Observações'),
    repactuacao: valor(e, 'Status e Registro de repactuação (data original e motivo de repactuação)'),
  }
}

// Rótulo do curso com módulo e UC, ex.: "CP-BA (M2·UC1)".
export const rotuloCurso = (a: Acao) => {
  const detalhe = [a.modulo, a.uc].filter(x => x && x !== 'N/A').join('·')
  return detalhe ? `${a.curso} (${detalhe})` : a.curso
}

// Cores das áreas (guia de estrutura); áreas compostas usam a cor da primeira.
const AREA_CORES: Record<string, string> = {
  GDA: '#60a5fa',
  GFOR: '#fb923c',
  GIPE: '#34d399',
  GIMP: '#facc15',
  GEOP: '#c084fc',
  CPE: '#4ade80',
  GDE: '#f472b6',
}
export const corDaArea = (area: string) => AREA_CORES[area.split('/')[0].trim()] ?? '#cbd5e1'

export const estaConcluida = (a: Acao) => !!a.status && /^CONCLU/i.test(a.status)
