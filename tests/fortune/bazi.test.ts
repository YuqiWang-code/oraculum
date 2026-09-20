/**
 * 八字 / 大运 / 流年 引擎测试（v4.4）
 * 纯本地、离线、确定性。基于 lunar-javascript 1.7.7。
 *
 * 关键修正：
 * - 大运顺逆唯一事实源是 yun.isForward()，不再用 genderCode 猜
 * - year_month 不伪造 day=1
 * - 五行统计显式干支计数
 * - 农历/闰月/晚子时日界
 */
import { describe, it, expect } from 'vitest'
import { Solar, Lunar } from 'lunar-javascript'
import {
  computeBaziOverview,
  computeDaYun,
  computeLiuNian,
  getLunarVersion,
  validateBirthProfile,
  normalizeBirthProfile,
  type BirthProfile
} from '../../src/engine/fortune'

/** 2005-12-23 08:37（公历），男 —— 阴年（乙=阴） */
function yinMale(over: Partial<BirthProfile> = {}): BirthProfile {
  return {
    calendarType: 'solar',
    year: 2005,
    month: 12,
    day: 23,
    hour: 8,
    minute: 37,
    timezone: 'Asia/Shanghai',
    precision: 'exact_time',
    traditionalGenderParam: 'male',
    saveLocally: false,
    ...over
  }
}

/** 2024-06-15 10:00（公历）—— 阳年（甲=阳） */
function yangPerson(over: Partial<BirthProfile> = {}): BirthProfile {
  return {
    calendarType: 'solar',
    year: 2024,
    month: 6,
    day: 15,
    hour: 10,
    minute: 0,
    timezone: 'Asia/Shanghai',
    precision: 'exact_time',
    traditionalGenderParam: 'male',
    saveLocally: false,
    ...over
  }
}

describe('四柱 golden', () => {
  it('1. 2005-12-23 08:37 → 乙酉 戊子 辛巳 壬辰', () => {
    const o = computeBaziOverview(yinMale())
    expect(o.pillars.year).toBe('乙酉')
    expect(o.pillars.month).toBe('戊子')
    expect(o.pillars.day).toBe('辛巳')
    expect(o.pillars.hour).toBe('壬辰')
  })

  it('2. exact_time 四柱完整', () => {
    const o = computeBaziOverview(yinMale())
    expect(o.pillars.year).toBeTruthy()
    expect(o.pillars.month).toBeTruthy()
    expect(o.pillars.day).toBeTruthy()
    expect(o.pillars.hour).toBeTruthy()
    expect(o.precision).toBe('exact_time')
  })

  it('3. date 精度 → 三柱，hour 为 undefined', () => {
    const o = computeBaziOverview(yinMale({ precision: 'date', hour: undefined, minute: undefined }))
    expect(o.pillars.year).toBe('乙酉')
    expect(o.pillars.month).toBe('戊子')
    expect(o.pillars.day).toBe('辛巳')
    expect(o.pillars.hour).toBeUndefined()
    expect(o.precisionNote).toContain('时柱未知')
  })
})

describe('大运顺逆（四组 golden，唯一事实源 isForward）', () => {
  it('4. 阳男 → 顺排（2024 甲辰，甲=阳）', () => {
    const o = computeBaziOverview(yangPerson({ traditionalGenderParam: 'male' }))
    expect(o.qiYun?.direction).toBe('顺')
  })
  it('5. 阴男 → 逆排（2005 乙酉，乙=阴）', () => {
    const o = computeBaziOverview(yinMale({ traditionalGenderParam: 'male' }))
    expect(o.qiYun?.direction).toBe('逆')
  })
  it('6. 阳女 → 逆排（2024 阳年女）', () => {
    const o = computeBaziOverview(yangPerson({ traditionalGenderParam: 'female' }))
    expect(o.qiYun?.direction).toBe('逆')
  })
  it('7. 阴女 → 顺排（2005 阴年女）', () => {
    const o = computeBaziOverview(yinMale({ traditionalGenderParam: 'female' }))
    expect(o.qiYun?.direction).toBe('顺')
  })
})

describe('起运信息完整', () => {
  it('8. qiYun 含 startYears/Months/Days/Hours/startDate/direction/yunSect', () => {
    const o = computeBaziOverview(yinMale())
    expect(o.qiYun).toBeDefined()
    expect(typeof o.qiYun!.startYears).toBe('number')
    expect(typeof o.qiYun!.startMonths).toBe('number')
    expect(typeof o.qiYun!.startDays).toBe('number')
    expect(typeof o.qiYun!.startHours).toBe('number')
    expect(o.qiYun!.startDate).toBeTruthy()
    expect(o.qiYun!.direction).toBe('逆')
    expect([1, 2]).toContain(o.qiYun!.yunSect)
  })

  it('9. gender=unspecified → 不计算起运', () => {
    const p = yinMale({ traditionalGenderParam: 'unspecified' })
    expect(computeDaYun(p)).toEqual([])
    expect(computeBaziOverview(p).qiYun).toBeUndefined()
  })
})

