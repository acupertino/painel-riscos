// Esteira de leitura das políticas e normas do ecossistema Ânima (pedido de 17/11/2026): Isabella e Celso
// Teles leem as 15, discutem numa agenda, sistematizam o que se aplica ao Instituto e começam a elaborar as
// políticas internas até 23/12/2026. Lista e nomes conforme o print da pasta enviado pela Isa em 17/11/2026.
// O andamento (status de leitura e decisão de cada política) fica em dados/esteira-politicas.json.

import type { Planilha } from '@/lib/xlsx'

export const LEITORES = ['Isabella', 'Celso Teles'] as const
export type Leitor = (typeof LEITORES)[number]

export const STATUS_LEITURA = ['A ler', 'Lendo', 'Lida', 'Ficha pronta'] as const
export type StatusLeitura = (typeof STATUS_LEITURA)[number]

export const DECISOES = ['', 'Aplica', 'Adaptar', 'Não se aplica'] as const
export type Decisao = (typeof DECISOES)[number]

export interface Politica {
  codigo: string
  nome: string
  tema: string
  bloco: number // semana de leitura (índice de BLOCOS)
}

// Blocos de leitura: começa pela norma de governança (rege as demais) e agrupa por tema para a discussão.
export const BLOCOS = [
  { rotulo: 'Bloco 1', inicio: '2026-11-17', fim: '2026-11-21' },
  { rotulo: 'Bloco 2', inicio: '2026-11-24', fim: '2026-11-28' },
  { rotulo: 'Bloco 3', inicio: '2026-12-01', fim: '2026-12-05' },
  { rotulo: 'Bloco 4', inicio: '2026-12-08', fim: '2026-12-10' },
]

export const POLITICAS: Politica[] = [
  { codigo: '229', nome: 'Governança das políticas, normas e procedimentos do ecossistema Ânima', tema: 'Governança das normas', bloco: 0 },
  { codigo: '062', nome: 'Política de gestão de riscos', tema: 'Riscos e controles', bloco: 0 },
  { codigo: '058', nome: 'Norma de gestão de riscos', tema: 'Riscos e controles', bloco: 0 },
  { codigo: '059', nome: 'Norma de gestão de planos de ação', tema: 'Riscos e controles', bloco: 1 },
  { codigo: '061', nome: 'Norma de monitoramento de controles internos', tema: 'Riscos e controles', bloco: 1 },
  { codigo: '141', nome: 'Política de compras e contratação de serviços', tema: 'Compras e fornecedores', bloco: 1 },
  { codigo: '138', nome: 'Norma de compras delegadas', tema: 'Compras e fornecedores', bloco: 1 },
  { codigo: '243', nome: 'Norma de avaliação de riscos de integridade de fornecedores', tema: 'Compras e fornecedores', bloco: 2 },
  { codigo: '244', nome: 'Norma de conflito de interesses', tema: 'Integridade e compliance', bloco: 2 },
  { codigo: '144', nome: 'Procedimento de reconhecimento de compliance - Integridade que Inspira', tema: 'Integridade e compliance', bloco: 2 },
  { codigo: '003', nome: 'Viabilidade para criação de CNPJ Minas Gerais', tema: 'Documentos e operações', bloco: 2 },
  { codigo: '053', nome: 'Gestão e salvamento de documentos de terceiros', tema: 'Documentos e operações', bloco: 3 },
  { codigo: '145', nome: 'Armazenamento, organização e manutenção dos alvarás', tema: 'Documentos e operações', bloco: 3 },
  { codigo: '165', nome: 'Norma serviço time automação', tema: 'Documentos e operações', bloco: 3 },
  { codigo: '228', nome: 'Norma de uso do observatório', tema: 'Documentos e operações', bloco: 3 },
]

export interface Etapa {
  nome: string
  inicio: string
  fim: string
  entrega: string
}

export const ETAPAS: Etapa[] = [
  { nome: 'Leitura individual', inicio: '2026-11-17', fim: '2026-12-10', entrega: '30 fichas de leitura (cada pessoa preenche uma por política, sem combinar)' },
  { nome: 'Agenda de discussão', inicio: '2026-12-11', fim: '2026-12-11', entrega: 'Decisão por política: Aplica, Adaptar ou Não se aplica' },
  { nome: 'Sistematização', inicio: '2026-12-14', fim: '2026-12-16', entrega: 'Matriz única do que se aplica ao Instituto e lista das políticas internas priorizadas' },
  { nome: 'Elaboração das internas', inicio: '2026-12-17', fim: '2026-12-23', entrega: 'Estrutura das políticas internas e rascunho das prioritárias' },
]

export const FICHA = [
  'Objetivo da política, em uma frase',
  'Escopo: a quem se aplica',
  'Principais regras e obrigações (3 a 5 tópicos)',
  'Papéis e responsáveis previstos',
  'Para o Instituto: Aplica, Não se aplica ou Adaptar, e por quê',
  'O que precisaríamos criar ou mudar internamente',
  'Dúvidas para levar à discussão',
]

export interface AndamentoPolitica {
  leitura: Record<Leitor, StatusLeitura>
  decisao: Decisao
  observacao: string
}

export type AndamentoEsteira = Record<string, AndamentoPolitica>

export const andamentoInicial = (): AndamentoEsteira =>
  Object.fromEntries(POLITICAS.map(p => [p.codigo, { leitura: { Isabella: 'A ler', 'Celso Teles': 'A ler' }, decisao: '', observacao: '' }]))

// ---------- Download em Excel (pedido de 17/11/2026) ----------

export function esteiraEmPlanilhas(andamento: AndamentoEsteira): Planilha[] {
  return [
    {
      nome: 'Políticas',
      colunas: [
        { titulo: 'Bloco', largura: 9 },
        { titulo: 'Leitura de', largura: 12 },
        { titulo: 'Leitura até', largura: 12 },
        { titulo: 'Código', largura: 8 },
        { titulo: 'Política / norma', largura: 62 },
        { titulo: 'Tema', largura: 24 },
        ...LEITORES.map(l => ({ titulo: l, largura: 14 })),
        { titulo: 'Decisão', largura: 15 },
        { titulo: 'Observação', largura: 50 },
      ],
      linhas: POLITICAS.map(p => {
        const a = andamento[p.codigo]
        const b = BLOCOS[p.bloco]
        return [b.rotulo, { data: b.inicio }, { data: b.fim }, p.codigo, p.nome, p.tema, ...LEITORES.map(l => a?.leitura[l] ?? 'A ler'), a?.decisao ?? '', a?.observacao ?? '']
      }),
    },
    {
      nome: 'Etapas',
      colunas: [
        { titulo: 'Etapa', largura: 26 },
        { titulo: 'Início', largura: 12 },
        { titulo: 'Fim', largura: 12 },
        { titulo: 'Entrega', largura: 80 },
      ],
      linhas: ETAPAS.map(e => [e.nome, { data: e.inicio }, { data: e.fim }, e.entrega]),
    },
    {
      nome: 'Ficha de leitura',
      colunas: [
        { titulo: 'Item', largura: 6 },
        { titulo: 'Pergunta', largura: 70 },
      ],
      linhas: FICHA.map((f, i) => [i + 1, f]),
    },
  ]
}
