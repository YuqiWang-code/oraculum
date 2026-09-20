/**
 * 八字 / 大运 / 流年引擎
 * 使用 lunar-javascript 1.7.7（已 pin）。
 * 纯本地、离线、确定性。
 *
 * 诚实原则：
 * - year_month：无出生日期，不伪造节令年/月柱，pillar 留空，UI 显示"不足"
 * - date：年/月/日三柱，时柱未知
 * - exact_time：完整四柱 + 大运 + 流年
 *
 * 大运顺逆：唯一事实源是 yun.isForward()，绝不用 genderCode 猜。
 * 晚子时日界：ec.setSect(profile.daySect ?? 2)。
 * 五行统计：显式干支五行计数，不调用 ec.getWuXing()（该方法在 EightChar 上不存在）。
 */
import type {
  BirthProfile,
  BaziPillars,
  BaziOverview,
  DaYunEntry,
  LiuNianEntry,
  FortuneSourceLayer,
  QiYunInfo
} from '../types'
import { normalizeBirthProfile } from '../birth/normalizeBirthProfile'
import { countElements } from '../analysis'

const BAZI_SOURCE: FortuneSourceLayer = 'bazi-yun'

/**
 * 计算八字概览
 */
export function computeBaziOverview(profile: BirthProfile): BaziOverview {
  // year_month：无出生日期，无法精确确定节令年柱/月柱，不伪造
  if (profile.precision === 'year_month') {
    return {
      pillars: {
        year: '',
        month: ''
      },
      precision: 'year_month',
      precisionNote: '出生日期不足，无法精确确定节令年柱/月柱。仅知道出生年月，年/月柱会因节气交界而不确定；补全出生日后可排三柱。'
    }
  }

  const { lunar } = normalizeBirthProfile(profile)
  const ec = lunar.getEightChar()
  // 晚子时日界（必须在读取日柱前设置）
  const sect = profile.daySect ?? 2
  ec.setSect(sect)

  const pillars: BaziPillars = {
    year: `${ec.getYearGan()}${ec.getYearZhi()}`,
    month: `${ec.getMonthGan()}${ec.getMonthZhi()}`,
    day: `${ec.getDayGan()}${ec.getDayZhi()}`
  }

  const overview: BaziOverview = {
    pillars,
    precision: profile.precision,
    precisionNote: '',
    daySect: sect,
    dayBoundaryLabel: sect === 2
      ? '日界：00:00 换日（23:00-23:59 日柱按当天）'
      : '日界：23:00 子初换日（晚子时按次日）'
  }

  // date：无时柱
  if (profile.precision === 'date') {
    overview.precisionNote = '提供出生年月日但无时辰，展示三柱，时柱未知。大运和流年需要完整出生时辰。'
  }

  // exact_time：完整四柱 + 起运
  if (profile.precision === 'exact_time') {
    pillars.hour = `${ec.getTimeGan()}${ec.getTimeZhi()}`
    const minuteNote = profile.timePrecision === 'hour'
      ? '分钟未知，按该时辰起点（00分）排盘，起运精度有限。'
      : ''
    overview.precisionNote = `完整出生年月日时，展示四柱。${minuteNote}`.trim()

    // 五行统计（仅表层八字干支计数）
    const stems = [ec.getYearGan(), ec.getMonthGan(), ec.getDayGan(), ec.getTimeGan()]
    const branches = [ec.getYearZhi(), ec.getMonthZhi(), ec.getDayZhi(), ec.getTimeZhi()]
    const cnt = countElements(stems, branches)
    overview.wuxingCount = {
      木: cnt.木, 火: cnt.火, 土: cnt.土, 金: cnt.金, 水: cnt.水
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

    // 起运（仅 gender 非 unspecified）
    if (profile.traditionalGenderParam !== 'unspecified') {
      overview.qiYun = computeQiYun(profile, ec, sect)
    }
  }

  return overview
}

/**
 * 计算起运信息。
 * 顺逆唯一事实源：yun.isForward()。
 */
function computeQiYun(
  profile: BirthProfile,
  ec: ReturnType<ReturnType<typeof normalizeBirthProfile>['lunar']['getEightChar']>,
  sect: 1 | 2
): QiYunInfo {
  const genderCode = profile.traditionalGenderParam === 'male' ? 1 : 0
  const yun = ec.getYun(genderCode)
  const forward = yun.isForward()

  return {
    startAge: yun.getStartYear(),
    startYears: yun.getStartYear(),
    startMonths: yun.getStartMonth(),
    startDays: yun.getStartDay(),
    startHours: yun.getStartHour(),
    startDate: yun.getStartSolar().toYmd(),
    direction: forward ? '顺' : '逆',
    yunSect: sect
  }
}

/**
 * 计算大运列表
 * 仅 exact_time 且 gender 非 unspecified 时有效。
 */
export function computeDaYun(profile: BirthProfile, maxCount = 10): DaYunEntry[] {
  if (profile.precision !== 'exact_time') return []
  if (profile.traditionalGenderParam === 'unspecified') return []

  const { lunar } = normalizeBirthProfile(profile)
  const ec = lunar.getEightChar()
  ec.setSect(profile.daySect ?? 2)

  const genderCode = profile.traditionalGenderParam === 'male' ? 1 : 0
  const yun = ec.getYun(genderCode)
  const forward = yun.isForward()
  const direction: '顺' | '逆' = forward ? '顺' : '逆'

  // 第一步大运的起运公历日期
  const firstStartSolar = yun.getStartSolar()

  const allDaYun = yun.getDaYun()
  const result: DaYunEntry[] = []

  for (let i = 0; i < allDaYun.length && result.length < maxCount; i++) {
    const dy = allDaYun[i]
    const ganzhi = dy.getGanZhi()
    // 跳过空干支（童限等非真正大运）
    if (!ganzhi || ganzhi.trim() === '') continue

    const startAge = dy.getStartAge()
    const endAge = dy.getEndAge()
    // 每步大运起运公历日期 = 第一步起运日期 + (该步index-1)*10 年
    const lunarIndex = dy.getIndex()
    const startSolar = firstStartSolar.nextYear(lunarIndex - 1)

    result.push({
      index: result.length,
      ganzhi,
      startAge,
      endAge,
      startDate: startSolar.toYmd(),
      direction,
      sourceLayer: BAZI_SOURCE
    })
  }

  return result
}

/**
 * 计算流年列表
 * 仅 exact_time 且 gender 非 unspecified 时有效。
 * @param ageRange 年龄范围 [start, end]
 */
export function computeLiuNian(
  profile: BirthProfile,
  ageRange: [number, number] = [0, 100]
): LiuNianEntry[] {
  if (profile.precision !== 'exact_time') return []
  if (profile.traditionalGenderParam === 'unspecified') return []

  const { lunar } = normalizeBirthProfile(profile)
  const ec = lunar.getEightChar()
  ec.setSect(profile.daySect ?? 2)

  const genderCode = profile.traditionalGenderParam === 'male' ? 1 : 0
  const yun = ec.getYun(genderCode)
  const allDaYun = yun.getDaYun()

  const result: LiuNianEntry[] = []
  const [minAge, maxAge] = ageRange

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

  result.sort((a, b) => a.year - b.year)
  return result
}

/**
 * 获取 lunar-javascript 实际版本（用于报告）
 * 项目固定依赖 1.7.7。
 */
export function getLunarVersion(): string {
  return '1.7.7'
}
