import { NextResponse } from 'next/server'
import { bloquearSemAcesso } from '@/lib/acesso'
import { gravarDados, lerDados } from '@/lib/dados'
import { andamentoInicial, type AndamentoEsteira } from '@/lib/esteiraPoliticas'

// Andamento da esteira de leitura das políticas, em dados/esteira-politicas.json. GET lê tudo e PUT grava
// tudo (duas pessoas, poucas mudanças). Políticas novas na lista entram com o andamento inicial.

export async function GET() {
  const bloqueio = await bloquearSemAcesso()
  if (bloqueio) return bloqueio
  return NextResponse.json({ andamento: { ...andamentoInicial(), ...lerDados<AndamentoEsteira>('esteira-politicas', {}) } })
}

export async function PUT(req: Request) {
  const bloqueio = await bloquearSemAcesso()
  if (bloqueio) return bloqueio
  try {
    const { andamento } = (await req.json()) as { andamento: AndamentoEsteira }
    if (!andamento || typeof andamento !== 'object') return NextResponse.json({ error: 'Formato inválido' }, { status: 400 })
    gravarDados('esteira-politicas', andamento)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String((e as Error).message ?? e) }, { status: 500 })
  }
}
