// Cliente da API da Monday (GraphQL). Roda só no servidor: o token vem do .env.local e
// nunca chega ao navegador. As páginas consomem os dados pelas rotas em src/app/api/.

const API_URL = 'https://api.monday.com/v2'
const API_VERSION = '2024-10'

// Quadro do Calendário Detalhado 2026: fonte única das páginas da semana (decisão de 26/10/2026).
export const CALENDARIO_ID = 18408464040
// Quadro Avaliações_GAV (privado): fonte da aba Escritório de Projetos (pedido de 30/10/2026).
export const AVALIACOES_GAV_ID = 9794510912
// Quadro CREDENCIAMENTO IA NO MEC: fonte da aba de mesmo nome na área restrita (pedido de 06/11/2026).
export const CREDENCIAMENTO_MEC_ID = 18438794720
// Quadro AVALIAÇÃO CP: substitui os tópicos de Coordenação Pedagógica da aba Avaliações (pedido de 06/11/2026).
export const AVALIACAO_CP_ID = 18438800278
// Quadro AVALIAÇÃO SE: substitui os tópicos Diagnóstica SE 2025 e 2026 da aba Avaliações (pedido de 06/11/2026).
export const AVALIACAO_SE_ID = 18438800563
// Quadro COMUNICAÇÃO INSTITUCIONAL: fonte da aba de mesmo nome na área restrita (pedido de 06/11/2026).
export const COMUNICACAO_INSTITUCIONAL_ID = 18438799406
// Quadro COMUNICAÇÃO EDUCAÇÃO BÁSICA: subaba Educação Básica do Plano de Comunicação (pedido de 06/11/2026).
export const COMUNICACAO_EDUCACAO_BASICA_ID = 18435637348
// Quadro EIXO ADVOCACY + POLICY PAPERS: fonte da aba Advocacy + Policy Papers (pedido de 06/11/2026).
export const ADVOCACY_POLICY_PAPERS_ID = 18438799739
// Quadro CURSOS DE EXTENSÃO, GM E ENTREGÁVEIS COM SEDUC: aba de mesmo nome (pedido de 06/11/2026).
export const EXTENSAO_GM_SEDUC_ID = 18412003478
// Quadro CURSOS DE EXTENSÃO, PLANO DE AÇÃO REGULARES E MEC: aba de mesmo nome (pedido de 06/11/2026).
export const EXTENSAO_REGULARES_MEC_ID = 18395777346

// Quadros analisados pelo painel. Preencher com os IDs (número na URL do quadro).
export const QUADROS: { id: number; nome: string }[] = [
  { id: CALENDARIO_ID, nome: 'Calendário Detalhado 2026' },
  { id: AVALIACOES_GAV_ID, nome: 'Avaliações_GAV' },
  { id: CREDENCIAMENTO_MEC_ID, nome: 'CREDENCIAMENTO IA NO MEC' },
  { id: AVALIACAO_CP_ID, nome: 'AVALIAÇÃO CP' },
  { id: AVALIACAO_SE_ID, nome: 'AVALIAÇÃO SE' },
  { id: COMUNICACAO_INSTITUCIONAL_ID, nome: 'COMUNICAÇÃO INSTITUCIONAL' },
  { id: COMUNICACAO_EDUCACAO_BASICA_ID, nome: 'COMUNICAÇÃO EDUCAÇÃO BÁSICA' },
  { id: ADVOCACY_POLICY_PAPERS_ID, nome: 'EIXO ADVOCACY + POLICY PAPERS' },
  { id: EXTENSAO_GM_SEDUC_ID, nome: 'CURSOS DE EXTENSÃO, GM E ENTREGÁVEIS COM SEDUC' },
  { id: EXTENSAO_REGULARES_MEC_ID, nome: 'CURSOS DE EXTENSÃO, PLANO DE AÇÃO REGULARES E MEC' },
]

export interface ValorColuna {
  id: string
  titulo: string
  tipo: string
  texto: string | null
}

