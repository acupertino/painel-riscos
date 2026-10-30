import { NextResponse } from 'next/server'
import type { ReuniaoComex } from '@/lib/comex'
import { gravarDados, lerDados } from '@/lib/dados'

// Reuniões do COMEX salvas em dados/comex.json (fora do git). GET lê a lista toda e PUT
// grava a lista toda: o app tem poucas reuniões e uma pessoa editando por vez.

export async function GET() {
  return NextResponse.json({ reunioes: lerDados<ReuniaoComex[]>('comex', []) })
}

export async function PUT(req: Request) {
  try {
    const { reunioes } = (await req.json()) as { reunioes: ReuniaoComex[] }
    if (!Array.isArray(reunioes)) return NextResponse.json({ error: 'Formato inválido' }, { status: 400 })
    gravarDados('comex', reunioes)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
