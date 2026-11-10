'use client'

// Faixa das abas ligadas à Monday: de qual quadro vêm os dados, de quando é a leitura e o botão
// que busca a versão atual na Monday (ignora o cache de 30 min).

export default function BarraMonday({
  quadros,
  geradoEm,
  carregando,
  erro,
  aoAtualizar,
}: {
  quadros: string
  geradoEm: string | null
  carregando: boolean
  erro?: string | null
  aoAtualizar: () => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl bg-white border border-slate-200 shadow-sm px-4 py-2.5">
      <div className="text-sm text-slate-600">
        <span className="font-semibold text-slate-800">Monday:</span> {quadros}
        {geradoEm && (
          <span className="text-slate-500"> · lido em {new Date(geradoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
        )}
        {erro && geradoEm && <span className="ml-2 font-semibold text-red-600">Falha ao atualizar: {erro}</span>}
      </div>
      <button
        onClick={aoAtualizar}
        disabled={carregando}
        className="print:hidden ml-auto inline-flex items-center gap-2 rounded-full bg-marca-marinho px-4 py-1.5 text-sm font-semibold text-white hover:bg-marca-azul-escuro disabled:opacity-60"
      >
        <svg className={`w-4 h-4 ${carregando ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
          <path d="M21 3v5h-5" />
        </svg>
        {carregando ? 'Atualizando…' : 'Atualizar da Monday'}
      </button>
    </div>
  )
}
