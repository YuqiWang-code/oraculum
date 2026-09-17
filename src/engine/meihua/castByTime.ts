import type { CalendarContext, Element, Lines, TrigramName } from '../../types'
import { TRIGRAM_BY_NUMBER, TRIGRAMS, relationOfElement } from '../../data/trigrams'
import { hexagramFromLines } from '../../data/hexagrams'
import { BRANCH_INDEX } from '../../data/solarTerms'
import { changeMovingLine } from '../hexagram/transform'
import { mutualHexagram } from '../hexagram/mutual'
import { splitTrigrams } from '../hexagram/encode'
import type { HexagramData } from '../../types'

/**
 * 梅花易数·时间起卦（资料 5.2 meihua_time_v1）
 * A = 年支数 + 农历月 + 农历日
 * B = A + 时支数
 * 上卦 = A mod 8（0→8），下卦 = B mod 8（0→8），动爻 = B mod 6（0→6）
 */
export interface MeihuaResult {
  ruleVersion: 'meihua_time_v1'
  annualBranchNum: number
  lunarMonth: number
  lunarDay: number
  hourBranchNum: number
  upperTrigram: TrigramName
  lowerTrigram: TrigramName
  /** 本卦 */
  ben: HexagramData
  /** 互卦 */
  hu: HexagramData
  /** 变卦 */
  bian: HexagramData
  /** 动爻 1-based（1=初...6=上） */
  movingLine: 1 | 2 | 3 | 4 | 5 | 6
  movingIndex0: number
  /** 体卦经卦 */
  tiTrigram: TrigramName
  /** 用卦经卦 */
  yongTrigram: TrigramName
  tiElement: Element
  yongElement: Element
  /** 体用关系 */
  relation: 'same' | 'generatesA' | 'generatesB' | 'controlsA' | 'controlsB'
  /** 变卦用卦之卦（变后的用卦）五行，看变对体 */
  bianYongElement: Element
}

function mod8(n: number): number {
  const r = n % 8
  return r === 0 ? 8 : r
}
function mod6(n: number): number {
  const r = n % 6
  return r === 0 ? 6 : r
}

export function castMeihuaByTime(cal: CalendarContext): MeihuaResult {
  const annualBranchNum = BRANCH_INDEX[cal.yearBranch]
  const M = cal.lunarMonth
  const D = cal.lunarDay
  const hourBranchNum = BRANCH_INDEX[cal.hourBranch]

  const A = annualBranchNum + M + D
  const B = A + hourBranchNum

  const upperNum = mod8(A)
  const lowerNum = mod8(B)
  const moving = mod6(B) as 1 | 2 | 3 | 4 | 5 | 6

  const upperTrigram = TRIGRAM_BY_NUMBER[upperNum]
  const lowerTrigram = TRIGRAM_BY_NUMBER[lowerNum]

  // 本卦：下卦=lowerNum，上卦=upperNum
  const benLines = [
    ...TRIGRAMS[lowerTrigram].lines,
    ...TRIGRAMS[upperTrigram].lines
  ] as Lines
  const ben = hexagramFromLines(benLines)

  const movingIndex0 = moving - 1
  const bianLines = changeMovingLine(benLines, movingIndex0)
  const bian = hexagramFromLines(bianLines)

  const { mutualLines } = mutualHexagram(benLines)
  const hu = hexagramFromLines(mutualLines)

  // 体用：动爻所在经卦为用，另一为体
  // 动爻 0-2 在下卦（lower），3-5 在上卦（upper）
  let tiTrigram: TrigramName
  let yongTrigram: TrigramName
  if (movingIndex0 <= 2) {
    yongTrigram = lowerTrigram
    tiTrigram = upperTrigram
  } else {
    yongTrigram = upperTrigram
    tiTrigram = lowerTrigram
  }
  const tiElement = TRIGRAMS[tiTrigram].element
  const yongElement = TRIGRAMS[yongTrigram].element
  const relation = relationOfElement(tiElement, yongElement)

  // 变卦中，用卦位置变为变后的经卦
  const { lower: bLower, upper: bUpper } = splitTrigrams(bianLines)
  const bianYongElement = TRIGRAMS[movingIndex0 <= 2 ? bLower : bUpper].element

  return {
    ruleVersion: 'meihua_time_v1',
    annualBranchNum,
    lunarMonth: M,
    lunarDay: D,
    hourBranchNum,
    upperTrigram,
    lowerTrigram,
    ben,
    hu,
    bian,
    movingLine: moving,
    movingIndex0,
    tiTrigram,
    yongTrigram,
    tiElement,
    yongElement,
    relation,
    bianYongElement
  }
}
