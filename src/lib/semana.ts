// Análise da semana: ações com término previsto na semana, assuntos (clusters), dependências
// entre áreas e a pauta do squad. Datas sempre em AAAA-MM-DD; dias úteis = segunda a sexta,
// sem feriados.

import { type Acao, type Cluster, type Etapa, estaConcluida, rotuloCurso } from '@/lib/calendario'

// ---------- datas ----------

const paraData = (iso: string) => new Date(`${iso}T12:00:00Z`)
const paraIso = (d: Date) => d.toISOString().slice(0, 10)

export const somarDias = (iso: string, dias: number) => {
  const d = paraData(iso)
  d.setUTCDate(d.getUTCDate() + dias)
  return paraIso(d)
}

export const hojeIso = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Segunda-feira da semana da data.
export const inicioDaSemana = (iso: string) => {
  const dia = paraData(iso).getUTCDay() // 0 = domingo
  return somarDias(iso, dia === 0 ? -6 : 1 - dia)
}

const DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']
export const diaDaSemana = (iso: string) => DIAS[paraData(iso).getUTCDay()]
export const dataCurta = (iso: string | null) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : 's/ data')
export const periodo = (a: Acao) =>
  a.inicio && a.termino && a.inicio !== a.termino ? `${dataCurta(a.inicio)}–${dataCurta(a.termino)}` : dataCurta(a.termino)

// Dias úteis estritamente entre duas datas (0 = passagem no dia útil seguinte ou no mesmo dia).
export function diasUteisEntre(de: string, ate: string): number {
  let n = 0
  for (let d = somarDias(de, 1); d < ate; d = somarDias(d, 1)) {
    const dia = paraData(d).getUTCDay()
    if (dia !== 0 && dia !== 6) n++
  }
  return n
}

// ---------- ações da semana ----------

export interface Semana {
  inicio: string // segunda
  fim: string // domingo
}

export const semanaDe = (iso: string): Semana => {
  const inicio = inicioDaSemana(iso)
  return { inicio, fim: somarDias(inicio, 6) }
}

export const acoesDaSemana = (acoes: Acao[], s: Semana) =>
  acoes
    .filter(a => a.termino && a.termino >= s.inicio && a.termino <= s.fim)
    .sort((a, b) => (a.termino! + a.area + a.nome).localeCompare(b.termino! + b.area + b.nome))

export const estaVencida = (a: Acao, hoje: string) => !!a.termino && a.termino < hoje && !estaConcluida(a)

// Nome sem marcadores entre colchetes/parênteses, para juntar ações iguais de cursos diferentes.
export const nomeBase = (nome: string) => nome.replace(/\[.*?\]|\(.*?\)/g, ' ').replace(/\s+/g, ' ').trim()

// ---------- dependências entre áreas ----------

// Etapas que precisam ter acontecido antes de cada etapa, em ordem de preferência.
// Ex.: o tratamento dos dados depende da validação da correção; sem ela, da correção; sem
// correção, da entrega.
const ETAPAS_ANTERIORES: Record<Etapa, Etapa[]> = {
  preparação: [],
  liberação: ['preparação'],
  aulas: [],
  entrega: ['liberação', 'divulgação', 'preparação'],
  correção: ['entrega'],
  validação: ['correção'],
  frequência: ['frequência', 'correção'],
  tratamento: ['validação', 'correção', 'entrega'], // atividade objetiva não tem correção
  divulgação: ['tratamento'],
  comunicação: ['divulgação', 'tratamento', 'liberação', 'preparação'],
  nanocertificação: ['divulgação', 'tratamento'],
  outra: [],
}

export type NivelAlerta = 'crítico' | 'atenção' | 'ok'

export const COR_NIVEL: Record<NivelAlerta, { forte: string; suave: string }> = {
  crítico: { forte: '#f87171', suave: '#fca5a5' },
  atenção: { forte: '#facc15', suave: '#fde68a' },
  ok: { forte: '#34d399', suave: '#6ee7b7' },
}

