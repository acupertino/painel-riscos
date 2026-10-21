# Prompt — esqueleto visual

Como usar: rode `/iniciar-tarefa esqueleto visual` e depois peça ao Claude:
"execute o prompt de docs/prompts/esqueleto-visual.md". No fim, use `/finalizar-tarefa`.

---

Leia o CLAUDE.md, o docs/guia-estrutura.md e os guias do Next em node_modules/next/dist/docs/
antes de começar. Monte o esqueleto visual do app, substituindo o Hello World, no mesmo padrão
do app de referência (https://monday-v2-7jc2.vercel.app/arvores-indicadores):

1. globals.css
   - :root com --background #f8fafc e --foreground #171717; body com essas cores e fonte Geist
   - animações fadeIn, fadeOut e fadeInUp (translateY 8px → 0)
   - scrollbar fina (4px, cor #e2e8f0, trilho transparente)

2. Casca (src/components/Shell.tsx + Sidebar.tsx + BottomNav.tsx)
   - Sidebar fixa à esquerda, w-60, fundo branco, borda direita slate-200, visível a partir de md
   - topo da sidebar com o nome do app; links com ícone SVG inline (stroke, 24x24) + texto;
     link ativo destacado (bg-slate-100, texto slate-800, font-semibold)
   - no celular a sidebar some e aparece uma BottomNav fixa embaixo
   - conteúdo com md:ml-60, fundo bg-gray-50, pb-16 no celular
   - links iniciais: "Visão geral" (/), "Riscos" (/riscos), "Quadros" (/quadros);
     as duas últimas podem ser páginas vazias com título

3. Cabeçalho de página (src/components/PageHeader.tsx)
   - fixed top-0 left-0 right-0 md:left-60 z-30, bg-slate-600, border-b border-slate-500, pt-6 pb-5
   - título centralizado text-2xl font-bold text-white e subtítulo text-sm text-slate-300
   - à direita, navegação da seção em pílula:
     container: inline-flex gap-1 rounded-full bg-white/10 ring-1 ring-white/15 p-1 backdrop-blur-sm
     aba: px-3.5 py-1.5 rounded-full text-sm font-semibold, com ícone w-4 h-4
     ativa: bg-white text-slate-700 shadow-sm | inativa: text-slate-200 hover:text-white hover:bg-white/10
   - o conteúdo abaixo do cabeçalho começa com pt-[120px]

4. Página inicial de exemplo (/)
   - PageHeader com título "Painel de Riscos" e subtítulo "Análise de riscos dos quadros da Monday"
   - grid de 4 cards de KPI (rounded-xl bg-white border border-slate-200 shadow-sm p-4, borda
     esquerda colorida border-l-4) com números fictícios: Riscos mapeados, Altos, Médios, Baixos
   - um card com gráfico de barras Recharts (riscos por quadro, dados fictícios), barras com
     animationDuration 450 e easing ease-out
   - cores de risco: alto #f87171, médio #facc15, baixo #34d399, sem classificação #d1d5db

Use TypeScript, Tailwind e nomes em português. Ao terminar, rode npx tsc --noEmit e diga como
abrir no navegador.
