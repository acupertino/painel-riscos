// Previsão de riscos das próximas semanas, só com o Calendário Detalhado. Três tipos:
// somente um dia útil, sobrecarga da área (semana ou dia) e histórico de atrasos.
// O app só aponta o risco; a decisão sobre o que fazer é da diretoria (pedido de 26/10/2026).
// Limiares calibrados com os dados de 26/10/2026.

import { type Acao, type Etapa, estaConcluida, rotuloCurso } from '@/lib/calendario'
import {
  areasDe,
  dataCurta,
  diasUteisEntre,
  etapaAnterior,
  inicioDaSemana,
  nomeBase,
  outraArea,
  somarDias,
  type NivelAlerta,
} from '@/lib/semana'

export type TipoRisco = 'somente um dia útil' | 'sobrecarga da área' | 'histórico de atrasos'

const MIN_SEMANA = 5
const FATOR_SOBRECARGA = 1.5 // em relação ao que a área costuma ter por semana
const FATOR_CRITICO = 2
const MIN_DIA = 4
const MIN_HISTORICO = 5
const TAXA_ATENCAO = 0.25
const TAXA_CRITICA = 0.5

export const TIPOS: { tipo: TipoRisco; criterio: string }[] = [
  {
    tipo: 'somente um dia útil',
    criterio: 'A ação começa no dia útil seguinte ao fim da etapa anterior, que é de outra área e ainda não está concluída.',
  },
  {
    tipo: 'sobrecarga da área',
    criterio: `A área tem na semana 50% mais prazos do que costuma ter (mínimo de ${MIN_SEMANA}; crítico se for o dobro), ou ${MIN_DIA} ou mais prazos no mesmo dia.`,
  },
  {
    tipo: 'histórico de atrasos',
    criterio: `A mesma etapa, na mesma área, terminou fora do prazo ou atrasada em ${TAXA_ATENCAO * 100}% ou mais das vezes (crítico a partir de ${TAXA_CRITICA * 100}%; mínimo de ${MIN_HISTORICO} registros).`,
  },
]

export interface RiscoPrevisto {
  tipo: TipoRisco
  nivel: NivelAlerta // 'crítico' ou 'atenção'
  semana: string // segunda-feira da semana do risco
  data: string // data mais próxima envolvida
  titulo: string
  detalhe: string
  areas: string[]
  cursos: string[]
}

const REGEX_ATRASO = /FORA DO PRAZO|ATRAS/i
const ROTULO_ETAPA: Record<Etapa, string> = {
  preparação: 'preparação',
  liberação: 'liberação',
  aulas: 'aulas',
  entrega: 'entrega',
  correção: 'correção',
  validação: 'validação da correção',
  frequência: 'frequência',
  tratamento: 'tratamento dos dados',
  divulgação: 'divulgação',
  comunicação: 'comunicação com cursista',
  nanocertificação: 'nanocertificação',
  outra: 'outras',
}

const lista = (xs: string[]) => [...new Set(xs)]