// Critério de cada nível, exibido na legenda do cabeçalho (mesma regra de dependenciasEntreAreas).
export const CRITERIO_NIVEL: Record<NivelAlerta, string> = {
  crítico: 'Etapa anterior venceu sem conclusão na Monday',
  atenção: 'Somente um dia útil ou etapa anterior em aberto',
  ok: 'Etapa anterior já concluída',
}

export interface Dependencia {
  acao: Acao
  anterior: Acao
  folga: number // dias úteis entre o fim da anterior e o início da ação
  nivel: NivelAlerta
  motivo: string
}

const mesmaCadeia = (a: Acao, b: Acao) => a.modulo === b.modulo && a.oferta === b.oferta && a.uc === b.uc
export const areasDe = (area: string) => area.split('/').map(x => x.trim())
export const outraArea = (a: Acao, b: Acao) => !areasDe(a.area).some(x => areasDe(b.area).includes(x))

// Etapa anterior da ação na mesma cadeia (módulo + curso + UC): primeiro no mesmo cluster,
// depois em qualquer cluster (ex.: a lista da recuperação sai do tratamento da oferta regular).
export function etapaAnterior(acao: Acao, todas: Acao[]): Acao | null {
  if (!acao.termino) return null
  const cadeia = todas.filter(
    b =>
      b.id !== acao.id &&
      b.termino &&
      mesmaCadeia(acao, b) &&
      b.termino <= acao.termino! &&
      (!acao.inicio || !b.inicio || b.inicio <= acao.inicio),
  )
  for (const doMesmoCluster of [true, false]) {
    for (const etapa of ETAPAS_ANTERIORES[acao.etapa]) {
      const candidatas = cadeia.filter(b => b.etapa === etapa && (b.cluster === acao.cluster) === doMesmoCluster)
      if (candidatas.length) return candidatas.sort((x, y) => y.termino!.localeCompare(x.termino!))[0]
    }
  }
  return null
}

export function dependenciasEntreAreas(semana: Acao[], todas: Acao[], hoje: string): Dependencia[] {
  const ordem: Record<NivelAlerta, number> = { crítico: 0, atenção: 1, ok: 2 }
  return semana
    .map(acao => {
      const anterior = etapaAnterior(acao, todas)
      if (!anterior || !outraArea(acao, anterior)) return null
      const folga = acao.inicio ? diasUteisEntre(anterior.termino!, acao.inicio) : 0
      let nivel: NivelAlerta = 'ok'
      let motivo = `${folga} dia${folga === 1 ? '' : 's'} út${folga === 1 ? 'il' : 'eis'} de folga`
      if (estaConcluida(anterior)) {
        motivo = `etapa anterior concluída (${anterior.status!.toLowerCase()})`
      } else if (anterior.termino! < hoje) {
        nivel = 'crítico'
        motivo = `etapa anterior venceu em ${dataCurta(anterior.termino)} sem conclusão registrada na Monday`
      } else if (folga === 0) {
        nivel = 'atenção'
        motivo = 'somente um dia útil: a ação começa no dia útil seguinte ao fim da anterior'
      } else {
        nivel = 'atenção'
        motivo = `etapa anterior ainda ${anterior.status ? anterior.status.toLowerCase() : 'sem status'}, termina ${dataCurta(anterior.termino)}`
      }
      return { acao, anterior, folga, nivel, motivo }
    })
    .filter((d): d is Dependencia => d !== null)
    .sort((a, b) => ordem[a.nivel] - ordem[b.nivel] || a.acao.termino!.localeCompare(b.acao.termino!))
}

// ---------- assuntos (clusters) ----------

export interface LinhaAssunto {
  nome: string
  area: string
  inicio: string | null
  termino: string | null
  cursos: string[]
  acoes: Acao[]
}

export interface Assunto {
  cluster: Cluster
  acoes: Acao[]
  linhas: LinhaAssunto[] // ações iguais (mesmo nome, área e datas) juntas numa linha
  areas: string[]
  criticas: number // dependências críticas que chegam neste assunto
}

