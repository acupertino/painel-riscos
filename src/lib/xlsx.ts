// Gera um arquivo .xlsx no navegador, sem biblioteca: XML do Excel dentro de um ZIP sem compressão.
// Cada planilha tem cabeçalho fixo e com filtro, larguras de coluna e datas como data (dd/mm/aaaa).

export type Celula = string | number | null | { data: string } // data = AAAA-MM-DD

export interface Planilha {
  nome: string // até 31 caracteres, sem : \ / ? * [ ]
  colunas: { titulo: string; largura: number }[]
  linhas: Celula[][]
}

const esc = (s: string) =>
  s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const coluna = (i: number): string => (i < 26 ? String.fromCharCode(65 + i) : coluna(Math.floor(i / 26) - 1) + String.fromCharCode(65 + (i % 26)))
const serial = (iso: string) => (Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) - Date.UTC(1899, 11, 30)) / 864e5

// Estilos: 1 cabeçalho (branco em azul-marinho), 2 texto com quebra, 3 data, 4 número.
function celulaXml(ref: string, v: Celula, cabecalho: boolean): string {
  if (v === null || v === '') return ''
  if (cabecalho) return `<c r="${ref}" t="inlineStr" s="1"><is><t xml:space="preserve">${esc(String(v))}</t></is></c>`
  if (typeof v === 'number') return `<c r="${ref}" s="4"><v>${v}</v></c>`
  if (typeof v === 'object') return `<c r="${ref}" s="3"><v>${serial(v.data)}</v></c>`
  return `<c r="${ref}" t="inlineStr" s="2"><is><t xml:space="preserve">${esc(v)}</t></is></c>`
}

function planilhaXml(p: Planilha): string {
  const ultima = `${coluna(p.colunas.length - 1)}${p.linhas.length + 1}`
  const linha = (r: number, valores: Celula[], cab: boolean) => `<row r="${r}">${valores.map((v, i) => celulaXml(`${coluna(i)}${r}`, v, cab)).join('')}</row>`
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:${ultima}"/>
<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
<cols>${p.colunas.map((c, i) => `<col min="${i + 1}" max="${i + 1}" width="${c.largura}" customWidth="1"/>`).join('')}</cols>
<sheetData>${linha(1, p.colunas.map(c => c.titulo), true)}${p.linhas.map((l, i) => linha(i + 2, l, false)).join('')}</sheetData>
<autoFilter ref="A1:${ultima}"/></worksheet>`
}

const ESTILOS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="1"><numFmt numFmtId="164" formatCode="dd/mm/yyyy"/></numFmts>
<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts>
<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF00347F"/></patternFill></fill></fills>
<borders count="2"><border/><border><left style="thin"><color rgb="FFE2E8F0"/></left><right style="thin"><color rgb="FFE2E8F0"/></right><top style="thin"><color rgb="FFE2E8F0"/></top><bottom style="thin"><color rgb="FFE2E8F0"/></bottom></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="5">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="top"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="top"/></xf>
</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`

// ---------- ZIP (sem compressão) ----------

const TABELA_CRC = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

function crc32(b: Uint8Array): number {
  let c = 0xffffffff
  for (let i = 0; i < b.length; i++) c = TABELA_CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function zip(arquivos: Record<string, string>): Blob {
  const enc = new TextEncoder()
  const partes: Uint8Array[] = []
  const central: Uint8Array[] = []
  let offset = 0
  const entradas = Object.entries(arquivos)
  for (const [nome, conteudo] of entradas) {
    const dados = enc.encode(conteudo)
    const nomeB = enc.encode(nome)
    const crc = crc32(dados)
    const local = new DataView(new ArrayBuffer(30))
    local.setUint32(0, 0x04034b50, true)
    local.setUint16(4, 20, true)
    local.setUint16(6, 0x0800, true) // nomes em UTF-8
    local.setUint32(14, crc, true)
    local.setUint32(18, dados.length, true)
    local.setUint32(22, dados.length, true)
    local.setUint16(26, nomeB.length, true)
    partes.push(new Uint8Array(local.buffer), nomeB, dados)
    const c = new DataView(new ArrayBuffer(46))
    c.setUint32(0, 0x02014b50, true)
    c.setUint16(4, 20, true)
    c.setUint16(6, 20, true)
    c.setUint16(8, 0x0800, true)
    c.setUint32(16, crc, true)
    c.setUint32(20, dados.length, true)
    c.setUint32(24, dados.length, true)
    c.setUint16(28, nomeB.length, true)
    c.setUint32(42, offset, true)
    central.push(new Uint8Array(c.buffer), nomeB)
    offset += 30 + nomeB.length + dados.length
  }
  const tam = central.reduce((n, b) => n + b.length, 0)
  const fim = new DataView(new ArrayBuffer(22))
  fim.setUint32(0, 0x06054b50, true)
  fim.setUint16(8, entradas.length, true)
  fim.setUint16(10, entradas.length, true)
  fim.setUint32(12, tam, true)
  fim.setUint32(16, offset, true)
  return new Blob([...partes, ...central, new Uint8Array(fim.buffer)] as BlobPart[], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

export function gerarXlsx(planilhas: Planilha[]): Blob {
  const nomes = planilhas.map(p => p.nome.replace(/[:\\/?*[\]]/g, ' ').slice(0, 31))
  const arquivos: Record<string, string> = {
    '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${planilhas
      .map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`)
      .join('')}</Types>`,
    '_rels/.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    'xl/workbook.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${nomes
      .map((n, i) => `<sheet name="${esc(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
      .join('')}</sheets><definedNames>${planilhas
      .map((p, i) => `<definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">'${esc(nomes[i])}'!$A$1:$${coluna(p.colunas.length - 1)}$${p.linhas.length + 1}</definedName>`)
      .join('')}</definedNames></workbook>`,
    'xl/_rels/workbook.xml.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${planilhas
      .map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`)
      .join('')}<Relationship Id="rId${planilhas.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    'xl/styles.xml': ESTILOS,
  }
  planilhas.forEach((p, i) => (arquivos[`xl/worksheets/sheet${i + 1}.xml`] = planilhaXml(p)))
  return zip(arquivos)
}

export function baixar(blob: Blob, nomeArquivo: string) {
  const url = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement('a'), { href: url, download: nomeArquivo })
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
