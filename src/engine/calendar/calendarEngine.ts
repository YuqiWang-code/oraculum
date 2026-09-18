import { Solar } from 'lunar-javascript'
import type { CalendarContext, DayBoundaryRule } from '../../types'
import { xunKongFromDay, JIE_TO_MONTH_BRANCH, SOLAR_TERMS } from '../../data/solarTerms'

/**
 * 历法引擎（资料第4节）
 * 业务代码只调用本模块，不直接散落调用 lunar-javascript。
 *
 * v3.1 修复：
 * - timezone 真正参与计算：将墙上时钟转为目标时区的 Date 再交给 Solar。
 * - dayBoundaryRule：'midnight' 现代公历日界；'zi_hour' 传统子初换日（23:00 起算次日）。
 * - currentSolarTerm 返回完整24节气；monthBoundaryJie 只返回12个节令（换月之用）。
 */

/** 判断某节气名是否为"节令"（换月之用）而非中气 */
function isJieTerm(name: string): boolean {
  return name in JIE_TO_MONTH_BRANCH
}

export interface CalendarInput {
  date: Date | string
  timezone: string
  dayBoundaryRule?: DayBoundaryRule
}

/**
 * 将本地墙上时间字符串按指定 IANA 时区解释为 Date。
 * 对于 Asia/Shanghai / UTC 等常用时区，用 Intl 反推偏移。
 */
export function wallTimeInTimezone(localDate: Date, timezone: string): Date {
  // 用 Intl.DateTimeFormat 拿到该时区此刻的墙上时间各分量
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
  const parts = dtf.formatToParts(localDate)
  const get = (type: string) => parseInt(parts.find((p) => p.type === type)!.value, 10)
  let hour = get('hour')
  if (hour === 24) hour = 0 // Intl 在某些浏览器返回 24
  // 这个 Date 的"本地墙上时间"分量等于目标时区的墙上时间
  // Solar.fromDate 会按 JS Date 的 UTC 毫秒解析；我们需要构造一个 Date，
  // 其 UTC 毫秒值对应"目标时区墙上时间"。
  // 方法：直接用 new Date(year, month-1, day, hour, min, sec) — 这是本地时区时间，
  // 然后 getTime() 返回该墙上时间对应的 UTC 毫秒。
  // 但这会受运行环境本地时区影响。更可靠的做法：
  // 计算目标时区与 UTC 的偏移，然后用 UTC 分量构造。
  const utcMs = Date.UTC(get('year'), get('month') - 1, get('day'), hour, get('minute'), get('second'))
  return new Date(utcMs)
}

export function buildCalendarContext(input: CalendarInput): CalendarContext {
  const raw = typeof input.date === 'string' ? new Date(input.date) : input.date
  const dayBoundary: DayBoundaryRule = input.dayBoundaryRule || 'midnight'

  // 按指定时区获取墙上时间对应的 Date
  const d = wallTimeInTimezone(raw, input.timezone)
  const solar = Solar.fromDate(d)
  const lunar = solar.getLunar()

  let yearGanzhi = lunar.getYearInGanZhi()
  let monthGanzhi = lunar.getMonthInGanZhi()
  let dayGanzhi = lunar.getDayInGanZhi()
  let hourGanzhi = lunar.getTimeInGanZhi()

  // 子初换日：23:00 起算次日（日柱和时柱都进次日）
  if (dayBoundary === 'zi_hour') {
    const hour24 = d.getUTCHours()
    if (hour24 >= 23) {
      // 加一天的 Date，重新取干支
      const next = new Date(d.getTime() + 3600 * 1000)
      const solarNext = Solar.fromDate(next)
      const lunarNext = solarNext.getLunar()
      dayGanzhi = lunarNext.getDayInGanZhi()
      hourGanzhi = lunarNext.getTimeInGanZhi()
      yearGanzhi = lunarNext.getYearInGanZhi()
      monthGanzhi = lunarNext.getMonthInGanZhi()
    }
  }

  const yearBranch = yearGanzhi[1]
  const dayStem = dayGanzhi[0]
  const dayBranch = dayGanzhi[1]
  const hourBranch = hourGanzhi[1]
  const monthBranch = monthGanzhi[1]

  // 当前节气：找最近一个 <= now 的节气（全部24个）
  let currentSolarTerm = ''
  let monthBoundaryJie = ''
  let prevTermAt = ''
  let nextTermAt = ''
  try {
    const table = lunar.getJieQiTable() as Record<string, { toYmdHms(): string }>
    const nowMs = d.getTime()
    let bestAll: { name: string; at: Date; str: string } | null = null
    let bestJie: { name: string; at: Date; str: string } | null = null
    let next: { at: Date; str: string } | null = null
    for (const name of Object.keys(table)) {
      // 只处理标准24节气名
      if (!(SOLAR_TERMS as readonly string[]).includes(name)) continue
      const str = table[name].toYmdHms()
      const at = new Date(str.replace(' ', 'T'))
      if (at.getTime() <= nowMs) {
        if (!bestAll || at.getTime() > bestAll.at.getTime()) bestAll = { name, at, str }
        if (isJieTerm(name) && (!bestJie || at.getTime() > bestJie.at.getTime())) {
          bestJie = { name, at, str }
        }
      } else {
        if (!next || at.getTime() < next.at.getTime()) next = { at, str }
      }
    }
    if (bestAll) {
      currentSolarTerm = bestAll.name
      prevTermAt = bestAll.str
    }
    if (bestJie) {
      monthBoundaryJie = bestJie.name
    }
    if (next) nextTermAt = next.str
  } catch {
    currentSolarTerm = ''
  }

  const xunKong = xunKongFromDay(dayGanzhi)

  return {
    localDateTime: raw.toISOString(),
    timezone: input.timezone,
    dayBoundaryRule: dayBoundary,
    lunarDate: `农历${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
    yearGanzhi,
    monthGanzhi,
    dayGanzhi,
    hourGanzhi,
    solarTerm: currentSolarTerm,
    monthBoundaryJie,
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