export function agruparPorAssunto(semana: Acao[], deps: Dependencia[]): Assunto[] {
  const porCluster = new Map<Cluster, Acao[]>()
  for (const a of semana) porCluster.set(a.cluster, [...(porCluster.get(a.cluster) ?? []), a])
  return [...porCluster.entries()]
    .map(([cluster, acoes]) => {
      const linhas = new Map<string, LinhaAssunto>()
      for (const a of acoes) {
        const chave = [nomeBase(a.nome), a.area, a.inicio, a.termino].join('|')
        const l = linhas.get(chave) ?? { nome: nomeBase(a.nome), area: a.area, inicio: a.inicio, termino: a.termino, cursos: [], acoes: [] }
        l.cursos.push(rotuloCurso(a))
        l.acoes.push(a)
        linhas.set(chave, l)
      }
      return {
        cluster,
        acoes,
        linhas: [...linhas.values()].sort((x, y) => (x.termino ?? '').localeCompare(y.termino ?? '')),
        areas: [...new Set(acoes.flatMap(a => areasDe(a.area)))],
        criticas: deps.filter(d => d.acao.cluster === cluster && d.nivel === 'crítico').length,
      }
    })
    .sort((a, b) => b.criticas - a.criticas || b.acoes.length - a.acoes.length)
}

// ---------- pauta do squad ----------

export interface ItemPauta {
  texto: string
  nivel?: NivelAlerta
  detalhes?: string[]
}

export interface BlocoPauta {
  titulo: string
  descricao: string
  itens: ItemPauta[]
}

