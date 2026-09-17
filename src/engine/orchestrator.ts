import type { CalendarContext, DivinationInput, Interpretation, Rating } from '../types'
import { RULESET_VERSION, DATASET_VERSION } from '../types'
import { buildCalendarContext } from './calendar/calendarEngine'
import { castMeihuaByTime, MeihuaResult } from './meihua/castByTime'
import { scoreMeihua } from './scoring/scoreMeihua'
import { interpretMeihua } from './interpretation/interpretMeihua'
import { buildLiuyao, LiuYaoResult } from './liuyao/layout'
import { scoreLiuyao } from './liuyao/scoreLiuyao'
import { interpretLiuyao } from './liuyao/interpretLiuyao'

export const DISCLAIMER = '传统文化研究与娱乐用途；重要现实决定请依据事实和专业意见。'

export interface DivinationRecord {
  id: string
  ruleVersion: string
  datasetVersion: string
  input: DivinationInput
  calendar: CalendarContext
  meihua?: MeihuaResult
  liuyao?: LiuYaoResult
  rating: Rating
  interpretation: Interpretation
  usefulGodReason?: string
  createdAt: string
}

/** 梅花时间起卦完整流程 */
export function runMeihuaTime(input: DivinationInput, useShensha: boolean): DivinationRecord {
  const cal = buildCalendarContext({ date: input.castTime, timezone: input.timezone })
  const meihua = castMeihuaByTime(cal)
  const rating = scoreMeihua(meihua, cal.monthBranch)
  const interpretation = interpretMeihua(meihua, rating, input.category)

  return {
    id: input.id,
    ruleVersion: RULESET_VERSION,
    datasetVersion: DATASET_VERSION,
    input,
    calendar: cal,
    meihua,
    rating,
    interpretation,
    createdAt: input.createdAt
  }
}

/** 六爻排盘完整流程（由给定六爻+动爻） */
export function runLiuyao(
  input: DivinationInput,
  lines: number[],
  movingMask: boolean[],
  useShensha: boolean
): DivinationRecord {
  const cal = buildCalendarContext({ date: input.castTime, timezone: input.timezone })
  const liuyao = buildLiuyao(lines as 0[], movingMask, cal)
  const rating = scoreLiuyao(liuyao, cal.monthBranch, cal.dayBranch, useShensha)
  const { interpretation, usefulGodReason } = interpretLiuyao(liuyao, rating, input.category)

  return {
    id: input.id,
    ruleVersion: RULESET_VERSION,
    datasetVersion: DATASET_VERSION,
    input,
    calendar: cal,
    liuyao,
    rating,
    interpretation,
    usefulGodReason,
    createdAt: input.createdAt
  }
}
