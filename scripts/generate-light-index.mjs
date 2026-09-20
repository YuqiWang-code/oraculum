// 一次性脚本：从 hexagramMeanings*.json 提取轻量索引到 light/light.json
// 仅保留首屏列表/搜索/一句话所需字段；完整古文/白话/384爻仍留在 heavy bundles。
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = process.cwd()
const dir = join(root, 'src/local-data/interpretation')

const p1 = JSON.parse(readFileSync(join(dir, 'hexagramMeanings.json'), 'utf-8'))
const p2 = JSON.parse(readFileSync(join(dir, 'hexagramMeaningsPart2.json'), 'utf-8'))
const all = { ...p1, ...p2 }

const light = {}
for (const [kw, h] of Object.entries(all)) {
  const hm = h.localMeaning || {}
  light[kw] = {
    kingWen: h.kingWen,
    name: h.name,
    core: hm.coreMeaning || '',
    theme: (hm.keyThemes && hm.keyThemes[0]) || '',
    themes: hm.keyThemes || [],
    asMutual: hm.asMutualHexagram || '',
    asChanged: hm.asChangedHexagram || '',
    lines: (h.lines || []).map((l) => ({
      index: l.index,
      themeKeyword: l.themeKeyword || '',
      core: l.coreMeaning || ''
    }))
  }
}

const outDir = join(root, 'src/local-data/light')
mkdirSync(outDir, { recursive: true })
writeFileSync(join(outDir, 'light.json'), JSON.stringify(light), 'utf-8')
console.log('light entries:', Object.keys(light).length)
console.log('size KB:', (JSON.stringify(light).length / 1024).toFixed(1))
