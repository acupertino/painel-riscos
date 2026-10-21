import type { ReactNode } from 'react'
import Sidebar from '@/components/Sidebar'
import BottomNav from '@/components/BottomNav'

// Casca do app: sidebar fixa no desktop, barra inferior no celular.
export default function Shell({ children }: { children: ReactNode }) {
  return (
    <>
      <Sidebar />
      <div className="flex-1 min-w-0 md:ml-60 bg-gray-50 min-h-screen pb-16 md:pb-0">{children}</div>
      <BottomNav />
    </>
  )
}
