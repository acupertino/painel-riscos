import { NextResponse } from 'next/server'
import type { RiscoSemana } from '@/lib/escritorio'
import { gravarDados, lerDados } from '@/lib/dados'

// Riscos da semana do Escritório de Projetos, registrados à mão em dados/riscos-escritorio.json.

export async function GET() {
  return NextResponse.json({ riscos: lerDados<RiscoSemana[]>('riscos-escritorio', []) })
}

export async function PUT(req: Request) {
  try {
    const { riscos } = (await req.json()) as { riscos: RiscoSemana[] }
    if (!Array.isArray(riscos)) return NextResponse.json({ error: 'Formato inválido' }, { status: 400 })
    gravarDados('riscos-escritorio', riscos)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
