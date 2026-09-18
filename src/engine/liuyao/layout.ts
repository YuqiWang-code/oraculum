import type { CalendarContext, HexagramData, LiuYaoLine, ShenshaHit, YinYang } from '../../types'
import { hexagramFromLines } from '../../data/hexagrams'
import { NAJIA, BRANCH_ELEMENT } from '../../data/najia'
import { relationOf } from '../../data/sixRelations'
import { sixSpiritsForDay } from '../../data/sixSpirits'
import { PALACE_ELEMENT } from '../../data/palaces'
import { changeMovingLine } from '../hexagram/transform'
import { attachHiddenSpirits } from './hiddenSpirits'
import { computeShensha } from '../../data/shensha'
import { trigramFromLines } from '../../data/trigrams'
import type { TrigramName } from '../../types'

export interface LiuYaoResult {
  hexagram: HexagramData
  changedHexagram?: HexagramData
  palace: HexagramData['palace']
  palaceElement: string
  shiLine: number
  yingLine: number
  lines: LiuYaoLine[]
  shensha: ShenshaHit[]
}

function trigramOf(lines: HexagramData['lines'], isLower: boolean): TrigramName {
  return isLower
    ? trigramFromLines([lines[0], lines[1], lines[2]])
    : trigramFromLines([lines[3], lines[4], lines[5]])
}

/**
 * 给定六爻（自下而上）与历法上下文，排出完整六爻盘。
 * @param lines 六爻自下而上
 * @param movingMask 长度6布尔，true为动爻
 */
export function buildLiuyao(lines: YinYang[], movingMask: boolean[], cal: CalendarContext): LiuYaoResult {
  const hex = hexagramFromLines(lines as HexagramData['lines'])
  const palaceEl = PALACE_ELEMENT[hex.palace]
  const spirits = sixSpiritsForDay(cal.dayStem)

  const out: LiuYaoLine[] = []
  for (let i = 0; i < 6; i++) {
    const isLower = i <= 2
    const nj = NAJIA[isLower ? hex.lower : hex.upper]
    const branch = isLower ? nj.innerBranches[i] : nj.outerBranches[i - 3]
    const stem = isLower ? nj.innerStem : nj.outerStem
    const branchElement = BRANCH_ELEMENT[branch]
    const sixRelation = relationOf(palaceEl, branchElement)
    const moving = !!movingMask[i]

    let changedBranch: string | undefined
    if (moving) {
      const changed = changeMovingLine(lines as HexagramData['lines'], i)
      const cTrig = trigramOf(changed, isLower)
      const cNj = NAJIA[cTrig]
      changedBranch = isLower ? cNj.innerBranches[i] : cNj.outerBranches[i - 3]
    }

    out.push({
      index: (i + 1) as LiuYaoLine['index'],
      yinYang: lines[i],
      moving,
      branch,
      branchElement,
      stem,
      sixRelation,
      sixSpirit: spirits[i],
      isShi: i + 1 === hex.shiLine,
      isYing: i + 1 === hex.yingLine,
      changedBranch
    })
  }

  const withHidden = attachHiddenSpirits(out, hex)
  const lineBranches = withHidden.map((l) => l.branch)
  const shensha = computeShensha(cal.dayBranch, cal.dayStem, lineBranches)

  // v3.4: 完整变卦（翻转全部动爻）
  const changedLines = lines.map((l, i) => movingMask[i] ? (l === 1 ? 0 : 1) : l) as HexagramData['lines']
  const changedHexagram = hexagramFromLines(changedLines)

  return {
    hexagram: hex,
    changedHexagram,
    palace: hex.palace,
    palaceElement: palaceEl,
    shiLine: hex.shiLine,
    yingLine: hex.yingLine,
    lines: withHidden,
    shensha
  }
}
