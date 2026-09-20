/**
 * 出生资料校验（Phase 1 / Phase 7）
 *
 * 覆盖：
 * - 公历有效日期（如 2025-02-31 必须报"2025年2月没有31日"）
 * - 农历有效日期
 * - 闰月合法性（该年无闰月时选闰月必须报错）
 * - 年份范围
 * - hour 0-23、minute 0-59
 */
import { Lunar, LunarYear } from 'lunar-javascript'
import type { BirthProfile } from '../types'

export interface ValidationResult {
  ok: boolean
  field?: string
  message: string
}

const MIN_YEAR = 1900
const MAX_YEAR = 2100

/** 公历某年某月的天数 */
function solarDaysInMonth(year: number, month: number): number {
  // month: 1-12
  return new Date(year, month, 0).getDate()
}

function fail(field: string, message: string): ValidationResult {
  return { ok: false, field, message }
}

function ok(): ValidationResult {
  return { ok: true, message: '' }
}

/**
 * 校验出生资料。返回第一个错误；全部通过返回 ok。
 */
export function validateBirthProfile(profile: BirthProfile): ValidationResult {
  const { year, month, day, hour, minute, calendarType, lunarLeapMonth, precision } = profile

  // 年份
  if (!Number.isFinite(year)) {
    return fail('year', '请填写出生年份。')
  }
  if (year < MIN_YEAR || year > MAX_YEAR) {
    return fail('year', `出生年份需在 ${MIN_YEAR}-${MAX_YEAR} 之间。`)
  }

  // 月份
  if (!Number.isFinite(month) || month < 1 || month > 12) {
    return fail('month', '出生月份需在 1-12 之间。')
  }

  // 小时 / 分钟
  if (hour != null) {
    if (!Number.isFinite(hour) || hour < 0 || hour > 23) {
      return fail('hour', '出生小时需在 0-23 之间。')
    }
  }
  if (minute != null) {
    if (!Number.isFinite(minute) || minute < 0 || minute > 59) {
      return fail('minute', '出生分钟需在 0-59 之间。')
    }
  }

  // 精度与字段一致性
  if (precision === 'date' || precision === 'exact_time') {
    if (day == null || !Number.isFinite(day) || day < 1) {
      return fail('day', '该精度需要填写出生日。')
    }
  }
  if (precision === 'exact_time' && hour == null) {
    return fail('hour', '精确时间需要填写出生时辰。')
  }

  // 公历日校验
  if (calendarType === 'solar' && day != null && Number.isFinite(day)) {
    const dim = solarDaysInMonth(year, month)
    if (day < 1 || day > dim) {
      return fail('day', `${year}年${month}月没有${day}日（该月共 ${dim} 天）。`)
    }
  }

  // 农历校验
  if (calendarType === 'lunar') {
    // 闰月合法性
    if (lunarLeapMonth === true) {
      let leapMonth = 0
      try {
        leapMonth = LunarYear.fromYear(year).getLeapMonth()
      } catch {
        return fail('lunarLeapMonth', '无法确认该年闰月信息，请检查年份。')
      }
      if (leapMonth !== month) {
        if (leapMonth === 0) {
          return fail('lunarLeapMonth', `${year}年没有闰月，不能选择"闰${month}月"。`)
        }
        return fail('lunarLeapMonth', `${year}年的闰月是闰${leapMonth}月，不是闰${month}月。`)
      }
    }

    // 农历日校验（有日时才校验）
    if (day != null && Number.isFinite(day)) {
      const lunarMonth = lunarLeapMonth ? -Math.abs(month) : month
      try {
        const lunar = Lunar.fromYmd(year, lunarMonth, day)
        // 回读校验：lunar-javascript 对越界日可能自动进位，需比对
        if (lunar.getMonth() !== lunarMonth || lunar.getDay() !== day) {
          return fail('day', `${year}年农历${lunarLeapMonth ? '闰' : ''}${month}月没有${day}日。`)
        }
      } catch {
        return fail('day', `${year}年农历${lunarLeapMonth ? '闰' : ''}${month}月${day}日无效。`)
      }
    }
  }

  return ok()
}
