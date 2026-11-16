import type { BlocoPauta, ItemPauta, Semana } from '@/lib/semana'

// Pautas principais do squad definidas pela Isa, por semana (chave = segunda-feira da semana).
// Aparecem no topo da aba Pauta, antes do que é gerado a partir do Calendário Detalhado.
// Semana de 16/11/2026: texto enviado pela Isa em 16/11/2026.

interface PautaDaSemana {
  principais: ItemPauta[]
  alertaProximaSemana?: ItemPauta[]
}

const PAUTAS: Record<string, PautaDaSemana> = {
  '2026-11-16': {
    principais: [
      { texto: 'Recuperação', detalhes: ['GM-BA: tratamento dos dados e produção da lista', 'Regular: comunicação com cursista'] },
      { texto: 'Extensão' },
      { texto: 'Recuperação extraordinária', detalhes: ['Divulgação da aprovação final M1 (GM-BA)', 'Divulgação da aprovação final M2 (Regular)'] },
      { texto: 'Pesquisa de satisfação', detalhes: ['DE e CP: aplicação da Pesquisa de Satisfação até 23/11'] },
      { texto: 'Operação Resgate' },
    ],
    alertaProximaSemana: [
      { texto: 'Correções de Recuperação de DE-BA (M2·UC4) e CP-BA (M2·UC3)' },
      {
        texto: 'Extensão: 8 ações de 23/11 a 29/11 · GDA, GEOP, GIMP',
        detalhes: [
          'Seleção 2ª chamada [GDA] até 23/11: SE-BA (Ext·2 Oferta)',
          'Seleção 3ª chamada [GDA] até 23/11: SE-SP (Ext·Oferta Única)',
          'Importação e enturmação 2ª chamada [GEOP] até 24/11: SE-BA (Ext·2 Oferta)',
          'Importação e enturmação 3ª chamada [GEOP] até 24/11: SE-SP (Ext·Oferta Única)',
          'Comunicação seleção 2ª chamada [GIMP] até 24/11: SE-BA (Ext·2 Oferta)',
          'Comunicação seleção 3ª chamada [GIMP] até 24/11: SE-SP (Ext·Oferta Única)',
          'Comunicação atividade 2ª chamada [GIMP] até 25/11: SE-BA (Ext·2 Oferta)',
          'Comunicação atividade 3ª chamada [GIMP] até 26/11: SE-SP (Ext·Oferta Única)',
        ],
      },
    ],
  },
}

export function pautaManual(s: Semana): BlocoPauta[] {
  const p = PAUTAS[s.inicio]
  if (!p) return []
  const blocos: BlocoPauta[] = [
    { titulo: 'Pautas principais da semana', descricao: 'Definidas para a reunião do squad desta semana.', itens: p.principais },
  ]
  if (p.alertaProximaSemana?.length)
    blocos.push({ titulo: 'Alerta da próxima semana', descricao: 'O que já precisa de atenção para a semana seguinte.', itens: p.alertaProximaSemana })
  return blocos
}
