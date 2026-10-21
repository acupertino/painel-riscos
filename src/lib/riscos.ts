// Níveis de risco e cores (padrão de status do monday-v2: em atraso, em andamento, concluído, sem status).

export type NivelRisco = 'alto' | 'medio' | 'baixo' | 'semClassificacao'

export const NIVEIS: { chave: NivelRisco; rotulo: string; cor: string }[] = [
  { chave: 'alto', rotulo: 'Alto', cor: '#f87171' },
  { chave: 'medio', rotulo: 'Médio', cor: '#facc15' },
  { chave: 'baixo', rotulo: 'Baixo', cor: '#34d399' },
  { chave: 'semClassificacao', rotulo: 'Sem classificação', cor: '#d1d5db' },
]

export type ContagemRiscos = Record<NivelRisco, number>

// Dados fictícios para o esqueleto visual, até ligarmos os quadros reais da Monday.
export const EXEMPLO_RISCOS_POR_QUADRO: ({ quadro: string } & ContagemRiscos)[] = [
  { quadro: 'Projetos', alto: 6, medio: 9, baixo: 12, semClassificacao: 3 },
  { quadro: 'Operações', alto: 4, medio: 7, baixo: 8, semClassificacao: 2 },
  { quadro: 'Parcerias', alto: 2, medio: 5, baixo: 9, semClassificacao: 1 },
  { quadro: 'Formação', alto: 3, medio: 4, baixo: 6, semClassificacao: 4 },
  { quadro: 'Tecnologia', alto: 5, medio: 6, baixo: 4, semClassificacao: 0 },
]
