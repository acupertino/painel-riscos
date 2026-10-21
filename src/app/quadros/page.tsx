import PageHeader from '@/components/PageHeader'
import { ABAS } from '@/components/navegacao'

export default function Quadros() {
  return (
    <>
      <PageHeader titulo="Quadros" subtitulo="Quadros da Monday analisados" abas={ABAS} />
      <main className="pt-[120px] px-4 md:px-8 pb-8 animate-fade-in-up">
        <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-4 text-sm text-slate-500">
          Em construção.
        </div>
      </main>
    </>
  )
}
