import { NextResponse } from 'next/server'
import { bloquearSemAcesso } from '@/lib/acesso'
import { planoDe, type FrenteDoPlano } from '@/lib/planos'
import { gravarDados, lerDados } from '@/lib/dados'

// Planos da área restrita salvos em dados/plano-{slug}.json. GET lê as frentes
// com as ações e PUT grava tudo de uma vez, como no COMEX.

export async function GET(_req: Request, ctx: RouteContext<'/api/planos/[slug]'>) {
  const bloqueio = await bloquearSemAcesso()
  if (bloqueio) return bloqueio
  const plano = planoDe((await ctx.params).slug)
  if (!plano) return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 })
  const inicial = plano.inicial()
  // Frentes salvas antes de existirem os campos objetivo e entregas recebem os valores iniciais.
  const retiradas = plano.frentesRetiradas ?? []
  const frentes = lerDados<FrenteDoPlano[]>(`plano-${plano.slug}`, inicial)
    .filter(f => !retiradas.includes(f.id))
    .map(f => ({
    ...f,
    objetivo: f.objetivo ?? inicial.find(p => p.id === f.id)?.objetivo ?? '',
    acoes: f.acoes.map(a => ({ ...a, entregas: a.entregas ?? [] })),
  }))
  return NextResponse.json({ titulo: plano.titulo, frentes })
}

export async function PUT(req: Request, ctx: RouteContext<'/api/planos/[slug]'>) {
  const bloqueio = await bloquearSemAcesso()
  if (bloqueio) return bloqueio
  const plano = planoDe((await ctx.params).slug)
  if (!plano) return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 })
  try {
    const { frentes } = (await req.json()) as { frentes: FrenteDoPlano[] }
    if (!Array.isArray(frentes)) return NextResponse.json({ error: 'Formato inválido' }, { status: 400 })
    // Subabas retiradas não vêm da tela: mantém o que já estava gravado delas.
    const retiradas = plano.frentesRetiradas ?? []
    const guardadas = retiradas.length ? lerDados<FrenteDoPlano[]>(`plano-${plano.slug}`, []).filter(f => retiradas.includes(f.id)) : []
    gravarDados(`plano-${plano.slug}`, [...frentes.filter(f => !retiradas.includes(f.id)), ...guardadas])
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
