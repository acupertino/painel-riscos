import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { QUADROS, buscarQuadro } from '@/lib/monday'

// Dados brutos dos quadros de QUADROS (src/lib/monday.ts). Cache em disco em .cache/
// (fora do git) por 30 min; ?refresh=1 força nova leitura da Monday.

const CACHE_PATH = path.join(process.cwd(), '.cache', 'monday.json')
const CACHE_TTL = 30 * 60 * 1000

export const maxDuration = 120

export async function GET(req: Request) {
  const refresh = new URL(req.url).searchParams.get('refresh') === '1'
  if (!refresh) {
    try {
      const c = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8'))
      if (Date.now() - c.ts < CACHE_TTL) return NextResponse.json(c.data)
    } catch {}
  }
  try {
    const quadros = []
    for (const q of QUADROS) quadros.push(await buscarQuadro(q.id))
    const data = { geradoEm: new Date().toISOString(), quadros }
    try {
      fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true })
      fs.writeFileSync(CACHE_PATH, JSON.stringify({ ts: Date.now(), data }))
    } catch {}
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 })
  }
}
