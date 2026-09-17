import type { TrigramName } from '../../types'
import { TRIGRAM_BY_NUMBER, TRIGRAMS } from '../../data/trigrams'
import { hexagramFromLines } from '../../data/hexagrams'
import { splitTrigrams } from '../hexagram/encode'
import { mutualHexagram } from '../hexagram/mutual'
import { changeMovingLine } from '../hexagram/transform'
import type { HexagramData, Lines } from '../../types'
import type { CastingEvidence } from '../../types'

/** mod8：余 0 视为 8 */
export function mod8(n: number): number {
  const r = ((n % 8) + 8) % 8
  return r === 0 ? 8 : r
}

/** mod6：余 0 视为 6 */
export function mod6(n: number): number {
  const r = ((n % 6) + 6) % 6
  return r === 0 ? 6 : r
}

/** 所有梅花类 caster 的统一输出 */
export interface MeihuaCastingResult {
  upperTrigram: TrigramName
  lowerTrigram: TrigramName
  movingLine: 1 | 2 | 3 | 4 | 5 | 6
  movingIndex0: number
  castingRuleVersion: string
  evidence: CastingEvidence
}

/**
 * 由上下卦 + 动爻，统一生成本/互/变卦与体用（与 v1 相同逻辑）。
 */
export function buildMeihuaFromTrigrams(
  upper: TrigramName,
  lower: TrigramName,
  movingLine: 1 | 2 | 3 | 4 | 5 | 6
) {
  const movingIndex0 = movingLine - 1
  const benLines = [...TRIGRAMS[lower].lines, ...TRIGRAMS[upper].lines] as Lines
  const ben = hexagramFromLines(benLines)
  const bianLines = changeMovingLine(benLines, movingIndex0)
  const bian = hexagramFromLines(bianLines)
  const { mutualLines } = mutualHexagram(benLines)
  const hu = hexagramFromLines(mutualLines)

  // 体用：动爻所在经卦为用
  let tiTrigram: TrigramName
  let yongTrigram: TrigramName
  if (movingIndex0 <= 2) {
    yongTrigram = lower
    tiTrigram = upper
  } else {
    yongTrigram = upper
    tiTrigram = lower
  }
  const tiElement = TRIGRAMS[tiTrigram].element
  const yongElement = TRIGRAMS[yongTrigram].element

  const { lower: bLower, upper: bUpper } = splitTrigrams(bianLines)
  const bianYongElement = TRIGRAMS[movingIndex0 <= 2 ? bLower : bUpper].element

  return {
    ben, hu, bian,
    movingLine, movingIndex0,
    tiTrigram, yongTrigram, tiElement, yongElement, bianYongElement,
    upper, lower
  }
}

export function trigramByNumber(n: number): TrigramName {
  return TRIGRAM_BY_NUMBER[mod8(n)]
}

export type { HexagramData }
