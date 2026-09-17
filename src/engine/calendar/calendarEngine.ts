import { Solar } from 'lunar-javascript'
import type { CalendarContext } from '../../types'
import { xunKongFromDay, JIE_TO_MONTH_BRANCH } from '../../data/solarTerms'

/**
 * 历法引擎（资料第4节）
 * 业务代码只调用本模块，不直接散落调用 lunar-javascript。
 */

/** 判断某节气名是否为"节令"（换月之用）而非中气 */
function isJieTerm(name: string): boolean {
  return name in JIE_TO_MONTH_BRANCH
}

export interface CalendarInput {
  date: Date | string
  timezone: string
}

export function buildCalendarContext(input: CalendarInput): CalendarContext {
  const d = typeof input.date === 'string' ? new Date(input.date) : input.date
  const solar = Solar.fromDate(d)
  const lunar = solar.getLunar()

  const yearGanzhi = lunar.getYearInGanZhi()
  const monthGanzhi = lunar.getMonthInGanZhi()
  const dayGanzhi = lunar.getDayInGanZhi()
  const hourGanzhi = lunar.getTimeInGanZhi()

  const yearBranch = yearGanzhi[1]
  const dayStem = dayGanzhi[0]
  const dayBranch = dayGanzhi[1]
  const hourBranch = hourGanzhi[1]
  const monthBranch = monthGanzhi[1]

  // 当前节气：用全年节气表，找最近一个 <= now 的"节令"
  let currentTerm = ''
  let prevTermAt = ''
  let nextTermAt = ''
  try {
    const table = lunar.getJieQiTable() as Record<string, { toYmdHms(): string }>
    const nowMs = d.getTime()
    let best: { name: string; at: Date; str: string } | null = null
    let next: { at: Date; str: string } | null = null
    for (const name of Object.keys(table)) {
      if (!isJieTerm(name)) continue
      const str = table[name].toYmdHms()
      const at = new Date(str.replace(' ', 'T'))
      if (at.getTime() <= nowMs) {
        if (!best || at.getTime() > best.at.getTime()) best = { name, at, str }
      } else {
        if (!next || at.getTime() < next.at.getTime()) next = { at, str }
      }
    }
    if (best) {
      currentTerm = best.name
      prevTermAt = best.str
    }
    if (next) nextTermAt = next.str
  } catch {
    currentTerm = ''
  }

  const xunKong = xunKongFromDay(dayGanzhi)

  return {
    localDateTime: d.toISOString(),
    timezone: input.timezone,
    lunarDate: `农历${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
    yearGanzhi,
    monthGanzhi,
    dayGanzhi,
    hourGanzhi,
    solarTerm: currentTerm,
    prevSolarTermAt: prevTermAt,
    nextSolarTermAt: nextTermAt,
    monthBranch,
    dayStem,
    dayBranch,
    hourBranch,
    yearBranch,
    lunarMonth: lunar.getMonth(),
    lunarDay: lunar.getDay(),
    xunKong
  }
}
