import { CLUSTER_COR, corDaArea, type Cluster } from '@/lib/calendario'
import { COR_NIVEL, type NivelAlerta } from '@/lib/semana'

// Cores de status do padrão do app (forte = bolinha, texto sempre em slate).
function corDoStatus(status: string | null): string {
  if (!status) return '#d1d5db'
  if (/ATRAS/i.test(status)) return '#f87171'
  if (/^CONCLU/i.test(status)) return '#34d399'
  if (/ANDAMENTO/i.test(status)) return '#facc15'
  if (/INICIAR/i.test(status)) return '#3b82f6'
  return '#94a3b8'
}

const Bolinha = ({ cor }: { cor: string }) => (
  <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cor }} />
)

export function EtiquetaArea({ area }: { area: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 whitespace-nowrap">
      <Bolinha cor={corDaArea(area)} />
      {area}
    </span>
  )
}

export function EtiquetaStatus({ status }: { status: string | null }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 whitespace-nowrap">
      <Bolinha cor={corDoStatus(status)} />
      {status ? status.charAt(0) + status.slice(1).toLowerCase() : 'Sem status'}
    </span>
  )
}

export function EtiquetaCluster({ cluster }: { cluster: Cluster }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 whitespace-nowrap">
      <Bolinha cor={CLUSTER_COR[cluster]} />
      {cluster}
    </span>
  )
}

const ICONE_NIVEL: Record<NivelAlerta, string> = { crítico: '⚠️', atenção: '⏱', ok: '✓' }

export function EtiquetaNivel({ nivel }: { nivel: NivelAlerta }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold text-slate-800 whitespace-nowrap"
      style={{ backgroundColor: COR_NIVEL[nivel].suave }}
    >
      <span aria-hidden="true">{ICONE_NIVEL[nivel]}</span>
      {nivel.charAt(0).toUpperCase() + nivel.slice(1)}
    </span>
  )
}

export function Vazio({ texto }: { texto: string }) {
  return <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-6 text-center text-sm text-slate-500">{texto}</div>
}
