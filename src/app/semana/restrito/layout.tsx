'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LINKS_RESTRITOS, estaAtivo } from '@/components/navegacao'
import { Vazio } from '@/components/semana/Etiquetas'

// Área restrita: pede a senha (SENHA_AREA_RESTRITA no .env.local) antes de mostrar as abas.
// A proteção de verdade está nas rotas de API, que recusam quem não tem o cookie de acesso.

type Estado = 'verificando' | 'bloqueado' | 'sem-senha' | 'liberado'

export default function LayoutRestrito({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<Estado>('verificando')

  const verificar = useCallback(() => {
    fetch('/api/acesso')
      .then(r => r.json())
      .then((j: { configurada: boolean; liberado: boolean }) => setEstado(j.liberado ? 'liberado' : j.configurada ? 'bloqueado' : 'sem-senha'))
      .catch(() => setEstado('bloqueado'))
  }, [])

  useEffect(verificar, [verificar])

  if (estado === 'verificando') return <Vazio texto="Verificando acesso…" />
  if (estado === 'sem-senha') return <Vazio texto="A área restrita não está disponível neste endereço." />
  if (estado === 'bloqueado') return <Entrada aoEntrar={() => setEstado('liberado')} />

  return (
    <div className="space-y-4">
      <NavegacaoRestrita aoSair={() => fetch('/api/acesso', { method: 'DELETE' }).then(verificar)} />
      {children}
    </div>
  )
}

function NavegacaoRestrita({ aoSair }: { aoSair: () => void }) {
  const caminho = usePathname()
  return (
    <div className="flex flex-wrap items-start gap-2">
      <nav className="flex flex-wrap items-center gap-1 rounded-2xl bg-slate-100 ring-1 ring-slate-200 p-1">
        {LINKS_RESTRITOS.map(l => {
          const ativo = estaAtivo(l.href, caminho)
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold transition-colors ${
                ativo ? 'bg-marca-marinho text-white shadow-sm' : 'text-slate-600 hover:text-marca-marinho hover:bg-white'
              }`}
            >
              {l.icone('w-4 h-4')}
              {l.rotuloCurto ?? l.rotulo}
            </Link>
          )
        })}
      </nav>
      <button onClick={aoSair} className="nao-imprimir ml-auto mt-1.5 text-xs text-slate-500 hover:text-slate-800 underline">
        Sair da área restrita
      </button>
    </div>
  )
}

function Entrada({ aoEntrar }: { aoEntrar: () => void }) {
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const entrar = async () => {
    setEnviando(true)
    setErro(null)
    try {
      const r = await fetch('/api/acesso', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ senha }) })
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? `erro ${r.status}`)
      aoEntrar()
    } catch (e) {
      setErro(String((e as Error).message ?? e))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form
      onSubmit={e => {
        e.preventDefault()
        entrar()
      }}
      className="mx-auto mt-8 max-w-sm rounded-xl bg-white border border-slate-200 shadow-sm p-6 space-y-3"
    >
      <h2 className="text-lg font-bold text-marca-marinho">Área restrita</h2>
      <input
        type="password"
        value={senha}
        onChange={e => setSenha(e.target.value)}
        placeholder="Senha"
        autoFocus
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
        aria-label="Senha"
      />
      {erro && <p className="text-sm text-red-600">{erro}</p>}
      <button
        type="submit"
        disabled={!senha || enviando}
        className="w-full rounded-full bg-marca-marinho px-4 py-2 text-sm font-semibold text-white hover:bg-marca-azul-escuro disabled:opacity-50"
      >
        {enviando ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  )
}
