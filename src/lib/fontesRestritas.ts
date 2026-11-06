// Leitura, no navegador, das fontes de cada aba da área restrita: o que foi preenchido à mão e os
// quadros da Monday da aba ou das subabas. Usado pelas Pendências da semana e pelo Relatório.

import type { FrenteDoPlano, Plano } from '@/lib/planos'
import type { GrupoQuadro } from '@/lib/quadroRestrito'

export const lerJson = async <T,>(url: string): Promise<T> => {
  const j = await (await fetch(url)).json()
  if (j.error) throw new Error(j.error)
  return j
}

export const comoErro = (e: unknown) => String((e as Error).message ?? e)

export interface FontePlano {
  manual: FrenteDoPlano[] // frentes preenchidas à mão (sem as que vêm da Monday)
  quadros: GrupoQuadro[][] // um por quadro da Monday ligado à aba
}

export async function lerPlano(p: Plano, atualizar = false): Promise<FontePlano> {
  const daMonday = p.frentesMonday?.map(f => f.id) ?? []
  const urls = p.quadroMonday ? [`/api/quadros/${p.slug}`] : daMonday.map(id => `/api/quadros/${p.slug}?frente=${id}`)
  const [manual, ...quadros] = await Promise.all([
    p.quadroMonday
      ? Promise.resolve<FrenteDoPlano[]>([])
      : lerJson<{ frentes: FrenteDoPlano[] }>(`/api/planos/${p.slug}`).then(j => j.frentes.filter(f => !daMonday.includes(f.id))),
    ...urls.map(url => lerJson<{ grupos: GrupoQuadro[] }>(atualizar ? `${url}${url.includes('?') ? '&' : '?'}refresh=1` : url).then(j => j.grupos)),
  ])
  return { manual: manual as FrenteDoPlano[], quadros: quadros as GrupoQuadro[][] }
}
