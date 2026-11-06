// Abas da área restrita ligadas a um quadro da Monday (Credenciamento IA no MEC desde 06/11/2026).
// Os quadros seguem o mesmo modelo: RESPONSÁVEL, STATUS, Inicio/Fim projetado, Inicio/Fim real e
// subelementos. Os comentários (updates) das linhas viram pontos de atenção da aba.

import type { ComentarioMonday, Elemento, Subelemento } from '@/lib/monday'

export interface AcaoQuadro {
  id: string
  nome: string
  responsavel: string | null
  status: string | null
  inicioPrevisto: string | null // AAAA-MM-DD
  fimPrevisto: string | null
  inicioReal: string | null
  fimReal: string | null
  subacoes: AcaoQuadro[]
  extras: { titulo: string; texto: string }[] // colunas de texto do quadro (ex.: Público, Canal, Mensagem-chave)
}

export interface GrupoQuadro {
  nome: string
  acoes: AcaoQuadro[]
}

export interface PontoDeAtencao extends ComentarioMonday {
  acao: string // linha do quadro onde está o comentário
}

export interface DadosQuadroRestrito {
  geradoEm: string
  quadro: string
  grupos: GrupoQuadro[]
  pontos: PontoDeAtencao[] // mais recentes primeiro
}

// Títulos de coluna comparados sem acento e sem diferença de maiúsculas ("Início previsto" = "INICIO PREVISTO").
const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
export const valorColuna = (e: Elemento | Subelemento, ...titulos: string[]) => {
  const alvos = titulos.map(normalizar)
  return e.colunas.find(c => alvos.includes(normalizar(c.titulo)))?.texto ?? null
}
const valor = valorColuna
// Colunas de data ou de cronograma ("2026-07-29 - 2026-10-16"): início pega a 1ª data e fim a última.
export const primeiraData = (t: string | null) => t?.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? null
export const ultimaData = (t: string | null) => t?.match(/\d{4}-\d{2}-\d{2}/g)?.at(-1) ?? null

function acaoDe(e: Elemento | Subelemento): AcaoQuadro {
  return {
    id: e.id,
    nome: e.nome.trim(),
    responsavel: valor(e, 'Responsável', 'Responsáveis'),
    status: valor(e, 'Status'),
    inicioPrevisto: primeiraData(valor(e, 'Inicio projetado', 'Início previsto')),
    fimPrevisto: ultimaData(valor(e, 'Fim projetado', 'Fim previsto')),
    inicioReal: primeiraData(valor(e, 'Inicio real')),
    fimReal: ultimaData(valor(e, 'Fim real')),
    subacoes: 'subelementos' in e ? e.subelementos.map(acaoDe) : [],
    extras: e.colunas
      .filter(c => TIPOS_EXTRAS.includes(c.tipo) && c.texto && !COLUNAS_SEM_EXTRA.includes(normalizar(c.titulo)))
      .map(c => ({ titulo: c.titulo, texto: c.texto! })),
  }
}

// Colunas de texto livre mostradas em cada ação; rubrica e área ficam de fora (repetem em todas as linhas).
const TIPOS_EXTRAS = ['text', 'long_text', 'dropdown']
const COLUNAS_SEM_EXTRA = ['rubrica', 'area']

// Só comentários recentes viram ponto de atenção; os antigos já foram tratados (pedido de 06/11/2026).
export const DIAS_PONTOS_DE_ATENCAO = 30

export function pontosRecentes(pontos: PontoDeAtencao[]): PontoDeAtencao[] {
  const corte = new Date(Date.now() - DIAS_PONTOS_DE_ATENCAO * 864e5).toISOString()
  return pontos.filter(p => p.data >= corte).sort((a, b) => b.data.localeCompare(a.data))
}

export function montarQuadroRestrito(nomeQuadro: string, elementos: Elemento[]): Omit<DadosQuadroRestrito, 'geradoEm'> {
  const grupos = new Map<string, AcaoQuadro[]>()
  const pontos: PontoDeAtencao[] = []
  for (const e of elementos) {
    grupos.set(e.grupo, [...(grupos.get(e.grupo) ?? []), acaoDe(e)])
    for (const c of e.comentarios ?? []) pontos.push({ ...c, acao: e.nome.trim() })
    for (const s of e.subelementos) for (const c of s.comentarios ?? []) pontos.push({ ...c, acao: `${e.nome.trim()} › ${s.nome.trim()}` })
  }
  return {
    quadro: nomeQuadro,
    grupos: [...grupos].map(([nome, acoes]) => ({ nome, acoes })),
    pontos: pontosRecentes(pontos),
  }
}

// Situação da ação a partir do status da Monday (os quadros usam "CONCLUÍDO NO PRAZO",
// "ENTREGA ATRASADA", "A INICIAR", "PENDENTE", "CANCELADO", "AGUARDANDO PERÍODO ELEITORAL" etc.).
export const estaConcluidaQuadro = (a: AcaoQuadro) => !!a.status && /conclu|realizad/i.test(a.status)
export const estaCanceladaQuadro = (a: AcaoQuadro) => !!a.status && /cancel/i.test(a.status)
export const estaAbertaQuadro = (a: AcaoQuadro) => !estaConcluidaQuadro(a) && !estaCanceladaQuadro(a)
export const estaVencidaQuadro = (a: AcaoQuadro, hoje: string) => estaAbertaQuadro(a) && !!a.fimPrevisto && a.fimPrevisto < hoje

export function corDoStatus(status: string | null): string {
  if (!status) return '#e5e7eb'
  if (/conclu|realizad/i.test(status)) return '#6ee7b7'
  if (/atras/i.test(status)) return '#fca5a5'
  if (/andamento/i.test(status)) return '#fde68a'
  if (/iniciar/i.test(status)) return '#93c5fd'
  return '#cbd5e1' // pendente, aguardando, cancelado
}
