import { NextResponse } from 'next/server'
import { PLANO_INICIAL, type FrenteComunicacao } from '@/lib/comunicacao'
import { gravarDados, lerDados } from '@/lib/dados'

// Plano de Comunicação salvo em dados/plano-comunicacao.json (fora do git). GET lê as frentes
// com as ações e PUT grava tudo de uma vez, como no COMEX.

export async function GET() {
  // Frentes salvas antes de existir o campo objetivo recebem o objetivo inicial (03/11/2026).
  const frentes = lerDados<FrenteComunicacao[]>('plano-comunicacao', PLANO_INICIAL).map(f => ({
    ...f,
    objetivo: f.objetivo ?? PLANO_INICIAL.find(p => p.id === f.id)?.objetivo ?? '',
    acoes: f.acoes.map(a => ({ ...a, entregas: a.entregas ?? [] })),
  }))
  return NextResponse.json({ frentes })
}

export async function PUT(req: Request) {
  try {
    const { frentes } = (await req.json()) as { frentes: FrenteComunicacao[] }
    if (!Array.isArray(frentes)) return NextResponse.json({ error: 'Formato inválido' }, { status: 400 })
    gravarDados('plano-comunicacao', frentes)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
