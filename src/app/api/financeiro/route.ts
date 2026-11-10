import { NextResponse } from 'next/server'
import { bloquearSemAcesso } from '@/lib/acesso'
import { lerDados } from '@/lib/dados'
import type { MarcoFinanceiro } from '@/lib/fisico'

// Marcos da execução financeira (% por programa e rubrica), em dados/financeiro.json: dado financeiro, fica
// fora do git (cada pessoa guarda o seu). Sem o arquivo, a aba Físico-financeiro mostra só o físico.

export async function GET() {
  const bloqueio = await bloquearSemAcesso()
  if (bloqueio) return bloqueio
  return NextResponse.json({ marcos: lerDados<{ marcos: MarcoFinanceiro[] }>('financeiro', { marcos: [] }).marcos })
}