// Comentário (update) deixado na linha do quadro.
export interface ComentarioMonday {
  autor: string
  data: string // ISO
  texto: string
}

export interface Subelemento {
  id: string
  nome: string
  colunas: ValorColuna[]
  comentarios?: ComentarioMonday[] // só com buscarQuadro(id, { comentarios: true })
}

export interface Elemento {
  id: string
  nome: string
  grupo: string
  colunas: ValorColuna[]
  subelementos: Subelemento[]
  comentarios?: ComentarioMonday[]
}

export interface DadosQuadro {
  id: number
  nome: string
  elementos: Elemento[]
}

export async function consultar<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const token = process.env.MONDAY_API_TOKEN
  if (!token) throw new Error('MONDAY_API_TOKEN não definido no .env.local')
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: token, 'API-Version': API_VERSION },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  })
  const j = await res.json()
  if (j.errors || j.error_message) throw new Error(JSON.stringify(j.errors ?? j.error_message))
  return j.data as T
}

interface CVBruto { id: string; text: string | null; type: string; column: { title: string } }
interface UpdateBruto { text_body: string; created_at: string; creator: { name: string } | null }
interface ItemBruto {
  id: string
  name: string
  group: { title: string }
  column_values: CVBruto[]
  updates?: UpdateBruto[]
  subitems: { id: string; name: string; column_values: CVBruto[]; updates?: UpdateBruto[] }[]
}

const CAMPOS_CV = 'id text type column { title }'
const CAMPOS_UPDATE = 'updates(limit: 20) { text_body created_at creator { name } }'
const camposItem = (comentarios: boolean) => {
  const u = comentarios ? CAMPOS_UPDATE : ''
  return `id name group { title } column_values { ${CAMPOS_CV} } ${u} subitems { id name column_values { ${CAMPOS_CV} } ${u} }`
}

const colunas = (cvs: CVBruto[]): ValorColuna[] =>
  cvs.map(c => ({ id: c.id, titulo: c.column.title, tipo: c.type, texto: c.text?.trim() || null }))

const comentarios = (us: UpdateBruto[] | undefined): ComentarioMonday[] | undefined =>
  us?.map(u => ({ autor: u.creator?.name ?? 'Monday', data: u.created_at, texto: u.text_body.trim() })).filter(c => c.texto)

// Lê todos os elementos (com subelementos) de um quadro, paginando de 200 em 200.
// `comentarios: true` traz também os updates de cada linha (consulta mais pesada).
export async function buscarQuadro(id: number, opcoes: { comentarios?: boolean } = {}): Promise<DadosQuadro> {
  const CAMPOS_ITEM = camposItem(!!opcoes.comentarios)
  type Pagina = { cursor: string | null; items: ItemBruto[] }
  const primeira = await consultar<{ boards: { name: string; items_page: Pagina }[] }>(
    `query($id: [ID!]) { boards(ids: $id) { name items_page(limit: 200) { cursor items { ${CAMPOS_ITEM} } } } }`,
    { id: [id] },
  )
  const quadro = primeira.boards[0]
  if (!quadro) throw new Error(`Quadro ${id} não encontrado ou sem acesso`)
  const itens = [...quadro.items_page.items]
  let cursor = quadro.items_page.cursor
  while (cursor) {
    const prox = await consultar<{ next_items_page: Pagina }>(
      `query($c: String!) { next_items_page(limit: 200, cursor: $c) { cursor items { ${CAMPOS_ITEM} } } }`,
      { c: cursor },
    )
    itens.push(...prox.next_items_page.items)
    cursor = prox.next_items_page.cursor
  }
  return {
    id,
    nome: quadro.name,
    elementos: itens.map(it => ({
      id: it.id,
      nome: it.name,
      grupo: it.group.title,
      colunas: colunas(it.column_values),
      comentarios: comentarios(it.updates),
      subelementos: it.subitems.map(s => ({ id: s.id, nome: s.name, colunas: colunas(s.column_values), comentarios: comentarios(s.updates) })),
    })),
  }
}
