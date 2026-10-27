// Reuniões do COMEX: data, encaminhamentos e, em cada encaminhamento, as perguntas que ficam
// para cada área responder. Não vem da Monday: é registrado no próprio app e salvo em
// dados/comex.json (fora do git). Aba criada em 27/10/2026.

export interface PontoComex {
  id: string
  area: string // ex.: "GEOP", "GDA" ou "Comunicação"
  pergunta: string
  resposta: string // vazio enquanto a área não respondeu
}

export interface Encaminhamento {
  id: string
  texto: string
  pontos: PontoComex[]
}

export interface ReuniaoComex {
  id: string
  data: string // AAAA-MM-DD
  encaminhamentos: Encaminhamento[]
}

// Sugestões do campo de área; aceita qualquer outro texto.
export const AREAS_COMEX = ['GDA', 'GDE', 'GEOP', 'GFOR', 'GIMP', 'GIPE', 'CPE', 'Comunicação']

export const novoId = () => Math.random().toString(36).slice(2, 10)

export const estaRespondido = (p: PontoComex) => p.resposta.trim() !== ''

export function comexEmTexto(r: ReuniaoComex, dataCurta: (d: string) => string): string {
  const linhas = [`COMEX de ${dataCurta(r.data)}`, '']
  r.encaminhamentos.forEach((e, i) => {
    linhas.push(`${i + 1}. ${e.texto}`)
    for (const p of e.pontos)
      linhas.push(`   - ${p.area}: ${p.pergunta}${estaRespondido(p) ? ` → ${p.resposta}` : ' (em aberto)'}`)
    linhas.push('')
  })
  return linhas.join('\n').trim()
}
