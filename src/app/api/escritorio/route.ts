import { NextResponse } from 'next/server'
import { AVALIACOES_GAV_ID, buscarQuadro } from '@/lib/monday'
import { QUADROS_DE_TOPICOS, avaliacoesDoEscritorio, semTopicosFora, substituirTopicos, topicosDeQuadroProprio } from '@/lib/escritorio'
import { comCache } from '@/lib/cache'
import { bloquearSemAcesso } from '@/lib/acesso'
import { pontosRecentes } from '@/lib/quadroRestrito'

// Avaliações e ações da visualização "Escritório de projetos" do quadro Avaliações_GAV. Os tópicos
// com quadro próprio (QUADROS_DE_TOPICOS: AVALIAÇÃO CP e AVALIAÇÃO SE) vêm desses quadros, com os
// comentários como pontos de atenção.
// Cache de 30 min em .cache/; ?refresh=1 força nova leitura da Monday.

export const maxDuration = 120

export async function GET(req: Request) {
  const bloqueio = await bloquearSemAcesso()
  if (bloqueio) return bloqueio
  const refresh = new URL(req.url).searchParams.get('refresh') === '1'
  try {
    const data = await comCache('escritorio-v2', refresh, async () => {
      const [gav, ...quadros] = await Promise.all([
        buscarQuadro(AVALIACOES_GAV_ID),
        ...QUADROS_DE_TOPICOS.map(q => buscarQuadro(q.quadro, { comentarios: true })),
      ])
      const proprios = quadros.map((q, i) => topicosDeQuadroProprio(q.nome, q.elementos, QUADROS_DE_TOPICOS[i].linhas))
      return {
        geradoEm: new Date().toISOString(),
        quadro: gav.nome,
        avaliacoes: semTopicosFora(substituirTopicos(avaliacoesDoEscritorio(gav.elementos), proprios.flatMap(p => p.avaliacoes))),
        pontos: pontosRecentes(proprios.flatMap(p => p.pontos)),
      }
    })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 })
  }
}
