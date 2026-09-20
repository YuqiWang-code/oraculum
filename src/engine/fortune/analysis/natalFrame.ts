/**
 * 原局框架 helper（Phase 14）
 *
 * 从 BirthProfile 计算八字框架：日主天干 + 原局四支。
 * 供十神与地支冲合分析复用。
 */
import { normalizeBirthProfile } from '../birth/normalizeBirthProfile'
import type { BirthProfile } from '../types'

export interface NatalFrame {
  /** 日主天干（日干单字） */
  dayGan: string
  /** 日主阴阳 */
  dayGanYinYang: '阳' | '阴'
  /** 原局四支（年/月/日/时地支单字） */
  natalBranches: string[]
  /** 完整四柱干支 */
  pillars: {
    year: string
    month: string
    day: string
    time: string
  }
}

/** 把"戊子"拆成 ['戊','子'] */
export function splitGanZhi(ganzhi: string): [string, string] {
  const gz = ganzhi.trim()
  if (gz.length < 2) return ['', '']
  return [gz[0], gz[1]]
}

/** 计算原局八字框架（需要 exact_time 才有时支；否则时支为空） */
export function computeNatalFrame(profile: BirthProfile): NatalFrame | null {
  // 至少需要日柱才能取日干；year_month 无日柱，不做十神分析
  if (profile.precision === 'year_month') return null

  const { lunar } = normalizeBirthProfile(profile)
  const ec = lunar.getEightChar()
  // 晚子时日界
  ec.setSect(profile.daySect ?? 2)

  const dayGan = ec.getDayGan()
  const natalBranches = [
    ec.getYearZhi(),
    ec.getMonthZhi(),
    ec.getDayZhi(),
    profile.precision === 'exact_time' ? ec.getTimeZhi() : ''
  ].filter(Boolean)

  return {
    dayGan,
    dayGanYinYang: (dayGan === '甲' || dayGan === '丙' || dayGan === '戊' || dayGan === '庚' || dayGan === '壬') ? '阳' : '阴',
    natalBranches,
    pillars: {
      year: `${ec.getYearGan()}${ec.getYearZhi()}`,
      month: `${ec.getMonthGan()}${ec.getMonthZhi()}`,
      day: `${ec.getDayGan()}${ec.getDayZhi()}`,
      time: profile.precision === 'exact_time' ? `${ec.getTimeGan()}${ec.getTimeZhi()}` : ''
    }
  }
}
