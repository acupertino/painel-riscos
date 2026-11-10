import { NextResponse } from 'next/server'
import { bloquearSemAcesso } from '@/lib/acesso'
import { lerDados } from '@/lib/dados'
import type { MarcoFinanceiro } from '@/lib/fisico'

// Marcos da execução financeira (% por programa e rubrica), em dados/financeiro.json (vai para o git desde
// 10/11/2026; antes de enviar, confirmar com a Isa se há algo sensível). Sem o arquivo, mostra só o físico.

export async function GET() {
  const bloqueio = await bloquearSemAcesso()
  if (bloqueio) return bloqueio
  return NextResponse.json({ marcos: lerDados<{ marcos: MarcoFinanceiro[] }>('financeiro', { marcos: [] }).marcos })
}
