import type { CalendarContext } from '../../types'
import { BRANCH_INDEX } from '../../data/solarTerms'
import { mod8, mod6, buildMeihuaFromTrigrams, MeihuaCastingResult } from './common'
import type { TrigramName } from '../../types'
import { TRIGRAM_BY_NUMBER } from '../../data/trigrams'

/**
 * 秒级时间起卦 meihua_time_second_v2（资料 v2 第3节）
 * A = 年支数 + 农历月 + 农历日
 * B = A + 时支数
 * P = 分钟*60 + 秒
 * 上卦 = mod8(A)，下卦 = mod8(B+P)，动爻 = mod6(B+P)
 * 注意：秒级部分为本项目现代扩展，不冒充古籍原始年月日时算法。
 */
export interface SecondTimeResult extends MeihuaCastingResult {
  minute: number
  second: number
  secondOfHour: number
  traditionalBaseA: number
  traditionalBaseB: number
}

export function castBySecondTime(cal: CalendarContext, date: Date): SecondTimeResult {
  const annualBranchNum = BRANCH_INDEX[cal.yearBranch]
  const M = cal.lunarMonth
  const D = cal.lunarDay
  const hourBranchNum = BRANCH_INDEX[cal.hourBranch]

  const A = annualBranchNum + M + D
  const B = A + hourBranchNum

  const minute = date.getMinutes()
  const second = date.getSeconds()
  const secondOfHour = minute * 60 + second
  const P = secondOfHour

  const upperNum = mod8(A)
  const lowerNum = mod8(B + P)
  const moving = mod6(B + P) as 1 | 2 | 3 | 4 | 5 | 6

  const upper: TrigramName = TRIGRAM_BY_NUMBER[upperNum]
  const lower: TrigramName = TRIGRAM_BY_NUMBER[lowerNum]

  return {
    upperTrigram: upper,
    lowerTrigram: lower,
    movingLine: moving,
    movingIndex0: moving - 1,
    castingRuleVersion: 'meihua_time_second_v2',
    minute, second, secondOfHour,
    traditionalBaseA: A,
    traditionalBaseB: B,
    evidence: {
      source: 'time',
      ruleVersion: 'meihua_time_second_v2',
      raw: { minute, second, secondOfHour, A, B },
      normalized: { upperNum, lowerNum, moving },
      explanation: `A=年支${annualBranchNum}+农历${M}月${D}日=${A}；B=A+时支${hourBranchNum}=${B}；P=分秒=${P}；上卦mod8(A)=${upperNum}，下卦mod8(B+P)=${lowerNum}，动爻mod6(B+P)=${moving}`
    }
  }
}
