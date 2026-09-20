/**
 * 八字 / 大运 / 流年引擎
 * 使用 lunar-javascript（当前已安装版本 ^1.6.13）。
 * 不升级依赖，不引入模型权重。
 *
 * 输入精度必须诚实：
 * - year_month → 仅年月二柱，不称完整八字
 * - date → 年/月/日三柱，时柱未知，不偷偷填 00:00
 * - exact_time → 完整四柱 + 大运 + 流年
 *
 * traditionalGenderParam:
 * - male → 1
 * - female → 0
 * - unspecified → 不猜，不计算传统精确大运
 */
import { Solar } from 'lunar-javascript'
import type {
  BirthProfile,
  BaziPillars,
  BaziOverview,
  DaYunEntry,
  LiuNianEntry,
  FortuneSourceLayer
} from '../types'

const BAZI_SOURCE: FortuneSourceLayer = 'bazi-yun'

/**
 * 计算八字概览
 * 根据出生精度返回对应柱数，不伪造缺失的时柱。
 */
export function computeBaziOverview(profile: BirthProfile): BaziOverview {
  const { precision, year, month, day, hour, minute, traditionalGenderParam } = profile

  // 只有年月：仅年月二柱
  if (precision === 'year_month') {
    // 用年月日中的日=1来获取年月柱（lunar-javascript 需要完整日期）
    const solar = Solar.fromYmd(year, month, 1)
    const lunar = solar.getLunar()
    const ec = lunar.getEightChar()
    return {
      pillars: {
        year: `${ec.getYearGan()}${ec.getYearZhi()}`,
        month: `${ec.getMonthGan()}${ec.getMonthZhi()}`
      },
      precision: 'year_month',
      precisionNote: '仅提供出生年月，展示年月二柱。完整八字需要出生日和时辰。'
    }
  }

  // 年月日（无时辰）：三柱，时柱未知
  if (precision === 'date') {
    const d = day ?? 1
    const solar = Solar.fromYmd(year, month, d)
    const lunar = solar.getLunar()
    const ec = lunar.getEightChar()
    return {
      pillars: {
        year: `${ec.getYearGan()}${ec.getYearZhi()}`,
        month: `${ec.getMonthGan()}${ec.getMonthZhi()}`,
        day: `${ec.getDayGan()}${ec.getDayZhi()}`
      },
      precision: 'date',
      precisionNote: '提供出生年月日但无时辰，展示三柱，时柱未知。大运和流年需要完整出生时辰。'
    }
  }

  // exact_time：完整四柱
  const h = hour ?? 0
  const m = minute ?? 0
  const d = day ?? 1
  const solar = Solar.fromYmdHms(year, month, d, h, m, 0)
  const lunar = solar.getLunar()
  const ec = lunar.getEightChar()

  const pillars: BaziPillars = {
    year: `${ec.getYearGan()}${ec.getYearZhi()}`,
    month: `${ec.getMonthGan()}${ec.getMonthZhi()}`,
    day: `${ec.getDayGan()}${ec.getDayZhi()}`,
    hour: `${ec.getTimeGan()}${ec.getTimeZhi()}`
  }

  const overview: BaziOverview = {
    pillars,
    precision: 'exact_time',
    precisionNote: '完整出生年月日时，展示四柱。'
  }

  // 只有 gender 非 unspecified 才计算起运
  if (traditionalGenderParam !== 'unspecified') {
    const genderCode = traditionalGenderParam === 'male' ? 1 : 0
    const yun = ec.getYun(genderCode)
    const startYear = yun.getStartYear()
    const startSolar = yun.getStartSolar()
    const direction: '顺' | '逆' = genderCode === 1 ? '顺' : '逆'

    overview.qiYun = {
      startAge: startYear,
      startDate: startSolar.toYmd(),
      direction
    }
  }

  // 五行统计
  try {
    const wuxing = ec.getWuXing()
    if (wuxing && typeof wuxing === 'object') {
      overview.wuxingCount = { ...wuxing } as Record<string, number>
    }
  } catch {
    // 五行统计不可用时跳过
  }

  // 纳音
  try {
    overview.nayin = {
      year: ec.getYearNaYin(),
      month: ec.getMonthNaYin(),
      day: ec.getDayNaYin(),
      hour: ec.getTimeNaYin()
    }
  } catch {
    // 纳音不可用时跳过
  }

  return overview
}

