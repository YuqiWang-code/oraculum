/**
 * 出生历法 normalize / validate 测试（v4.4）
 */
import { describe, it, expect } from 'vitest'
import {
  normalizeBirthProfile,
  validateBirthProfile,
  type BirthProfile
} from '../../src/engine/fortune'

function base(over: Partial<BirthProfile> = {}): BirthProfile {
  return {
    calendarType: 'solar', year: 2005, month: 12, day: 23, hour: 8, minute: 37,
    timezone: 'Asia/Shanghai', precision: 'exact_time',
    traditionalGenderParam: 'male', saveLocally: false,
    ...over
  }
}

describe('normalizeBirthProfile 公历', () => {
  it('公历输入 sourceCalendar=solar，solar 与 lunar 都非空', () => {
    const n = normalizeBirthProfile(base())
    expect(n.sourceCalendar).toBe('solar')
    expect(n.solar.getYear()).toBe(2005)
    expect(n.lunar).toBeTruthy()
  })
})

describe('normalizeBirthProfile 农历', () => {
  it('农历输入 sourceCalendar=lunar，solar 与 lunar 对应', () => {
    const n = normalizeBirthProfile(base({ calendarType: 'lunar', year: 2005, month: 11, day: 23 }))
    expect(n.sourceCalendar).toBe('lunar')
    // 农历回读月份一致
    expect(n.lunar.getMonth()).toBe(11)
  })

  it('闰月用负数传入，回读为负', () => {
    const n = normalizeBirthProfile(base({
      calendarType: 'lunar', year: 2025, month: 6, day: 1,
      lunarLeapMonth: true
    }))
    // 2025 年闰六月
    expect(n.lunar.getMonth()).toBe(-6)
  })
})

describe('validateBirthProfile', () => {
  it('合法公历通过', () => {
    expect(validateBirthProfile(base({ precision: 'date', hour: undefined, minute: undefined })).ok).toBe(true)
  })
  it('2025-02-31 拒绝', () => {
    const r = validateBirthProfile(base({ month: 2, day: 31, precision: 'date', hour: undefined, minute: undefined }))
    expect(r.ok).toBe(false)
    expect(r.field).toBe('day')
  })
  it('2025-04-31 拒绝（4月只有30天）', () => {
    const r = validateBirthProfile(base({ month: 4, day: 31, precision: 'date', hour: undefined, minute: undefined }))
    expect(r.ok).toBe(false)
  })
  it('闰月选了该年没有的月份 -> 拒绝', () => {
    const r = validateBirthProfile(base({
      calendarType: 'lunar', year: 2025, month: 5, day: 1,
      lunarLeapMonth: true, precision: 'date', hour: undefined, minute: undefined
    }))
    expect(r.ok).toBe(false)
  })
  it('2025 年正常闰六月 -> 通过', () => {
    const r = validateBirthProfile(base({
      calendarType: 'lunar', year: 2025, month: 6, day: 1,
      lunarLeapMonth: true, precision: 'date', hour: undefined, minute: undefined
    }))
    expect(r.ok).toBe(true)
  })
  it('hour=24 拒绝', () => {
    const r = validateBirthProfile(base({ hour: 24 }))
    expect(r.ok).toBe(false)
  })
  it('minute=60 拒绝', () => {
    const r = validateBirthProfile(base({ minute: 60 }))
    expect(r.ok).toBe(false)
  })
  it('year=1800 超出范围拒绝', () => {
    const r = validateBirthProfile(base({ year: 1800 }))
    expect(r.ok).toBe(false)
  })
  it('year_month 无 day 通过', () => {
    const r = validateBirthProfile(base({ precision: 'year_month', day: undefined, hour: undefined, minute: undefined }))
    expect(r.ok).toBe(true)
  })
})
