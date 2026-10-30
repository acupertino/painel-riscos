// Escritório de Projetos: visualização de mesmo nome do quadro Avaliações_GAV na Monday.
// A visualização filtra os elementos com "Marco = Sim" (filtro lido pela API em 30/10/2026);
// cada grupo do quadro é uma avaliação e os subelementos aparecem dentro de cada ação.
// Os riscos da semana são registrados à mão no app (dados/riscos-escritorio.json).

import type { Elemento, Subelemento } from '@/lib/monday'
import type { NivelAlerta } from '@/lib/semana'

export interface AcaoGav {
  id: string
  nome: string
  responsaveis: string | null
  status: string | null
  inicioPrevisto: string | null // AAAA-MM-DD
  fimPrevisto: string | null
  fimReal: string | null
  subacoes: AcaoGav[]
}

export interface AvaliacaoGav {
  nome: string // grupo do quadro
  acoes: AcaoGav[]
}

export interface RiscoSemana {
  id: string
  semana: string // segunda-feira da semana
  descricao: string
  avaliacao: string // nome da avaliação ou "Geral"
  nivel: Exclude<NivelAlerta, 'ok'>
  responsavel: string
}

const valor = (e: Elemento | Subelemento, titulo: string) => e.colunas.find(c => c.titulo === titulo)?.texto ?? null

// Colunas de cronograma vêm como "2026-07-29 - 2026-10-16": início pega a 1ª data e fim a última.
const primeiraData = (t: string | null) => t?.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? null
const ultimaData = (t: string | null) => t?.match(/\d{4}-\d{2}-\d{2}/g)?.at(-1) ?? null

function acaoDe(e: Elemento | Subelemento, subacoes: AcaoGav[] = []): AcaoGav {
  return {
    id: e.id,
    nome: e.nome.trim(),
    responsaveis: valor(e, 'Responsáveis'),
    status: valor(e, 'Status'),
    inicioPrevisto: primeiraData(valor(e, 'Início previsto')),
    fimPrevisto: ultimaData(valor(e, 'Fim previsto')),
    fimReal: ultimaData(valor(e, 'Fim real')),
    subacoes,
  }
}

// Avaliações na ordem em que aparecem no quadro, só com os elementos marcados como marco.
export function avaliacoesDoEscritorio(elementos: Elemento[]): AvaliacaoGav[] {
  const grupos = new Map<string, AcaoGav[]>()
  for (const e of elementos) {
    if (valor(e, 'Marco') !== 'Sim') continue
    const lista = grupos.get(e.grupo) ?? []
    lista.push(acaoDe(e, e.subelementos.map(s => acaoDe(s))))
    grupos.set(e.grupo, lista)
  }
  return [...grupos].map(([nome, acoes]) => ({ nome, acoes }))
}

// Os dois níveis de status do quadro (elementos e subelementos) nas categorias de cor do app.
export type CategoriaStatus = 'concluído' | 'em andamento' | 'em atraso' | 'a iniciar' | 'outros' | 'sem status'

export const COR_CATEGORIA: Record<CategoriaStatus, string> = {
  concluído: '#34d399',
  'em andamento': '#facc15',
  'em atraso': '#f87171',
  'a iniciar': '#3b82f6',
  outros: '#94a3b8',
  'sem status': '#d1d5db',
}

export function categoriaDe(status: string | null): CategoriaStatus {
  if (!status) return 'sem status'
  if (/realizad|conclu/i.test(status)) return 'concluído'
  if (/atras/i.test(status)) return 'em atraso'
  if (/iniciar/i.test(status)) return 'a iniciar'
  if (/andamento|desenvolvimento|negocia|assinatura/i.test(status)) return 'em andamento'
  return 'outros' // parado, suspenso, cancelada
}

// Prazo previsto já passou, sem conclusão nem fim real registrado.
export const estaVencidaGav = (a: AcaoGav, hoje: string) =>
  !!a.fimPrevisto && a.fimPrevisto < hoje && !a.fimReal && !['concluído', 'outros'].includes(categoriaDe(a.status))

export function riscosEmTexto(riscos: RiscoSemana[], periodo: string): string {
  const linhas = [`Riscos da semana (${periodo}) · Avaliações`, '']
  riscos.forEach((r, i) => {
    const extra = [r.avaliacao, r.responsavel && `responsável: ${r.responsavel}`].filter(Boolean).join(' · ')
    linhas.push(`${i + 1}. [${r.nivel}] ${r.descricao}${extra ? ` (${extra})` : ''}`)
  })
  return linhas.join('\n')
}
