'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'

// Aviso fixo quando um registro feito à mão (COMEX, riscos) não chegou ao arquivo do servidor:
// painel desligado, publicado sem lugar para gravar ou sem conexão. Fica até salvar de novo.
export default function AvisoNaoSalvo({ erro, aoTentarDeNovo }: { erro: string | null; aoTentarDeNovo: () => void }) {
  useAvisoAoSair(!!erro)
  if (!erro || typeof document === 'undefined') return null
  return createPortal(
    <div
      role="alert"
      className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[60] w-[min(36rem,calc(100vw-2rem))] rounded-xl bg-white border border-red-200 border-l-4 border-l-red-500 shadow-lg p-4 animate-fade-in-up"
    >
      <p className="text-sm font-bold text-red-700">Atenção: sua última alteração NÃO foi salva.</p>
      <p className="mt-1 text-sm text-slate-700">
        O painel não conseguiu gravar o registro. Isso acontece quando o computador onde o painel roda está desligado
        ou quando o link não tem onde guardar os dados. Copie o texto antes de sair desta página.
      </p>
      <p className="mt-1 text-xs text-slate-500">Detalhe: {erro}</p>
      <button
        onClick={aoTentarDeNovo}
        className="mt-3 inline-flex items-center rounded-full bg-marca-marinho px-4 py-1.5 text-sm font-semibold text-white hover:bg-marca-azul-escuro"
      >
        Tentar salvar de novo
      </button>
    </div>,
    document.body,
  )
}

// Pede confirmação do navegador antes de fechar ou recarregar a página com algo não salvo.
export function useAvisoAoSair(ativo: boolean) {
  useEffect(() => {
    if (!ativo) return
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', avisar)
    return () => window.removeEventListener('beforeunload', avisar)
  }, [ativo])
}
