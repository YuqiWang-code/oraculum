import type { HexagramData, LiuYaoLine, SixRelation } from '../../types'
import { HEXAGRAM_BY_NAME } from '../../data/hexagrams'
import { NAJIA, BRANCH_ELEMENT } from '../../data/najia'
import { relationOf } from '../../data/sixRelations'
import { PALACE_ELEMENT } from '../../data/palaces'

/**
 * 伏神（资料 6.6）
 * 本卦六亲缺失时，从本宫纯卦对应爻位找伏神。
 * v1 只做定位，不做复杂飞伏断法。
 */
export function attachHiddenSpirits(lines: LiuYaoLine[], hex: HexagramData): LiuYaoLine[] {
  const present = new Set(lines.map((l) => l.sixRelation))
  const needed: SixRelation[] = ['父母', '兄弟', '子孙', '妻财', '官鬼']
  const missing = needed.filter((r) => !present.has(r))
  if (missing.length === 0) return lines

  // 本宫纯卦：宫名即纯卦名（乾为天 -> 卦名"乾"）
  const pure = HEXAGRAM_BY_NAME.get(hex.palace)
  if (!pure) return lines
  const palaceEl = PALACE_ELEMENT[hex.palace]

  // 纯卦每爻纳支
  const pureLines: { branch: string; rel: SixRelation }[] = []
  for (let i = 0; i < 6; i++) {
    const trig = i <= 2 ? pure.lower : pure.upper
    const nj = NAJIA[trig]
    const branch = i <= 2 ? nj.innerBranches[i] : nj.outerBranches[i - 3]
    pureLines.push({ branch, rel: relationOf(palaceEl, BRANCH_ELEMENT[branch]) })
  }

  const result = lines.map((l) => ({ ...l }))
  for (const miss of missing) {
    // 在纯卦对应爻位找该六亲
    for (let i = 0; i < 6; i++) {
      if (pureLines[i].rel === miss) {
        // 仅当该爻位确实缺这个六亲时（飞神就是当前卦同爻位）
        if (result[i].sixRelation !== miss) {
          result[i].hidden = {
            branch: pureLines[i].branch,
            element: BRANCH_ELEMENT[pureLines[i].branch],
            relation: miss
          }
        }
        break
      }
    }
  }
  return result
}
