import { NextResponse } from 'next/server'
import { bloquearSemAcesso } from '@/lib/acesso'
import { comCache } from '@/lib/cache'
import type { LinhaBruta } from '@/lib/fisico'
import { QUADROS, buscarQuadro } from '@/lib/monday'

// Físico do físico-financeiro (pedido de 10/11/2026): todas as linhas (elementos e subelementos) de todos os
// quadros conectados, com os textos das colunas, para classificar por programa e rubrica em src/lib/fisico.ts.
// Cache de 30 min em .cache/; ?refresh=1 força nova leitura da Monday.

export const maxDuration = 300

const textos = (cs: { titulo: string; texto: string | null }[]) =>
  Object.fromEntries(cs.filter(c => c.texto).map(c => [c.titulo, c.texto as string]))

export async function GET(req: Request) {
  const bloqueio = await bloquearSemAcesso()
  if (bloqueio) return bloqueio
  const refresh = new URL(req.url).searchParams.get('refresh') === '1'
  try {
    const data = await comCache('fisico', refresh, async () => {
      const linhas: LinhaBruta[] = []
      for (const q of QUADROS) {
        const d = await buscarQuadro(q.id)
        for (const e of d.elementos) {
          linhas.push({ quadro: q.nome, grupo: e.grupo, mae: null, nome: e.nome, temSubelementos: e.subelementos.length > 0, colunas: textos(e.colunas) })
          for (const s of e.subelementos)
            linhas.push({ quadro: q.nome, grupo: e.grupo, mae: e.nome, nome: s.nome, temSubelementos: false, colunas: textos(s.colunas) })
        }
      }
      return { geradoEm: new Date().toISOString(), linhas }
    })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 })
  }
}
