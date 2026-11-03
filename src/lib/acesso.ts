import { createHash, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Área restrita (pedido de 03/11/2026): abas que só a Isa atualiza, liberadas por uma senha
// definida em SENHA_AREA_RESTRITA no .env.local. Sem a variável (ex.: na Vercel), ninguém entra.
// O cookie guarda só um resumo (hash) da senha, nunca a senha.

export const COOKIE_ACESSO = 'area_restrita'

export const senhaConfigurada = () => !!process.env.SENHA_AREA_RESTRITA

export const resumoDaSenha = (senha: string) => createHash('sha256').update(`painel-riscos:${senha}`).digest('hex')

function iguais(a: string, b: string) {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

export const senhaCorreta = (senha: string) => senhaConfigurada() && iguais(resumoDaSenha(senha), resumoDaSenha(process.env.SENHA_AREA_RESTRITA!))

export async function estaLiberado(): Promise<boolean> {
  if (!senhaConfigurada()) return false
  const valor = (await cookies()).get(COOKIE_ACESSO)?.value
  return !!valor && iguais(valor, resumoDaSenha(process.env.SENHA_AREA_RESTRITA!))
}

// Usado no início das rotas de API da área restrita: devolve a resposta 401 ou null se liberado.
export async function bloquearSemAcesso() {
  return (await estaLiberado()) ? null : NextResponse.json({ error: 'Área restrita: entre com a senha' }, { status: 401 })
}
