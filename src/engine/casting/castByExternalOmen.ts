import { mod6, MeihuaCastingResult } from './common'
import { TRIGRAMS } from '../../data/trigrams'
import { BRANCH_INDEX } from '../../data/solarTerms'
import type { CalendarContext, TrigramName } from '../../types'

/**
 * 外应起卦 meihua_external_omen_v1（资料 v2 第8节）
 * 传统外应思想 + 本项目 v1 规范化实现（非古籍唯一公式）。
 */

/** 颜色 -> 卦（仅资料可明确核验的 5 组，不强造八色表） */
export const COLOR_TO_TRIGRAM: Record<string, TrigramName> = {
  青: '震', 青绿: '震',
  红: '离', 紫: '离', 赤: '离',
  黄: '坤',
  白: '兑',
  黑: '坎'
}

/** 八象 -> 卦（说卦自然象） */
export const SYMBOL_TO_TRIGRAM: Record<string, TrigramName> = {
  天: '乾', 泽: '兑', 火: '离', 雷: '震',
  风: '巽', 水: '坎', 山: '艮', 地: '坤'
}

/** 方位 -> 卦（后天八卦方位） */
export const DIRECTION_TO_TRIGRAM: Record<string, TrigramName> = {
  西北: '乾', 西: '兑', 南: '离', 东: '震',
  东南: '巽', 北: '坎', 东北: '艮', 西南: '坤'
}

export interface OmenInput {
  kind: 'color' | 'symbol'
  /** 颜色名或八象名 */
  value: string
  direction: string
}

export interface OmenResult extends MeihuaCastingResult {
  omenTrigram: TrigramName
  directionTrigram: TrigramName
}

export function castByOmen(input: OmenInput, cal: CalendarContext): OmenResult {
  const omenTrigram = input.kind === 'color' ? COLOR_TO_TRIGRAM[input.value] : SYMBOL_TO_TRIGRAM[input.value]
  const directionTrigram = DIRECTION_TO_TRIGRAM[input.direction]
  if (!omenTrigram) throw new Error(`未知外应: ${input.kind}=${input.value}`)
  if (!directionTrigram) throw new Error(`未知方位: ${input.direction}`)

  const hourBranchNum = BRANCH_INDEX[cal.hourBranch]
  const upperNum = TRIGRAMS[omenTrigram].xiantianNumber
  const lowerNum = TRIGRAMS[directionTrigram].xiantianNumber
  const moving = mod6(upperNum + lowerNum + hourBranchNum) as 1 | 2 | 3 | 4 | 5 | 6

  return {
    upperTrigram: omenTrigram,
    lowerTrigram: directionTrigram,
    movingLine: moving,
    movingIndex0: moving - 1,
    castingRuleVersion: 'meihua_external_omen_v1',
    omenTrigram,
    directionTrigram,
    evidence: {
      source: 'omen',
      ruleVersion: 'meihua_external_omen_v1',
      raw: { ...input },
      normalized: { omenTrigram, directionTrigram, upperNum, lowerNum, hourBranchNum, moving },
      explanation: `外应"${input.value}"→${omenTrigram}，方位"${input.direction}"→${directionTrigram}；动爻mod6(${upperNum}+${lowerNum}+时支${hourBranchNum})=${moving}`
    }
  }
}
