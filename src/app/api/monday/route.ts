import { NextResponse } from 'next/server'
import { QUADROS, buscarQuadro } from '@/lib/monday'
import { comCache } from '@/lib/cache'

// Dados brutos dos quadros de QUADROS (src/lib/monday.ts). Cache em disco em .cache/
// (fora do git) por 30 min; ?refresh=1 força nova leitura da Monday.

export const maxDuration = 120

export async function GET(req: Request) {
  const refresh = new URL(req.url).searchParams.get('refresh') === '1'
  try {
    const data = await comCache('monday', refresh, async () => {
      const quadros = []
      for (const q of QUADROS) quadros.push(await buscarQuadro(q.id))
      return { geradoEm: new Date().toISOString(), quadros }
    })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 })
  }
}
