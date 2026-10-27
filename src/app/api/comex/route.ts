import fs from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'
import type { ReuniaoComex } from '@/lib/comex'

// Reuniões do COMEX salvas em dados/comex.json (fora do git). GET lê a lista toda e PUT
// grava a lista toda: o app tem poucas reuniões e uma pessoa editando por vez.

const ARQUIVO = path.join(process.cwd(), 'dados', 'comex.json')

function ler(): ReuniaoComex[] {
  try {
    return JSON.parse(fs.readFileSync(ARQUIVO, 'utf-8'))
  } catch {
    return []
  }
}

export async function GET() {
  return NextResponse.json({ reunioes: ler() })
}

export async function PUT(req: Request) {
  try {
    const { reunioes } = (await req.json()) as { reunioes: ReuniaoComex[] }
    if (!Array.isArray(reunioes)) return NextResponse.json({ error: 'Formato inválido' }, { status: 400 })
    fs.mkdirSync(path.dirname(ARQUIVO), { recursive: true })
    fs.writeFileSync(ARQUIVO, JSON.stringify(reunioes, null, 2))
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
