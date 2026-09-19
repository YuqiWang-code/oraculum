import { describe, it, expect, afterAll } from 'vitest'
import { buildCalendarContext, wallTimeParts } from '../../src/engine/calendar/calendarEngine'

/**
 * Phase 17：历法时区与日界测试
 * 验证目标时区不受设备时区影响、子初换日、节气切换。
 */

const ORIG_TZ = process.env.TZ

afterAll(() => {
  process.env.TZ = ORIG_TZ
})

describe('目标时区独立性', () => {
  it('设备 TZ=Asia/Tokyo 时，指定 Asia/Shanghai 仍取上海墙上时间', () => {
    process.env.TZ = 'Asia/Tokyo'
    // 2026-09-19T15:00:00Z：上海 = 9-19 23:00，东京 = 9-20 00:00（跨日）
    const inst = new Date(Date.UTC(2026, 8, 19, 15, 0, 0))
    const sh = buildCalendarContext({ date: inst, timezone: 'Asia/Shanghai' })
    const tk = buildCalendarContext({ date: inst, timezone: 'Asia/Tokyo' })
    // 上海墙上时间应为 23:00
    const parts = wallTimeParts(inst, 'Asia/Shanghai')
    expect(parts.hour).toBe(23)
    expect(parts.day).toBe(19)
    // 目标时区字段原样返回
    expect(sh.timezone).toBe('Asia/Shanghai')
    // 上海与东京此时跨日，日柱应不同
    expect(sh.dayGanzhi).not.toBe(tk.dayGanzhi)
  })

  it('UTC 时区：墙上时间等于 UTC 分量', () => {
    const inst = new Date(Date.UTC(2024, 5, 15, 12, 30, 0))
    const cal = buildCalendarContext({ date: inst, timezone: 'UTC' })
    expect(cal.timezone).toBe('UTC')
    const parts = wallTimeParts(inst, 'UTC')
    expect(parts.hour).toBe(12)
    expect(parts.day).toBe(15)
    expect(cal.dayBoundaryRule).toBe('midnight')
  })
})

describe('子初换日（zi_hour）', () => {
  // 上海 UTC+8：22:59 上海 = 14:59 UTC；23:00 上海 = 15:00 UTC
  const t2259 = new Date(Date.UTC(2026, 8, 19, 14, 59, 0))
  const t2300 = new Date(Date.UTC(2026, 8, 19, 15, 0, 0))

  it('zi_hour：22:59 与 23:00 日柱不同（23:00 进次日）', () => {
    const before = buildCalendarContext({ date: t2259, timezone: 'Asia/Shanghai', dayBoundaryRule: 'zi_hour' })
    const after = buildCalendarContext({ date: t2300, timezone: 'Asia/Shanghai', dayBoundaryRule: 'zi_hour' })
    expect(before.dayGanzhi).not.toBe(after.dayGanzhi)
  })

  it('midnight：22:59 与 23:00 仍为同日（日柱相同）', () => {
    const before = buildCalendarContext({ date: t2259, timezone: 'Asia/Shanghai', dayBoundaryRule: 'midnight' })
    const after = buildCalendarContext({ date: t2300, timezone: 'Asia/Shanghai', dayBoundaryRule: 'midnight' })
    expect(before.dayGanzhi).toBe(after.dayGanzhi)
  })

  it('midnight：23:59 与次日 00:00 日柱不同（跨日）', () => {
    // 上海 23:59 = 15:59 UTC；次日 00:00 = 16:00 UTC
    const t2359 = new Date(Date.UTC(2026, 8, 19, 15, 59, 0))
    const t0000 = new Date(Date.UTC(2026, 8, 19, 16, 0, 0))
    const a = buildCalendarContext({ date: t2359, timezone: 'Asia/Shanghai', dayBoundaryRule: 'midnight' })
    const b = buildCalendarContext({ date: t0000, timezone: 'Asia/Shanghai', dayBoundaryRule: 'midnight' })
    expect(a.dayGanzhi).not.toBe(b.dayGanzhi)
  })

  it('zi_hour：23:59 已并入次日，与 00:00 同日（子初换日一致）', () => {
    // zi_hour 下 23:59 滚到次日 00:59；00:00 本就是次日，故二者同日柱
    const t2359 = new Date(Date.UTC(2026, 8, 19, 15, 59, 0))
    const t0000 = new Date(Date.UTC(2026, 8, 19, 16, 0, 0))
    const a = buildCalendarContext({ date: t2359, timezone: 'Asia/Shanghai', dayBoundaryRule: 'zi_hour' })
    const b = buildCalendarContext({ date: t0000, timezone: 'Asia/Shanghai', dayBoundaryRule: 'zi_hour' })
    expect(a.dayGanzhi).toBe(b.dayGanzhi)
  })
})

describe('节气边界', () => {
  it('2024 立春（2月4日）前后 solarTerm 切换：2/3=大寒，2/5=立春', () => {
    // 2024 立春交节为 2月4日，取前后两天避开具体交节时刻
    const before = buildCalendarContext({ date: new Date(2024, 1, 3, 12), timezone: 'Asia/Shanghai' })
    const after = buildCalendarContext({ date: new Date(2024, 1, 5, 12), timezone: 'Asia/Shanghai' })
    expect(before.solarTerm).toBe('大寒')
    expect(after.solarTerm).toBe('立春')
    expect(after.monthBoundaryJie).toBe('立春')
  })

  it('立春后月建为寅', () => {
    const after = buildCalendarContext({ date: new Date(2024, 1, 5, 12), timezone: 'Asia/Shanghai' })
    expect(after.monthBranch).toBe('寅')
  })
})
