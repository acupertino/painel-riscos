import { NextResponse } from 'next/server'
import { bloquearSemAcesso } from '@/lib/acesso'
import { lerDados } from '@/lib/dados'
import type { RaciFrentes } from '@/lib/raci'

// Frentes de cada área a partir do R da RACI (pedido de 17/11/2026), em dados/raci.json. O arquivo é gerado
// a partir da planilha enviada pela Isa; a planilha em si fica fora do git (pasta EXTERNO).

export async function GET() {
  const bloqueio = await bloquearSemAcesso()
  if (bloqueio) return bloqueio
  return NextResponse.json(lerDados<RaciFrentes | null>('raci', null) ?? { error: 'Análise da RACI ainda não gerada' })
}