const listaNatural = (xs: string[]) =>
  xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} e ${xs[xs.length - 1]}`

// Racional da pauta: 1) dependências entre áreas que podem travar a semana; 2) os assuntos da
// semana resumidos; 3) o que já venceu sem conclusão; 4) encaminhamentos sugeridos.
export function montarPauta(s: Semana, semana: Acao[], todas: Acao[], hoje: string): BlocoPauta[] {
  const deps = dependenciasEntreAreas(semana, todas, hoje)
  const assuntos = agruparPorAssunto(semana, deps)

  // 1. Entre áreas (críticas e de atenção), juntando cursos com a mesma dependência.
  const passagens = new Map<string, { d: Dependencia; cursos: string[] }>()
  for (const d of deps.filter(d => d.nivel !== 'ok')) {
    const chave = [d.nivel, d.acao.cluster, nomeBase(d.anterior.nome), d.anterior.area, nomeBase(d.acao.nome), d.acao.area, d.acao.termino].join('|')
    const p = passagens.get(chave) ?? { d, cursos: [] }
    p.cursos.push(rotuloCurso(d.acao))
    passagens.set(chave, p)
  }
  const blocoDependencias: BlocoPauta = {
    titulo: 'Entre áreas',
    descricao: 'Ações da semana que dependem de uma etapa de outra área. Críticas primeiro.',
    itens: [...passagens.values()].map(({ d, cursos }) => ({
      nivel: d.nivel,
      texto: `${d.acao.cluster}: ${nomeBase(d.acao.nome)} [${d.acao.area}] até ${dataCurta(d.acao.termino)} depende de ${nomeBase(d.anterior.nome)} [${d.anterior.area}]`,
      detalhes: [`${listaNatural(cursos)}`, d.motivo],
    })),
  }

  // 2. Assuntos da semana.
  const blocoAssuntos: BlocoPauta = {
    titulo: 'Principais assuntos da semana',
    descricao: 'Ações com término nesta semana agrupadas por assunto; ações iguais de cursos diferentes ficam numa linha só.',
    itens: assuntos.map(a => {
      const datas = a.acoes.map(x => x.termino!).sort()
      const prazo = datas[0] === datas[datas.length - 1] ? `em ${dataCurta(datas[0])}` : `de ${dataCurta(datas[0])} a ${dataCurta(datas[datas.length - 1])}`
      return {
        nivel: a.criticas ? 'crítico' : undefined,
        texto: `${a.cluster}: ${a.acoes.length} ${a.acoes.length === 1 ? 'ação' : 'ações'} ${prazo} · ${a.areas.join(', ')}`,
        detalhes: a.linhas.map(l => `${nomeBase(l.nome)} [${l.area}] até ${dataCurta(l.termino)}: ${listaNatural(l.cursos)}`),
      }
    }),
  }

  // 3. Vencidas na semana sem conclusão.
  const vencidas = semana.filter(a => estaVencida(a, hoje))
  const blocoVencidas: BlocoPauta = {
    titulo: 'Prazos da semana já vencidos sem conclusão',
    descricao: 'Término previsto já passou e o status na Monday não está como concluído.',
    itens: vencidas.map(a => ({
      nivel: 'crítico',
      texto: `${nomeBase(a.nome)} [${a.area}] · ${rotuloCurso(a)} · venceu ${dataCurta(a.termino)}`,
      detalhes: [`Status: ${a.status ?? 'sem status'}`],
    })),
  }

  // 4. Encaminhamentos sugeridos.
  const encaminhamentos: ItemPauta[] = []
  const pendentesPorArea = new Map<string, Set<string>>()
  for (const d of deps.filter(d => d.nivel === 'crítico')) {
    const nomes = pendentesPorArea.get(d.anterior.area) ?? new Set<string>()
    nomes.add(nomeBase(d.anterior.nome))
    pendentesPorArea.set(d.anterior.area, nomes)
  }
  for (const [area, nomes] of pendentesPorArea)
    encaminhamentos.push({ texto: `${area}: confirmar a conclusão de ${listaNatural([...nomes].map(n => n.toLowerCase()))}, que libera ações de outras áreas nesta semana.` })

  const porDia = new Map<string, number>()
  for (const a of semana) porDia.set(a.termino!, (porDia.get(a.termino!) ?? 0) + 1)
  const diaCheio = [...porDia.entries()].sort((a, b) => b[1] - a[1])[0]
  if (diaCheio && diaCheio[1] >= 5)
    encaminhamentos.push({ texto: `Dia mais carregado: ${diaDaSemana(diaCheio[0])}, ${dataCurta(diaCheio[0])}, com ${diaCheio[1]} prazos. Verificar se as equipes precisam de reforço.` })

  const porArea = new Map<string, number>()
  for (const a of semana) for (const x of areasDe(a.area)) porArea.set(x, (porArea.get(x) ?? 0) + 1)
  const areaCheia = [...porArea.entries()].sort((a, b) => b[1] - a[1])[0]
  if (areaCheia) encaminhamentos.push({ texto: `Área com mais prazos na semana: ${areaCheia[0]} (${areaCheia[1]} ações).` })

  for (const a of semana.filter(a => a.repactuacao))
    encaminhamentos.push({ texto: `Repactuação registrada em ${nomeBase(a.nome)} · ${rotuloCurso(a)}: ${a.repactuacao}` })

  const desatualizadas = todas.filter(a => estaVencida(a, hoje))
  if (desatualizadas.length) {
    const contagem = new Map<string, number>()
    for (const a of desatualizadas) contagem.set(a.area, (contagem.get(a.area) ?? 0) + 1)
    encaminhamentos.push({
      texto: `Atualizar status na Monday: ${desatualizadas.length} ações do calendário já venceram sem conclusão registrada.`,
      detalhes: [...contagem.entries()].sort((a, b) => b[1] - a[1]).map(([area, n]) => `${area}: ${n}`),
    })
  }

  return [
    blocoDependencias,
    blocoAssuntos,
    blocoVencidas,
    { titulo: 'Encaminhamentos sugeridos', descricao: 'Pontos para decidir ou cobrar no squad.', itens: encaminhamentos },
  ].filter(b => b.itens.length > 0)
}

// Texto simples da pauta, para copiar e colar no Teams ou no e-mail.
export function pautaEmTexto(s: Semana, blocos: BlocoPauta[]): string {
  const linhas = [`Pauta do Squad · semana de ${dataCurta(s.inicio)} a ${dataCurta(s.fim)}`, '']
  blocos.forEach((b, i) => {
    linhas.push(`${i + 1}. ${b.titulo}`)
    for (const it of b.itens) {
      linhas.push(`   • ${it.nivel === 'crítico' ? '⚠️ ' : ''}${it.texto}`)
      for (const d of it.detalhes ?? []) linhas.push(`      – ${d}`)
    }
    linhas.push('')
  })
  return linhas.join('\n')
}
