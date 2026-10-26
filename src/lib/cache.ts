import fs from 'fs'
import path from 'path'

// Cache em disco em .cache/ (fora do git). Validade de 30 min; `forcar` ignora o cache.
const TTL = 30 * 60 * 1000

export async function comCache<T>(nome: string, forcar: boolean, buscar: () => Promise<T>): Promise<T> {
  const arquivo = path.join(process.cwd(), '.cache', `${nome}.json`)
  if (!forcar) {
    try {
      const c = JSON.parse(fs.readFileSync(arquivo, 'utf-8'))
      if (Date.now() - c.ts < TTL) return c.data as T
    } catch {}
  }
  const data = await buscar()
  try {
    fs.mkdirSync(path.dirname(arquivo), { recursive: true })
    fs.writeFileSync(arquivo, JSON.stringify({ ts: Date.now(), data }))
  } catch {}
  return data
}
