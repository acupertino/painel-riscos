// Frentes por área (pedido de 17/11/2026): clusters das ações em que cada área é R na RACI
// "[OFICIAL] RACI ANALISES - RESULTADOS" (aba "Analistas - RACI Geral v2").
// Correções da Isa: GEOP = GOPE; EPr e Processos & Governança = EPPg; GIPE e GEC = GDE; DAF fora da análise.
// Frentes retiradas a pedido dela (projetos especiais do EPPg, Pé-de-Meia na GAV, concurso no CPE, Edufin no GEX).
// Nas seções GAF e GGP da planilha, a ação sem R marcado fica com a área da coluna A.

export interface AcaoRaci {
  id: number | null // número da ação na planilha (as seções GAF e GGP não têm número)
  nome: string
  comR: string[] // outras áreas também marcadas como R na mesma ação
}

export interface ClusterRaci {
  nome: string
  acoes: AcaoRaci[]
}

export interface AreaRaci {
  sigla: string
  total: number
  clusters: ClusterRaci[]
}

export interface RaciFrentes {
  fonte: string
  totalAcoes: number
  comMaisDeUmR: number
  semR: { id: number | null; nome: string }[]
  areas: AreaRaci[]
}