/**
 * 计算大运列表
 * 仅 exact_time 且 gender 非 unspecified 时有效。
 * @param maxCount 最多返回几步大运（默认 10）
 */
export function computeDaYun(profile: BirthProfile, maxCount = 10): DaYunEntry[] {
  if (profile.precision !== 'exact_time') return []
  if (profile.traditionalGenderParam === 'unspecified') return []

  const { year, month, day, hour, minute, traditionalGenderParam } = profile
  const d = day ?? 1
  const h = hour ?? 0
  const m = minute ?? 0
  const solar = Solar.fromYmdHms(year, month, d, h, m, 0)
  const lunar = solar.getLunar()
  const ec = lunar.getEightChar()
  const genderCode = traditionalGenderParam === 'male' ? 1 : 0
  const yun = ec.getYun(genderCode)
  const direction: '顺' | '逆' = genderCode === 1 ? '顺' : '逆'

  const allDaYun = yun.getDaYun()
  const result: DaYunEntry[] = []

  for (let i = 0; i < allDaYun.length && result.length < maxCount; i++) {
    const dy = allDaYun[i]
    const ganzhi = dy.getGanZhi()
    // 跳过空干支（童限等非真正大运）
    if (!ganzhi || ganzhi.trim() === '') continue

    const startAge = dy.getStartAge()
    const endAge = dy.getEndAge()

    result.push({
      index: result.length,
      ganzhi,
      startAge,
      endAge,
      direction,
      sourceLayer: BAZI_SOURCE
    })
  }

  return result
}

/**
 * 计算流年列表
 * 仅 exact_time 且 gender 非 unspecified 时有效。
 * @param ageRange 年龄范围 [start, end]，默认 [0, 100]
 */
export function computeLiuNian(
  profile: BirthProfile,
  ageRange: [number, number] = [0, 100]
): LiuNianEntry[] {
  if (profile.precision !== 'exact_time') return []
  if (profile.traditionalGenderParam === 'unspecified') return []

  const { year, month, day, hour, minute, traditionalGenderParam } = profile
  const d = day ?? 1
  const h = hour ?? 0
  const m = minute ?? 0
  const solar = Solar.fromYmdHms(year, month, d, h, m, 0)
  const lunar = solar.getLunar()
  const ec = lunar.getEightChar()
  const genderCode = traditionalGenderParam === 'male' ? 1 : 0
  const yun = ec.getYun(genderCode)
  const allDaYun = yun.getDaYun()

  const result: LiuNianEntry[] = []
  const [minAge, maxAge] = ageRange

  // 遍历每步大运，收集其流年
  for (const dy of allDaYun) {
    const ganzhi = dy.getGanZhi()
    if (!ganzhi || ganzhi.trim() === '') continue

    const liuNians = dy.getLiuNian()
    for (const ln of liuNians) {
      const lnYear = ln.getYear()
      const lnAge = ln.getAge()
      const lnGanzhi = ln.getGanZhi()

      if (lnAge < minAge || lnAge > maxAge) continue
      if (!lnGanzhi) continue

      result.push({
        year: lnYear,
        age: lnAge,
        daYunGanzhi: ganzhi,
        liuNianGanzhi: lnGanzhi,
        sourceLayer: BAZI_SOURCE
      })
    }
  }

  // 按年份排序
  result.sort((a, b) => a.year - b.year)
  return result
}

/**
 * 获取 lunar-javascript 实际版本（用于报告）
 * 当前项目固定依赖 ^1.6.13，不自动升级。
 */
export function getLunarVersion(): string {
  return '^1.6.13'
}