export function preverRiscos(todas: Acao[], hoje: string, inicio: string, semanas: number) {
  const fim = somarDias(inicio, semanas * 7 - 1)
  const futuras = todas.filter(a => a.termino && a.termino >= inicio && a.termino <= fim)
  const semanasHorizonte = Array.from({ length: semanas }, (_, i) => somarDias(inicio, i * 7))
  const riscos: RiscoPrevisto[] = []

  // 1. Somente um dia útil entre etapas de áreas diferentes, juntando cursos com o mesmo par.
  const pares = new Map<string, { acao: Acao; anterior: Acao; cursos: string[] }>()
  for (const acao of futuras) {
    const anterior = etapaAnterior(acao, todas)
    if (!anterior || !outraArea(acao, anterior) || estaConcluida(anterior)) continue
    if (!acao.inicio || acao.inicio <= anterior.termino! || diasUteisEntre(anterior.termino!, acao.inicio) > 0) continue
    const chave = [nomeBase(anterior.nome), anterior.area, anterior.termino, nomeBase(acao.nome), acao.area, acao.termino].join('|')
    const p = pares.get(chave) ?? { acao, anterior, cursos: [] }
    p.cursos.push(rotuloCurso(acao))
    pares.set(chave, p)
  }
  for (const { acao, anterior, cursos } of pares.values())
    riscos.push({
      tipo: 'somente um dia útil',
      nivel: 'atenção',
      semana: inicioDaSemana(acao.termino!),
      data: acao.inicio!,
      titulo: `${nomeBase(acao.nome)} [${acao.area}] começa ${dataCurta(acao.inicio)}, um dia útil depois de ${nomeBase(anterior.nome)} [${anterior.area}] terminar (${dataCurta(anterior.termino)})`,
      detalhe: `${acao.cluster}. Qualquer atraso de ${anterior.area} passa direto para ${acao.area}.`,
      areas: lista([anterior.area, acao.area]),
      cursos,
    })

  // 2. Sobrecarga na semana: comparação com o que a área costuma ter por semana no calendário.
  const porAreaSemana = new Map<string, Map<string, number>>()
  for (const a of todas) {
    if (!a.termino) continue
    const s = inicioDaSemana(a.termino)
    for (const area of areasDe(a.area)) {
      const m = porAreaSemana.get(area) ?? new Map<string, number>()
      m.set(s, (m.get(s) ?? 0) + 1)
      porAreaSemana.set(area, m)
    }
  }
  const habitual = new Map([...porAreaSemana].map(([area, m]) => [area, [...m.values()].reduce((x, y) => x + y, 0) / m.size]))

  for (const area of lista(futuras.flatMap(a => areasDe(a.area))).sort())
    for (const s of semanasHorizonte) {
      const n = porAreaSemana.get(area)?.get(s) ?? 0
      const media = habitual.get(area) ?? Infinity
      if (n < MIN_SEMANA || n < FATOR_SOBRECARGA * media) continue
      const daSemana = futuras.filter(a => areasDe(a.area).includes(area) && inicioDaSemana(a.termino!) === s)
      riscos.push({
        tipo: 'sobrecarga da área',
        nivel: n >= FATOR_CRITICO * media ? 'crítico' : 'atenção',
        semana: s,
        data: s,
        titulo: `${area}: ${n} prazos na semana de ${dataCurta(s)}`,
        detalhe: `Assuntos: ${lista(daSemana.map(a => a.cluster)).join(', ')}.`,
        areas: [area],
        cursos: lista(daSemana.map(rotuloCurso)),
      })
    }

  // Sobrecarga no mesmo dia.
  const porAreaDia = new Map<string, Acao[]>()
  for (const a of futuras)
    for (const area of areasDe(a.area)) porAreaDia.set(`${area}|${a.termino}`, [...(porAreaDia.get(`${area}|${a.termino}`) ?? []), a])
  for (const [chave, acoes] of porAreaDia) {
    if (acoes.length < MIN_DIA) continue
    const [area, dia] = chave.split('|')
    riscos.push({
      tipo: 'sobrecarga da área',
      nivel: 'atenção',
      semana: inicioDaSemana(dia),
      data: dia,
      titulo: `${area}: ${acoes.length} prazos no mesmo dia (${dataCurta(dia)})`,
      detalhe: lista(acoes.map(a => nomeBase(a.nome))).join(' · '),
      areas: [area],
      cursos: lista(acoes.map(rotuloCurso)),
    })
  }

  // 3. Histórico de atrasos por área + etapa (só registros com status preenchido).
  const historico = new Map<string, { total: number; atrasos: number }>()
  for (const a of todas) {
    if (!a.termino || a.termino >= hoje || !a.status || a.etapa === 'outra') continue
    const chave = `${a.area}|${a.etapa}`
    const h = historico.get(chave) ?? { total: 0, atrasos: 0 }
    h.total++
    if (REGEX_ATRASO.test(a.status)) h.atrasos++
    historico.set(chave, h)
  }
  const futurasPorGrupo = new Map<string, Acao[]>()
  for (const a of futuras) {
    const chave = `${a.area}|${a.etapa}|${inicioDaSemana(a.termino!)}`
    futurasPorGrupo.set(chave, [...(futurasPorGrupo.get(chave) ?? []), a])
  }
  for (const [chave, acoes] of futurasPorGrupo) {
    const [area, etapa, s] = chave.split('|')
    const h = historico.get(`${area}|${etapa}`)
    if (!h || h.total < MIN_HISTORICO) continue
    const taxa = h.atrasos / h.total
    if (taxa < TAXA_ATENCAO) continue
    riscos.push({
      tipo: 'histórico de atrasos',
      nivel: taxa >= TAXA_CRITICA ? 'crítico' : 'atenção',
      semana: s,
      data: acoes.map(a => a.termino!).sort()[0],
      titulo: `${area} · ${ROTULO_ETAPA[etapa as Etapa]}: ${acoes.length} ${acoes.length === 1 ? 'prazo' : 'prazos'} na semana; ${Math.round(taxa * 100)}% de atraso no histórico`,
      detalhe: `${h.atrasos} de ${h.total} registros dessa etapa terminaram fora do prazo ou atrasados. ${lista(acoes.map(a => nomeBase(a.nome))).join(' · ')}`,
      areas: [area],
      cursos: lista(acoes.map(rotuloCurso)),
    })
  }

  const ordem: Record<NivelAlerta, number> = { crítico: 0, atenção: 1, ok: 2 }
  riscos.sort((a, b) => a.semana.localeCompare(b.semana) || ordem[a.nivel] - ordem[b.nivel] || a.data.localeCompare(b.data))
  return { riscos, semanas: semanasHorizonte, inicio, fim }
}
