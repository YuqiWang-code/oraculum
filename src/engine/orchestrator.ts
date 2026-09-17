import type { CalendarContext, CastingEvidence, DivinationInput, Interpretation, Rating } from '../types'
import { RULESET_VERSION, DATASET_VERSION } from '../types'
import { buildCalendarContext } from './calendar/calendarEngine'
import { castMeihuaByTime, MeihuaResult } from './meihua/castByTime'
import { scoreMeihua } from './scoring/scoreMeihua'
import { interpretMeihua } from './interpretation/interpretMeihua'
import { buildLiuyao, LiuYaoResult } from './liuyao/layout'
import { scoreLiuyao } from './liuyao/scoreLiuyao'
import { interpretLiuyao } from './liuyao/interpretLiuyao'
import { relationOfElement } from '../data/trigrams'
import { BRANCH_INDEX } from '../data/solarTerms'
import { buildMeihuaFromTrigrams, MeihuaCastingResult } from './casting/common'
import { castBySecondTime } from './casting/castBySecondTime'
import { castByRandomNumbers, RandomResult } from './casting/castByRandomNumbers'
import { castByDice, DiceResult } from './casting/castByDice'
import { castByText, TextResult } from './casting/castByText'
import { castByOmen, OmenResult } from './casting/castByExternalOmen'
import { castBySixSources, SixSourceResult } from './casting/castBySixSources'
import type { SecondTimeResult } from './casting/castBySecondTime'
import type { CoinThrow } from './casting/castByCoins'
import { throwsToLines, throwsExplanation } from './casting/castByCoins'
import { parseLocalDateTime } from '../utils/datetime'

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
  castingRuleVersion?: string
  castingEvidence?: CastingEvidence[]
  /** 六源合参专用 */
  sixSource?: {
    payload: unknown
    canonical: string
    h1: number
    h2: number
    h3: number
  }
  createdAt: string
}

/** 把任意梅花 caster 的结果组装成评分/解读可用的完整 MeihuaResult */
function finalizeMeihua(
  c: MeihuaCastingResult & Partial<MeihuaResult>,
  cal: CalendarContext
): MeihuaResult {
  const built = buildMeihuaFromTrigrams(c.upperTrigram, c.lowerTrigram, c.movingLine)
  const relation = relationOfElement(built.tiElement, built.yongElement)
  return {
    ...(c as object),
    ...built,
    relation,
    ruleVersion: c.castingRuleVersion,
    annualBranchNum: BRANCH_INDEX[cal.yearBranch],
    lunarMonth: cal.lunarMonth,
    lunarDay: cal.lunarDay,
    hourBranchNum: BRANCH_INDEX[cal.hourBranch]
  } as unknown as MeihuaResult
}

function finishMeihua(
  input: DivinationInput,
  cal: CalendarContext,
  caster: MeihuaCastingResult & Partial<MeihuaResult>,
  useShensha: boolean
): DivinationRecord {
  const meihua = finalizeMeihua(caster, cal)
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
    castingRuleVersion: caster.castingRuleVersion,
    castingEvidence: [caster.evidence],
    createdAt: input.createdAt
  }
}

/** v1 旧时间起卦（保留兼容，行为不变） */
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
    castingRuleVersion: 'meihua_time_v1',
    createdAt: input.createdAt
  }
}

/** 秒级时间起卦 v2 */
export function runMeihuaSecondTime(input: DivinationInput, useShensha: boolean): DivinationRecord {
  const cal = buildCalendarContext({ date: input.castTime, timezone: input.timezone })
  const date = parseLocalDateTime(input.castTime)
  const caster: SecondTimeResult = castBySecondTime(cal, date)
  return finishMeihua(input, cal, caster, useShensha)
}

/** 随机数起卦 */
export function runMeihuaRandom(input: DivinationInput, numbers: [number, number, number], useShensha: boolean): DivinationRecord {
  const cal = buildCalendarContext({ date: input.castTime, timezone: input.timezone })
  const caster: RandomResult = castByRandomNumbers(numbers)
  return finishMeihua(input, cal, caster, useShensha)
}

/** 骰子起卦 */
export function runMeihuaDice(input: DivinationInput, upperD8: number, lowerD8: number, movingD6: number, useShensha: boolean): DivinationRecord {
  const cal = buildCalendarContext({ date: input.castTime, timezone: input.timezone })
  const caster: DiceResult = castByDice(upperD8, lowerD8, movingD6)
  return finishMeihua(input, cal, caster, useShensha)
}

/** 文字起卦 */
export function runMeihuaText(input: DivinationInput, text: string, useShensha: boolean): DivinationRecord {
  const cal = buildCalendarContext({ date: input.castTime, timezone: input.timezone })
  const caster: TextResult = castByText(text)
  return finishMeihua(input, cal, caster, useShensha)
}

/** 外应起卦 */
export function runMeihuaOmen(input: DivinationInput, omen: { kind: 'color' | 'symbol'; value: string; direction: string }, useShensha: boolean): DivinationRecord {
  const cal = buildCalendarContext({ date: input.castTime, timezone: input.timezone })
  const caster: OmenResult = castByOmen(omen, cal)
  return finishMeihua(input, cal, caster, useShensha)
}

/** 六源合参 */
export function runSixSourceHybrid(input: DivinationInput, payload: import('../types').SixSourcePayload, useShensha: boolean): DivinationRecord {
  const cal = buildCalendarContext({ date: input.castTime, timezone: input.timezone })
  const caster: SixSourceResult = castBySixSources(payload)
  const rec = finishMeihua(input, cal, caster, useShensha)
  rec.sixSource = { payload, canonical: caster.canonical, h1: caster.h1, h2: caster.h2, h3: caster.h3 }
  return rec
}

/** 六爻排盘完整流程（由给定六爻+动爻） */
export function runLiuyao(
  input: DivinationInput,
  lines: number[],
  movingMask: boolean[],
  useShensha: boolean,
  throws?: CoinThrow[]
): DivinationRecord {
  const cal = buildCalendarContext({ date: input.castTime, timezone: input.timezone })
  const liuyao = buildLiuyao(lines as 0[], movingMask, cal)
  const rating = scoreLiuyao(liuyao, cal.monthBranch, cal.dayBranch, useShensha)
  const { interpretation, usefulGodReason } = interpretLiuyao(liuyao, rating, input.category)

  const evidence: CastingEvidence[] = []
  if (throws) {
    evidence.push({
      source: 'coins',
      ruleVersion: 'liuyao_three_coins_v1',
      raw: throws,
      normalized: { throws },
      explanation: throwsExplanation(throws)
    })
  }

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
    castingRuleVersion: throws ? 'liuyao_three_coins_v1' : 'manual_hexagram',
    castingEvidence: evidence,
    createdAt: input.createdAt
  }
}
