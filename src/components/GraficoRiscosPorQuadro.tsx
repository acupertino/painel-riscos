'use client'

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { NIVEIS, type ContagemRiscos } from '@/lib/riscos'

interface Props {
  dados: ({ quadro: string } & ContagemRiscos)[]
}

// Barras empilhadas por nível; só o último segmento tem os cantos de cima arredondados.
export default function GraficoRiscosPorQuadro({ dados }: Props) {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barCategoryGap="30%">
          <CartesianGrid vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="quadro" tickLine={false} axisLine={{ stroke: '#e2e8f0' }} tick={{ fontSize: 12, fill: '#64748b' }} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
          <Tooltip
            cursor={{ fill: '#f1f5f9' }}
            contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12, boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)' }}
            itemStyle={{ color: '#334155' }}
            labelStyle={{ fontWeight: 600, color: '#1e293b' }}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: '#475569', paddingTop: 8 }} />
          {NIVEIS.map((n, i) => (
            <Bar
              key={n.chave}
              dataKey={n.chave}
              name={n.rotulo}
              stackId="riscos"
              fill={n.cor}
              stroke="#ffffff"
              strokeWidth={2}
              radius={i === NIVEIS.length - 1 ? [4, 4, 0, 0] : 0}
              animationDuration={450}
              animationEasing="ease-out"
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
