import { createHash, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Área restrita (pedido de 03/11/2026): abas liberadas por uma senha. Desde 10/11/2026 a senha fica fixa
// aqui no código (decisão da Isa: nem a senha nem as abas são sensíveis e o repositório é privado), para
// funcionar igual no computador de cada um e na Vercel. O cookie guarda só um resumo (hash) da senha.

const SENHA_AREA_RESTRITA = 'institutoanima-adminrestrito'

export const COOKIE_ACESSO = 'area_restrita'

export const senhaConfigurada = () => true

export const resumoDaSenha = (senha: string) => createHash('sha256').update(`painel-riscos:${senha}`).digest('hex')

function iguais(a: string, b: string) {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

export const senhaCorreta = (senha: string) => iguais(resumoDaSenha(senha), resumoDaSenha(SENHA_AREA_RESTRITA))

export async function estaLiberado(): Promise<boolean> {
  const valor = (await cookies()).get(COOKIE_ACESSO)?.value
  return !!valor && iguais(valor, resumoDaSenha(SENHA_AREA_RESTRITA))
}

// Usado no início das rotas de API da área restrita: devolve a resposta 401 ou null se liberado.
export async function bloquearSemAcesso() {
  return (await estaLiberado()) ? null : NextResponse.json({ error: 'Área restrita: entre com a senha' }, { status: 401 })
}
