/**
 * 统一出生历法 normalize（Phase 1）
 *
 * 无论输入是公历还是农历，都统一产出：
 * - solar：对应公历 Solar 对象
 * - lunar：对应农历 Lunar 对象
 * - sourceCalendar：原始输入历法
 * - wallClock：用户填写的墙上时钟分量（不做时区换算，八字按当地平太阳时墙上时钟排盘）
 *
 * 农历闰月：profile.lunarLeapMonth === true 时，月份传负数（如闰二月 = -2）。
 *
 * 以后 computeBaziOverview / computeDaYun / computeLiuNian / JingFang16 Source B
 * 全部复用此 helper，禁止每个模块自己写日期转换。
 */
import { Solar, Lunar } from 'lunar-javascript'
import type { BirthProfile } from '../types'

export interface NormalizedBirth {
  /** 对应公历 Solar 对象 */
  solar: Solar
  /** 对应农历 Lunar 对象 */
  lunar: Lunar
  /** 原始输入历法 */
  sourceCalendar: 'solar' | 'lunar'
  /** 用户填写的墙上时钟分量 */
  wallClock: {
    year: number
    month: number
    day?: number
    hour?: number
    minute?: number
  }
}

/**
 * 把 BirthProfile 归一化为 Solar + Lunar。
 *
 * 注意：八字排盘需要完整的年月日时。若 precision=year_month（无日），
 * 本函数仍会按 lunar-javascript 的要求构造一个完整日期用于取年/月柱，
 * 但调用方必须自行决定是否信任该结果（year_month 不伪造日，见 bazi/index.ts）。
 */
export function normalizeBirthProfile(profile: BirthProfile): NormalizedBirth {
  const { calendarType, year, month, day, hour, minute, lunarLeapMonth } = profile
  const h = hour ?? 0
  const m = minute ?? 0

  let solar: Solar
  let lunar: Lunar

  if (calendarType === 'lunar') {
    // 农历：闰月传负数
    const lunarMonth = lunarLeapMonth ? -Math.abs(month) : month
    const lunarDay = day ?? 1
    if (profile.precision === 'exact_time') {
      lunar = Lunar.fromYmdHms(year, lunarMonth, lunarDay, h, m, 0)
    } else {
      lunar = Lunar.fromYmd(year, lunarMonth, lunarDay)
    }
    solar = lunar.getSolar()
  } else {
    // 公历
    const solarDay = day ?? 1
    if (profile.precision === 'exact_time') {
      solar = Solar.fromYmdHms(year, month, solarDay, h, m, 0)
    } else {
      solar = Solar.fromYmd(year, month, solarDay)
    }
    lunar = solar.getLunar()
  }

  return {
    solar,
    lunar,
    sourceCalendar: calendarType,
    wallClock: {
      year,
      month,
      day,
      hour,
      minute
    }
  }
}
