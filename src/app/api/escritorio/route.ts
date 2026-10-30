import { NextResponse } from 'next/server'
import { AVALIACOES_GAV_ID, buscarQuadro } from '@/lib/monday'
import { avaliacoesDoEscritorio } from '@/lib/escritorio'
import { comCache } from '@/lib/cache'

// Avaliações e ações da visualização "Escritório de projetos" do quadro Avaliações_GAV.
// Cache de 30 min em .cache/; ?refresh=1 força nova leitura da Monday.

export const maxDuration = 120

export async function GET(req: Request) {
  const refresh = new URL(req.url).searchParams.get('refresh') === '1'
  try {
    const data = await comCache('escritorio', refresh, async () => {
      const quadro = await buscarQuadro(AVALIACOES_GAV_ID)
      return { geradoEm: new Date().toISOString(), quadro: quadro.nome, avaliacoes: avaliacoesDoEscritorio(quadro.elementos) }
    })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 })
  }
}
