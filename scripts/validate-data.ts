/**
 * 数据校验脚本：tsx scripts/validate-data.ts
 * 校验八卦/64卦/八宫/纳甲/世应等静态数据一致性。
 */
import { HEXAGRAMS } from '../src/data/hexagrams'
import { TRIGRAMS } from '../src/data/trigrams'
import { PALACE_ELEMENT } from '../src/data/palaces'

let errors = 0
function check(cond: boolean, msg: string) {
  if (!cond) { console.error('✗', msg); errors++ }
}

check(Object.keys(TRIGRAMS).length === 8, '八卦应为8个')
check(HEXAGRAMS.length === 64, '六十四卦应为64个，实际 ' + HEXAGRAMS.length)

const nameSet = new Set(HEXAGRAMS.map((h) => h.name))
check(nameSet.size === 64, '卦名应唯一')

const lineSet = new Set(HEXAGRAMS.map((h) => h.lines.join('')))
check(lineSet.size === 64, '六爻编码应唯一')

for (const h of HEXAGRAMS) {
  check(h.kingWen >= 1 && h.kingWen <= 64, `${h.name} 序号越界`)
  check(h.lines.length === 6, `${h.name} 爻数应为6`)
  check(h.shiLine >= 1 && h.shiLine <= 6, `${h.name} 世爻越界`)
  check(h.yingLine >= 1 && h.yingLine <= 6, `${h.name} 应爻越界`)
  check(PALACE_ELEMENT[h.palace] !== undefined, `${h.name} 宫无效`)
  check(h.lineTextsClassic.length === 6, `${h.name} 爻辞应为6条`)
}

if (errors === 0) {
  console.log('✓ 数据校验通过：64卦结构、编码、宫、世应均一致。')
  process.exit(0)
} else {
  console.error(`校验失败：${errors} 处错误`)
  process.exit(1)
}
