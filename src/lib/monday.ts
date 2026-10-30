// Cliente da API da Monday (GraphQL). Roda só no servidor: o token vem do .env.local e
// nunca chega ao navegador. As páginas consomem os dados pelas rotas em src/app/api/.

const API_URL = 'https://api.monday.com/v2'
const API_VERSION = '2024-10'

// Quadro do Calendário Detalhado 2026: fonte única das páginas da semana (decisão de 26/10/2026).
export const CALENDARIO_ID = 18408464040
// Quadro Avaliações_GAV (privado): fonte da aba Escritório de Projetos (pedido de 30/10/2026).
export const AVALIACOES_GAV_ID = 9794510912

// Quadros analisados pelo painel. Preencher com os IDs (número na URL do quadro).
export const QUADROS: { id: number; nome: string }[] = [
  { id: CALENDARIO_ID, nome: 'Calendário Detalhado 2026' },
  { id: AVALIACOES_GAV_ID, nome: 'Avaliações_GAV' },
]

export interface ValorColuna {
  id: string
  titulo: string
  tipo: string
  texto: string | null
}

export interface Subelemento {
  id: string
  nome: string
  colunas: ValorColuna[]
}

export interface Elemento {
  id: string
  nome: string
  grupo: string
  colunas: ValorColuna[]
  subelementos: Subelemento[]
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
interface ItemBruto {
  id: string
  name: string
  group: { title: string }
  column_values: CVBruto[]
  subitems: { id: string; name: string; column_values: CVBruto[] }[]
}

const CAMPOS_CV = 'id text type column { title }'
const CAMPOS_ITEM = `id name group { title } column_values { ${CAMPOS_CV} } subitems { id name column_values { ${CAMPOS_CV} } }`

const colunas = (cvs: CVBruto[]): ValorColuna[] =>
  cvs.map(c => ({ id: c.id, titulo: c.column.title, tipo: c.type, texto: c.text?.trim() || null }))

// Lê todos os elementos (com subelementos) de um quadro, paginando de 200 em 200.
export async function buscarQuadro(id: number): Promise<DadosQuadro> {
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
      subelementos: it.subitems.map(s => ({ id: s.id, nome: s.name, colunas: colunas(s.column_values) })),
    })),
  }
}