describe('DaYun startDate 正确', () => {
  it('10. 每步大运 startDate 为公历日期字符串', () => {
    const dy = computeDaYun(yinMale(), 10)
    expect(dy.length).toBeGreaterThan(0)
    for (const d of dy) {
      expect(d.ganzhi).toBeTruthy()
      expect(d.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })
})

describe('year_month 不伪造', () => {
  it('11. year_month → pillars 留空，note 含"不足"', () => {
    const o = computeBaziOverview(
      yinMale({ precision: 'year_month', day: undefined, hour: undefined, minute: undefined })
    )
    expect(o.pillars.year).toBe('')
    expect(o.pillars.month).toBe('')
    expect(o.precisionNote).toContain('不足')
  })
})

describe('分钟精度', () => {
  it('12. 只有 hour 无 minute → precisionNote 标注精度有限', () => {
    const o = computeBaziOverview(yinMale({ minute: undefined, timePrecision: 'hour' }))
    expect(o.precisionNote).toContain('分钟未知')
  })
})

describe('晚子时日界 sect', () => {
  it('13. 2025-06-15 23:30：sect=2 乙卯，sect=1 丙辰', () => {
    const base: BirthProfile = {
      calendarType: 'solar', year: 2025, month: 6, day: 15, hour: 23, minute: 30,
      timezone: 'Asia/Shanghai', precision: 'exact_time',
      traditionalGenderParam: 'male', saveLocally: false
    }
    const o2 = computeBaziOverview({ ...base, daySect: 2 })
    const o1 = computeBaziOverview({ ...base, daySect: 1 })
    expect(o2.pillars.day).toBe('乙卯')
    expect(o1.pillars.day).toBe('丙辰')
    // 时柱均为戊子
    expect(o2.pillars.hour).toBe('戊子')
    expect(o1.pillars.hour).toBe('戊子')
  })
})

describe('农历输入与公历等价', () => {
  it('14. 农历与等价公历四柱一致', () => {
    // 公历 2005-12-23 08:37 -> 农历
    const solar = Solar.fromYmdHms(2005, 12, 23, 8, 37, 0)
    const lunar = solar.getLunar()
    const ly = lunar.getYear()
    const lm = lunar.getMonth() // 负数表闰月
    const ld = lunar.getDay()

    const lunarProfile: BirthProfile = {
      calendarType: 'lunar', year: ly, month: Math.abs(lm), day: ld,
      hour: 8, minute: 37, timezone: 'Asia/Shanghai', precision: 'exact_time',
      traditionalGenderParam: 'male', saveLocally: false,
      lunarLeapMonth: lm < 0
    }
    const o = computeBaziOverview(lunarProfile)
    const expectO = computeBaziOverview(yinMale())
    expect(o.pillars.year).toBe(expectO.pillars.year)
    expect(o.pillars.month).toBe(expectO.pillars.month)
    expect(o.pillars.day).toBe(expectO.pillars.day)
    expect(o.pillars.hour).toBe(expectO.pillars.hour)
  })
})

describe('校验 validateBirthProfile', () => {
  it('15. 2025-02-31 必须拒绝', () => {
    const r = validateBirthProfile({
      calendarType: 'solar', year: 2025, month: 2, day: 31,
      timezone: 'Asia/Shanghai', precision: 'date',
      traditionalGenderParam: 'unspecified', saveLocally: false
    })
    expect(r.ok).toBe(false)
    expect(r.message).toContain('2月')
  })
  it('16. 2025 年无闰五月（闰六月），选闰五月必须拒绝', () => {
    const r = validateBirthProfile({
      calendarType: 'lunar', year: 2025, month: 5, day: 1, lunarLeapMonth: true,
      timezone: 'Asia/Shanghai', precision: 'date',
      traditionalGenderParam: 'unspecified', saveLocally: false
    })
    expect(r.ok).toBe(false)
    expect(r.message).toContain('闰')
  })
  it('17. 正常公历日期通过', () => {
    const r = validateBirthProfile({
      calendarType: 'solar', year: 2005, month: 12, day: 23,
      timezone: 'Asia/Shanghai', precision: 'date',
      traditionalGenderParam: 'unspecified', saveLocally: false
    })
    expect(r.ok).toBe(true)
  })
  it('18. hour=25 必须拒绝', () => {
    const r = validateBirthProfile({
      calendarType: 'solar', year: 2005, month: 12, day: 23, hour: 25,
      timezone: 'Asia/Shanghai', precision: 'exact_time',
      traditionalGenderParam: 'unspecified', saveLocally: false
    })
    expect(r.ok).toBe(false)
  })
})

describe('五行统计 deterministic', () => {
  it('19. 两次计算结果一致，且为 5 个元素', () => {
    const a = computeBaziOverview(yinMale())
    const b = computeBaziOverview(yinMale())
    expect(a.wuxingCount).toBeDefined()
    expect(JSON.stringify(a.wuxingCount)).toBe(JSON.stringify(b.wuxingCount))
    const keys = Object.keys(a.wuxingCount!)
    expect(keys.sort()).toEqual(['土', '木', '水', '火', '金'].sort())
  })
})

describe('流年按范围', () => {
  it('20. 流年只返回范围内年龄', () => {
    const ln = computeLiuNian(yinMale(), [0, 29])
    expect(ln.length).toBeGreaterThan(0)
    expect(ln.length).toBeLessThanOrEqual(30)
    for (const l of ln) {
      expect(l.age).toBeGreaterThanOrEqual(0)
      expect(l.age).toBeLessThanOrEqual(29)
    }
  })
})

describe('版本可追溯', () => {
  it('21. getLunarVersion 返回 1.7.7', () => {
    expect(getLunarVersion()).toBe('1.7.7')
  })
})
