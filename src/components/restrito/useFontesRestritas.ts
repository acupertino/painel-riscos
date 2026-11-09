'use client'

import { useCallback, useEffect, useState } from 'react'
import { RESTRITO } from '@/components/navegacao'
import { PLANOS } from '@/lib/planos'
import type { AvaliacaoGav } from '@/lib/escritorio'
import { comoErro, lerJson, lerPlano } from '@/lib/fontesRestritas'
import { ABAS_FORA_DO_RELATORIO, fonteDeAvaliacoes, fonteDePlano, fonteDeQuadros, type FonteRelatorio } from '@/lib/relatorio'

// Hook (o React exige o prefixo "use"). Lê todas as abas da área restrita (Avaliações + planos, menos Encaminhamentos de SQUAD) no formato
// comum do Relatório. Usado pelo Relatório e pelo Resumo; buscar(true) força a leitura da Monday.
export function useFontesRestritas() {
  const [fontes, setFontes] = useState<FonteRelatorio[] | null>(null)
  const [erros, setErros] = useState<string[]>([])
  const [carregando, setCarregando] = useState(true)
  const [geradoEm, setGeradoEm] = useState<string | null>(null)

  const buscar = useCallback(async (atualizar: boolean) => {
    setCarregando(true)
    const falhas: string[] = []
    const avaliacoes = lerJson<{ avaliacoes: AvaliacaoGav[] }>(`/api/escritorio${atualizar ? '?refresh=1' : ''}`).then(
      j => [fonteDeAvaliacoes('Avaliações', `${RESTRITO}/avaliacoes`, j.avaliacoes)],
      e => (falhas.push(`Avaliações: ${comoErro(e)}`), []),
    )
    const planos = PLANOS.filter(p => !ABAS_FORA_DO_RELATORIO.includes(p.slug)).map(p =>
      lerPlano(p, atualizar).then(
        f => {
          const href = `${RESTRITO}/${p.slug}`
          return [
            ...(f.quadros.length ? [fonteDeQuadros(p.titulo, href, f.quadros)] : []),
            ...(f.manual.length ? [fonteDePlano(f.quadros.length ? `${p.titulo} (à mão)` : p.titulo, href, f.manual)] : []),
          ]
        },
        e => (falhas.push(`${p.titulo}: ${comoErro(e)}`), []),
      ),
    )
    const todas = (await Promise.all([avaliacoes, ...planos])).flat()
    setFontes(todas)
    setErros(falhas)
    setGeradoEm(new Date().toISOString())
    setCarregando(false)
  }, [])

  useEffect(() => {
    buscar(false)
  }, [buscar])

  return { fontes, erros, carregando, geradoEm, buscar }
}
