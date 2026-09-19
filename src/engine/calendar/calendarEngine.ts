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

/** 目标时区墙上时间分量 */
export interface WallTimeParts {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}

/**
 * 用 Intl.DateTimeFormat 提取某 instant 在目标时区的墙上时间分量。
 */
export function wallTimeParts(localDate: Date, timezone: string): WallTimeParts {
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
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour,
    minute: get('minute'),
    second: get('second')
  }
}

/**
 * 将目标时区墙上时间分量构造成一个 Date。
 * 该 Date 的 UTC 毫秒值对应"目标时区墙上时间"，
 * 因此 getUTC*() 取出的就是目标时区墙上时间分量。
 */
export function wallTimeInTimezone(localDate: Date, timezone: string): Date {
  const p = wallTimeParts(localDate, timezone)
  return new Date(Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second))
}

/** 从 Date.UTC 构造的 Date 中取出墙上时间分量 */
function partsFromUtcDate(dt: Date): WallTimeParts {
  return {
    year: dt.getUTCFullYear(),
    month: dt.getUTCMonth() + 1,
    day: dt.getUTCDate(),
    hour: dt.getUTCHours(),
    minute: dt.getUTCMinutes(),
    second: dt.getUTCSeconds()
  }
}

/**
 * 解析 lunar-javascript toYmdHms() 输出的 "YYYY-MM-DD HH:mm:ss" 为
 * 与 wallTimeInTimezone 一致的墙上时间毫秒（Date.UTC 分量）。
 */
function termStringToWallMs(str: string): number {
  const [datePart, timePart] = str.split(' ')
  const [y, mo, da] = datePart.split('-').map(Number)
  const [h, mi, s] = (timePart || '00:00:00').split(':').map(Number)
  return Date.UTC(y, mo - 1, da, h, mi, s)
}

export function buildCalendarContext(input: CalendarInput): CalendarContext {
  const raw = typeof input.date === 'string' ? new Date(input.date) : input.date
  const dayBoundary: DayBoundaryRule = input.dayBoundaryRule || 'midnight'

  // 按指定时区获取墙上时间分量，直接交给 Solar.fromYmdHms，
  // 避免中间 Date 被 Solar.fromDate 再次按浏览器本地时区解释。
  const parts = wallTimeParts(raw, input.timezone)
  const d = wallTimeInTimezone(raw, input.timezone)
  const solar = Solar.fromYmdHms(parts.year, parts.month, parts.day, parts.hour, parts.minute, parts.second)
  const lunar = solar.getLunar()

  let yearGanzhi = lunar.getYearInGanZhi()
  let monthGanzhi = lunar.getMonthInGanZhi()
  let dayGanzhi = lunar.getDayInGanZhi()
  let hourGanzhi = lunar.getTimeInGanZhi()

  // 子初换日：23:00 起算次日（日柱和时柱都进次日）
  // d 是 Date.UTC 构造的，其 UTC 分量 == 目标时区墙上时间分量
  if (dayBoundary === 'zi_hour') {
    const hour24 = d.getUTCHours()
    if (hour24 >= 23) {
      // 加一小时的墙上时间，重新取干支
      const next = new Date(d.getTime() + 3600 * 1000)
      const np = partsFromUtcDate(next)
      const solarNext = Solar.fromYmdHms(np.year, np.month, np.day, np.hour, np.minute, np.second)
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
    let bestAll: { name: string; at: number; str: string } | null = null
    let bestJie: { name: string; at: number; str: string } | null = null
    let next: { at: number; str: string } | null = null
    for (const name of Object.keys(table)) {
      // 只处理标准24节气名
      if (!(SOLAR_TERMS as readonly string[]).includes(name)) continue
      const str = table[name].toYmdHms()
      // 节气时间已是目标时区墙上时间，按与 d 相同的 Date.UTC 分量方式比较，
      // 不用 new Date(str)（会被浏览器本地时区解释）。
      const at = termStringToWallMs(str)
      if (at <= nowMs) {
        if (!bestAll || at > bestAll.at) bestAll = { name, at, str }
        if (isJieTerm(name) && (!bestJie || at > bestJie.at)) {
          bestJie = { name, at, str }
        }
      } else {
        if (!next || at < next.at) next = { at, str }
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
