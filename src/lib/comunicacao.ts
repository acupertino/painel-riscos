// Plano de Comunicação: ações de comunicação de cada frente (Educação Básica e Policy Papers).
// Não vem da Monday: é registrado no próprio app e salvo em dados/plano-comunicacao.json
// (fora do git). Aba e ações iniciais de Policy Papers pedidas em 03/11/2026.

import { novoId } from '@/lib/comex'

export type StatusComunicacao = 'a iniciar' | 'em andamento' | 'em atraso' | 'concluído'

export const STATUS_COMUNICACAO: StatusComunicacao[] = ['a iniciar', 'em andamento', 'em atraso', 'concluído']

// Versões suaves das cores de status do app.
export const COR_STATUS_COMUNICACAO: Record<StatusComunicacao, string> = {
  'a iniciar': '#93c5fd',
  'em andamento': '#fde68a',
  'em atraso': '#fca5a5',
  concluído: '#6ee7b7',
}

export interface AcaoComunicacao {
  id: string
  nome: string
  status: StatusComunicacao
  responsavel: string
  prazo: string // AAAA-MM-DD ou vazio
  observacoes: string
  entregas: EntregaComunicacao[]
}

export interface EntregaComunicacao {
  id: string
  nome: string
  status: StatusComunicacao
  prazo: string // AAAA-MM-DD ou vazio
}

export interface FrenteComunicacao {
  id: string
  nome: string
  objetivo?: string
  acoes: AcaoComunicacao[]
}

export const novaEntrega = (nome: string): EntregaComunicacao => ({ id: novoId(), nome, status: 'a iniciar', prazo: '' })

export const novaAcao = (nome: string, entregas: EntregaComunicacao[] = []): AcaoComunicacao => ({
  id: novoId(),
  nome,
  status: 'a iniciar',
  responsavel: '',
  prazo: '',
  observacoes: '',
  entregas,
})

// Cada frente tem uma ação por público e, em cada ação, um toolkit de comunicação como entrega
// (pedido de 03/11/2026).
const PUBLICOS = ['Público externo', 'Ecossistema', 'Stakeholders']
const acoesPorPublico = () =>
  PUBLICOS.map(p => novaAcao(`Plano de comunicação para ${p}`, [novaEntrega(`Toolkit de comunicação para ${p}`)]))

// Usado só quando ainda não existe o arquivo em dados/.
export const PLANO_INICIAL: FrenteComunicacao[] = [
  { id: 'educacao-basica', nome: 'Comunicação - Educação Básica', acoes: acoesPorPublico() },
  {
    id: 'policy-papers',
    nome: 'Comunicação - Policy Papers',
    objetivo: 'Trazer boas práticas de como fazer formação continuada em parceria com governos.',
    acoes: acoesPorPublico(),
  },
]

export { novoId }
