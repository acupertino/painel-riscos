// Pendências da semana na área restrita (pedido de 03/11/2026): junta o que está em aberto em
// todas as abas. Regras:
// - Clusters (Calendário Detalhado): ações com término na semana sem conclusão na Monday, com as
//   ações iguais de cursos diferentes numa linha só (mesma regra da aba Clusters).
// - Avaliações (Avaliações_GAV) e planos da área restrita: itens não concluídos com prazo até o fim
//   da semana, incluindo os atrasados de semanas anteriores. Itens sem prazo são só contados.
// - COMEX: perguntas para as áreas ainda sem resposta (de qualquer data).

import { estaConcluida, type Acao } from '@/lib/calendario'
import { categoriaDe, type AvaliacaoGav } from '@/lib/escritorio'
import type { FrenteDoPlano, StatusPlano } from '@/lib/planos'
import { estaRespondido, type ReuniaoComex } from '@/lib/comex'
import { agruparPorAssunto, dataCurta, type Semana } from '@/lib/semana'

export interface Pendencia {
  grupo: string // cluster, avaliação ou frente
  nome: string
  detalhe?: string
  prazo: string | null
  status: string
  atrasada: boolean // prazo já passou
}

export interface BlocoPendencias {
  fonte: string // nome da aba
  href: string
  cor: string
  itens: Pendencia[]
  semPrazo: number // itens em aberto sem prazo definido
  erro?: string
}

// Sem prazo vai para o fim.
const porPrazo = (a: Pendencia, b: Pendencia) => (a.prazo ?? '9999').localeCompare(b.prazo ?? '9999') || a.nome.localeCompare(b.nome, 'pt-BR')

export function pendenciasDosClusters(daSemana: Acao[], hoje: string): Pendencia[] {
  const abertas = daSemana.filter(a => !estaConcluida(a))
  return agruparPorAssunto(abertas, []).flatMap(as =>
    as.linhas.map(l => ({
      grupo: as.cluster,
      nome: l.nome,
      detalhe: `${l.area} · ${l.cursos.join(', ')}`,
      prazo: l.termino,
      status: l.acoes[0].status ?? 'sem status',
      atrasada: !!l.termino && l.termino < hoje,
    })),
  ).sort(porPrazo)
}

export function pendenciasDasAvaliacoes(avaliacoes: AvaliacaoGav[], semana: Semana, hoje: string): { itens: Pendencia[]; semPrazo: number } {
  const itens: Pendencia[] = []
  let semPrazo = 0
  for (const av of avaliacoes)
    for (const a of av.acoes) {
      if (['concluído', 'outros'].includes(categoriaDe(a.status)) || a.fimReal) continue
      if (!a.fimPrevisto) semPrazo++
      else if (a.fimPrevisto <= semana.fim)
        itens.push({
          grupo: av.nome,
          nome: a.nome,
          detalhe: a.responsaveis ?? undefined,
          prazo: a.fimPrevisto,
          status: a.status ?? 'sem status',
          atrasada: a.fimPrevisto < hoje,
        })
    }
  return { itens: itens.sort(porPrazo), semPrazo }
}

// listarSemPrazo: nos Encaminhamentos de SQUAD, tudo o que está em aberto entra na lista, com ou sem prazo.
export function pendenciasDoPlano(
  frentes: FrenteDoPlano[],
  semana: Semana,
  hoje: string,
  listarSemPrazo = false,
): { itens: Pendencia[]; semPrazo: number } {
  const itens: Pendencia[] = []
  let semPrazo = 0
  const avaliar = (grupo: string, nome: string, status: StatusPlano, prazo: string, detalhe?: string) => {
    if (status === 'concluído') return
    if (!prazo && listarSemPrazo) itens.push({ grupo, nome, detalhe, prazo: null, status: 'pendente', atrasada: false })
    else if (!prazo) semPrazo++
    else if (prazo <= semana.fim) itens.push({ grupo, nome, detalhe, prazo, status, atrasada: prazo < hoje })
  }
  for (const f of frentes)
    for (const a of f.acoes) {
      avaliar(f.nome, a.nome, a.status, a.prazo, a.responsavel || undefined)
      for (const e of a.entregas) avaliar(f.nome, e.nome, e.status, e.prazo, `entrega de: ${a.nome}`)
    }
  return { itens: itens.sort(porPrazo), semPrazo }
}

export function pendenciasDoComex(reunioes: ReuniaoComex[]): Pendencia[] {
  return reunioes.flatMap(r =>
    r.encaminhamentos.flatMap(e =>
      e.pontos
        .filter(p => !estaRespondido(p))
        .map(p => ({ grupo: `COMEX de ${dataCurta(r.data)}`, nome: `${p.area}: ${p.pergunta}`, detalhe: e.texto, prazo: null, status: 'em aberto', atrasada: false })),
    ),
  )
}

// Texto simples para copiar e colar no Teams ou no e-mail.
export function pendenciasEmTexto(blocos: BlocoPendencias[], semana: Semana): string {
  const linhas = [`Pendências da semana de ${dataCurta(semana.inicio)} a ${dataCurta(semana.fim)}`, '']
  for (const b of blocos) {
    if (!b.itens.length && !b.semPrazo) continue
    linhas.push(`${b.fonte} (${b.itens.length})`)
    for (const p of b.itens)
      linhas.push(`   • ${p.atrasada ? '⚠️ ' : ''}${p.prazo ? `${dataCurta(p.prazo)} · ` : ''}${p.nome} [${p.grupo}] (${p.status})`)
    if (b.semPrazo) linhas.push(`   • ${b.semPrazo} ${b.semPrazo === 1 ? 'item' : 'itens'} em aberto sem prazo`)
    linhas.push('')
  }
  return linhas.join('\n').trim()
}
