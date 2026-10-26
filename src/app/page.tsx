import { redirect } from 'next/navigation'

// Sem página inicial própria (Visão geral removida em 26/10/2026): abre direto nas ações da semana.
export default function Inicio() {
  redirect('/semana')
}
