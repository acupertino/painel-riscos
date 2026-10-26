'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Acao } from '@/lib/calendario'
import { acoesDaSemana, dependenciasEntreAreas, hojeIso, semanaDe, somarDias, type Dependencia, type Semana } from '@/lib/semana'

export interface Filtros {
  area: string
  cluster: string
  curso: string
}

const SEM_FILTRO: Filtros = { area: '', cluster: '', curso: '' }

interface ValorContexto {
  carregando: boolean
  erro: string | null
  geradoEm: string | null
  hoje: string
  semana: Semana
  mudarSemana: (passo: number) => void
  irParaHoje: () => void
  irParaData: (iso: string) => void
  atualizar: () => void
  todas: Acao[]
  daSemana: Acao[] // sem filtros (usada pela pauta)
  filtradas: Acao[] // com filtros
  dependencias: Dependencia[] // das ações filtradas
  filtros: Filtros
  setFiltros: (f: Filtros) => void
  opcoes: { areas: string[]; clusters: string[]; cursos: string[] }
}

const Contexto = createContext<ValorContexto | null>(null)

export function useSemana() {
  const v = useContext(Contexto)
  if (!v) throw new Error('useSemana fora do ProvedorSemana')
  return v
}

export const passaFiltro = (a: Acao, f: Filtros) =>
  (!f.area || a.area.split('/').map(x => x.trim()).includes(f.area)) &&
  (!f.cluster || a.cluster === f.cluster) &&
  (!f.curso || a.curso === f.curso)

export function ProvedorSemana({ children }: { children: ReactNode }) {
  const [hoje] = useState(hojeIso)
  const [todas, setTodas] = useState<Acao[]>([])
  const [geradoEm, setGeradoEm] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [semana, setSemana] = useState(() => semanaDe(hoje))
  const [filtros, setFiltros] = useState<Filtros>(SEM_FILTRO)

  const buscar = useCallback((forcar: boolean) => {
    fetch(`/api/calendario${forcar ? '?refresh=1' : ''}`)
      .then(r => r.json())
      .then(j => {
        if (j.error) throw new Error(j.error)
        setTodas(j.acoes)
        setGeradoEm(j.geradoEm)
      })
      .catch(e => setErro(String(e.message ?? e)))
      .finally(() => setCarregando(false))
  }, [])

  useEffect(() => buscar(false), [buscar])

  const daSemana = useMemo(() => acoesDaSemana(todas, semana), [todas, semana])
  const filtradas = useMemo(() => daSemana.filter(a => passaFiltro(a, filtros)), [daSemana, filtros])
  const dependencias = useMemo(() => dependenciasEntreAreas(filtradas, todas, hoje), [filtradas, todas, hoje])

  const opcoes = useMemo(() => {
    const ordenar = (xs: string[]) => [...new Set(xs)].sort((a, b) => a.localeCompare(b, 'pt-BR'))
    return {
      areas: ordenar(daSemana.flatMap(a => a.area.split('/').map(x => x.trim()))),
      clusters: ordenar(daSemana.map(a => a.cluster)),
      cursos: ordenar(daSemana.map(a => a.curso)),
    }
  }, [daSemana])

  const valor: ValorContexto = {
    carregando,
    erro,
    geradoEm,
    hoje,
    semana,
    mudarSemana: passo => setSemana(s => semanaDe(somarDias(s.inicio, passo * 7))),
    irParaHoje: () => setSemana(semanaDe(hoje)),
    irParaData: iso => setSemana(semanaDe(iso)),
    atualizar: () => {
      setCarregando(true)
      setErro(null)
      buscar(true)
    },
    todas,
    daSemana,
    filtradas,
    dependencias,
    filtros,
    setFiltros,
    opcoes,
  }

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}
