import { NextResponse } from 'next/server'
import { COOKIE_ACESSO, estaLiberado, resumoDaSenha, senhaConfigurada, senhaCorreta } from '@/lib/acesso'

// Entrada e saída da área restrita. GET diz se o navegador já está liberado; POST confere a
// senha e grava o cookie por 1 dia (pedido da Isa em 10/11/2026; antes eram 30); DELETE apaga o cookie.

export async function GET() {
  return NextResponse.json({ configurada: senhaConfigurada(), liberado: await estaLiberado() })
}

export async function POST(req: Request) {
  const { senha } = (await req.json().catch(() => ({}))) as { senha?: string }
  if (!senhaConfigurada()) return NextResponse.json({ error: 'Área restrita não configurada neste endereço' }, { status: 403 })
  if (!senha || !senhaCorreta(senha)) return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 })
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_ACESSO, resumoDaSenha(senha), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24,
    path: '/',
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete(COOKIE_ACESSO)
  return res
}
