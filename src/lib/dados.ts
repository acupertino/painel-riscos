import fs from 'fs'
import path from 'path'

// Registros feitos à mão no próprio app (COMEX, riscos da semana), em dados/*.json (fora do git).
const arquivo = (nome: string) => path.join(process.cwd(), 'dados', `${nome}.json`)

export function lerDados<T>(nome: string, padrao: T): T {
  try {
    return JSON.parse(fs.readFileSync(arquivo(nome), 'utf-8'))
  } catch {
    return padrao
  }
}

export function gravarDados(nome: string, dados: unknown) {
  fs.mkdirSync(path.dirname(arquivo(nome)), { recursive: true })
  fs.writeFileSync(arquivo(nome), JSON.stringify(dados, null, 2))
}
