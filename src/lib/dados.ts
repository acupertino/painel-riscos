import fs from 'fs'
import path from 'path'

// Registros feitos à mão no próprio app (COMEX, riscos da semana, planos, marcos do financeiro), em
// dados/*.json. Desde 10/11/2026 a pasta vai para o git (decisão da Isa: não são sensíveis), para aparecer
// na Vercel. Lá o disco é só de leitura: editar pelo site não grava; edita-se no computador e envia.
const arquivo = (nome: string) => path.join(process.cwd(), 'dados', `${nome}.json`)

export function lerDados<T>(nome: string, padrao: T): T {
  try {
    return JSON.parse(fs.readFileSync(arquivo(nome), 'utf-8'))
  } catch {
    return padrao
  }
}

export function gravarDados(nome: string, dados: unknown) {
  if (process.env.VERCEL) {
    throw new Error('No site publicado não dá para salvar: edite no computador (npm run dev) e envie pelo /finalizar-tarefa.')
  }
  fs.mkdirSync(path.dirname(arquivo(nome)), { recursive: true })
  fs.writeFileSync(arquivo(nome), JSON.stringify(dados, null, 2))
}
