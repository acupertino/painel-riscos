// Planos da área restrita (Plano de Comunicação, Credenciamento IA no MEC etc.): cada plano tem
// uma ou mais frentes (subabas), e cada frente tem objetivo, ações e entregas. Não vem da Monday:
// é registrado no próprio app e salvo em dados/plano-{slug}.json (fora do git).
// Plano de Comunicação pedido em 03/11/2026; demais planos e área restrita em 03/11/2026.

import { novoId } from '@/lib/comex'
import {
  ADVOCACY_POLICY_PAPERS_ID,
  COMUNICACAO_EDUCACAO_BASICA_ID,
  COMUNICACAO_INSTITUCIONAL_ID,
  CREDENCIAMENTO_MEC_ID,
  EXTENSAO_GM_SEDUC_ID,
  EXTENSAO_REGULARES_MEC_ID,
} from '@/lib/monday'

export type StatusPlano = 'a iniciar' | 'em andamento' | 'em atraso' | 'concluído'

export const STATUS_PLANO: StatusPlano[] = ['a iniciar', 'em andamento', 'em atraso', 'concluído']

// Versões suaves das cores de status do app.
export const COR_STATUS_PLANO: Record<StatusPlano, string> = {
  'a iniciar': '#93c5fd',
  'em andamento': '#fde68a',
  'em atraso': '#fca5a5',
  concluído: '#6ee7b7',
}

export interface EntregaDoPlano {
  id: string
  nome: string
  status: StatusPlano
  prazo: string // AAAA-MM-DD ou vazio
}

export interface AcaoDoPlano {
  id: string
  nome: string
  status: StatusPlano
  responsavel: string
  prazo: string // AAAA-MM-DD ou vazio
  observacoes: string
  entregas: EntregaDoPlano[]
}

export interface FrenteDoPlano {
  id: string
  nome: string
  objetivo?: string
  acoes: AcaoDoPlano[]
}

export const novaEntrega = (nome: string): EntregaDoPlano => ({ id: novoId(), nome, status: 'a iniciar', prazo: '' })

export const novaAcao = (nome: string, entregas: EntregaDoPlano[] = []): AcaoDoPlano => ({
  id: novoId(),
  nome,
  status: 'a iniciar',
  responsavel: '',
  prazo: '',
  observacoes: '',
  entregas,
})

// No Plano de Comunicação, cada frente tem uma ação por público e, em cada ação, um toolkit de
// comunicação como entrega.
const PUBLICOS = ['Público externo', 'Ecossistema', 'Stakeholders']
const acoesPorPublico = () =>
  PUBLICOS.map(p => novaAcao(`Plano de comunicação para ${p}`, [novaEntrega(`Toolkit de comunicação para ${p}`)]))

const frenteUnica = (nome: string): FrenteDoPlano[] => [{ id: 'principal', nome, acoes: [] }]

export interface Plano {
  slug: string // parte final da URL e nome do arquivo em dados/
  titulo: string
  inicial: () => FrenteDoPlano[] // usado só quando ainda não existe o arquivo em dados/
  // 'encaminhamentos': lista compacta com botão feito/pendente, uma frente por reunião; nas
  // pendências da semana entram também os itens sem prazo.
  formato?: 'encaminhamentos'
  // Quadro da Monday que alimenta a aba (só leitura); quando existe, a aba deixa de ser preenchida à mão.
  quadroMonday?: number
  // Subabas lidas da Monday: a frente de mesmo id deixa de ser preenchida à mão (os dados manuais
  // continuam no arquivo, só não aparecem).
  frentesMonday?: { id: string; quadro: number }[]
}

// Quadro da Monday de uma aba inteira ou de uma subaba (frente).
export const quadroDe = (p: Plano, frente?: string | null) =>
  frente ? p.frentesMonday?.find(f => f.id === frente)?.quadro : p.quadroMonday

export const PLANOS: Plano[] = [
  {
    slug: 'comunicacao',
    titulo: 'Plano de Comunicação',
    inicial: () => [
      { id: 'educacao-basica', nome: 'Comunicação - Educação Básica', acoes: acoesPorPublico() },
      {
        id: 'policy-papers',
        nome: 'Comunicação - Policy Papers',
        objetivo: 'Trazer boas práticas de como fazer formação continuada em parceria com governos.',
        acoes: acoesPorPublico(),
      },
    ],
    frentesMonday: [{ id: 'educacao-basica', quadro: COMUNICACAO_EDUCACAO_BASICA_ID }],
  },
  {
    slug: 'credenciamento-ia-mec',
    titulo: 'Credenciamento IA no MEC',
    inicial: () => frenteUnica('Credenciamento IA no MEC'),
    quadroMonday: CREDENCIAMENTO_MEC_ID,
  },
  {
    slug: 'comunicacao-institucional',
    titulo: 'Comunicação Institucional',
    inicial: () => frenteUnica('Comunicação Institucional'),
    quadroMonday: COMUNICACAO_INSTITUCIONAL_ID,
  },
  {
    slug: 'eixo-advocacy',
    titulo: 'Advocacy + Policy Papers',
    inicial: () => frenteUnica('Advocacy + Policy Papers'),
    quadroMonday: ADVOCACY_POLICY_PAPERS_ID,
  },
  {
    slug: 'extensao-gm-seduc',
    titulo: 'Cursos de Extensão, GM e Entregáveis com SEDUC',
    inicial: () => frenteUnica('Cursos de Extensão, GM e Entregáveis com SEDUC'),
    quadroMonday: EXTENSAO_GM_SEDUC_ID,
  },
  {
    slug: 'extensao-regulares-mec',
    titulo: 'Cursos de Extensão, Plano de Ação Regulares e MEC',
    inicial: () => frenteUnica('Cursos de Extensão, Plano de Ação Regulares e MEC'),
    quadroMonday: EXTENSAO_REGULARES_MEC_ID,
  },
  { slug: 'novos-estados', titulo: 'Plano de Ação Novos Estados', inicial: () => frenteUnica('Plano de Ação Novos Estados') },
  {
    slug: 'encaminhamentos-squad',
    titulo: 'Encaminhamentos de SQUAD',
    inicial: () => frenteUnica('Encaminhamentos de SQUAD'),
    formato: 'encaminhamentos',
  },
]

export const planoDe = (slug: string) => PLANOS.find(p => p.slug === slug) ?? null

export { novoId }
