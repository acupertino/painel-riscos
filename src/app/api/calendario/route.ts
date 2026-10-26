import { NextResponse } from 'next/server'
import { CALENDARIO_ID, buscarQuadro } from '@/lib/monday'
import { normalizarAcao } from '@/lib/calendario'
import { comCache } from '@/lib/cache'

// Ações normalizadas do Calendário Detalhado 2026. Cache de 30 min em .cache/;
// ?refresh=1 força nova leitura da Monday.

export const maxDuration = 120

export async function GET(req: Request) {
  const refresh = new URL(req.url).searchParams.get('refresh') === '1'
  try {
    const data = await comCache('calendario', refresh, async () => {
      const quadro = await buscarQuadro(CALENDARIO_ID)
      return { geradoEm: new Date().toISOString(), quadro: quadro.nome, acoes: quadro.elementos.map(normalizarAcao) }
    })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 })
  }
}
