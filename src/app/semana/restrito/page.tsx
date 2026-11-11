import { redirect } from 'next/navigation'

// A aba "Pendências da semana" foi retirada a pedido da Isa (11/11/2026): quem entra pelo cadeado
// vai direto para o Resumo.
export default function EntradaRestrita() {
  redirect('/semana/restrito/resumo')
}
