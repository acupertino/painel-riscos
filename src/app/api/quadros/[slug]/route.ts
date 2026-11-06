import { NextResponse } from 'next/server'
import { bloquearSemAcesso } from '@/lib/acesso'
import { comCache } from '@/lib/cache'
import { buscarQuadro } from '@/lib/monday'
import { planoDe, quadroDe } from '@/lib/planos'
import { montarQuadroRestrito } from '@/lib/quadroRestrito'

// Quadro da Monday ligado a uma aba da área restrita (ou a uma subaba, com ?frente=), com os
// comentários das linhas. Cache de 30 min em .cache/; ?refresh=1 força nova leitura da Monday.

export const maxDuration = 120

export async function GET(req: Request, ctx: RouteContext<'/api/quadros/[slug]'>) {
  const bloqueio = await bloquearSemAcesso()
  if (bloqueio) return bloqueio
  const params = new URL(req.url).searchParams
  const frente = params.get('frente')
  const plano = planoDe((await ctx.params).slug)
  const quadro = plano && quadroDe(plano, frente)
  if (!plano || !quadro) return NextResponse.json({ error: 'Aba sem quadro da Monday' }, { status: 404 })
  try {
    const data = await comCache(`quadro-v2-${plano.slug}${frente ? `-${frente}` : ''}`, params.get('refresh') === '1', async () => {
      const q = await buscarQuadro(quadro, { comentarios: true })
      return { geradoEm: new Date().toISOString(), ...montarQuadroRestrito(q.nome, q.elementos) }
    })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 })
  }
}
