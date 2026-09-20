/**
 * 八字 / 大运 / 流年 引擎测试（v4.3）
 * 纯本地、离线、确定性。基于 lunar-javascript（不升级依赖）。
 *
 * 诚实原则：精度不足时不伪造缺失的柱；性别 unspecified 时不猜传统精确大运。
 */
import { describe, it, expect } from 'vitest'
import {
  computeBaziOverview,
  computeDaYun,
  computeLiuNian,
  getLunarVersion
} from '../../src/engine/fortune'
import type { BirthProfile, BaziOverview } from '../../src/engine/fortune'

/** 2005-12-23 08:37（公历），男 */
function maleExact(over: Partial<BirthProfile> = {}): BirthProfile {
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

describe('四柱（lunar-javascript 官方已知例）', () => {
  it('1. golden：2005-12-23 08:37 → 乙酉 戊子 辛巳 壬辰', () => {
    const o = computeBaziOverview(maleExact())
    expect(o.pillars.year).toBe('乙酉')
    expect(o.pillars.month).toBe('戊子')
    expect(o.pillars.day).toBe('辛巳')
    expect(o.pillars.hour).toBe('壬辰')
  })

  it('2. exact_time + male → 四柱完整（year/month/day/hour 齐全）', () => {
    const o = computeBaziOverview(maleExact())
    expect(o.pillars.year).toBeTruthy()
    expect(o.pillars.month).toBeTruthy()
    expect(o.pillars.day).toBeTruthy()
    expect(o.pillars.hour).toBeTruthy()
    expect(o.precision).toBe('exact_time')
  })

  it('3. date 精度 → 三柱，hour 为 undefined，note 含"时柱未知"', () => {
    const o = computeBaziOverview(maleExact({ precision: 'date', hour: undefined, minute: undefined }))
    expect(o.pillars.year).toBe('乙酉')
    expect(o.pillars.month).toBe('戊子')
    expect(o.pillars.day).toBe('辛巳')
    expect(o.pillars.hour).toBeUndefined()
    expect(o.precisionNote).toContain('时柱未知')
  })

  it('4. year_month 精度 → 年月二柱，note 含"年月二柱"', () => {
    const o = computeBaziOverview(
      maleExact({ precision: 'year_month', day: undefined, hour: undefined, minute: undefined })
    )
    expect(o.pillars.year).toBeTruthy()
    expect(o.pillars.month).toBeTruthy()
    expect((o.pillars as { day?: string }).day).toBeUndefined()
    expect((o.pillars as { hour?: string }).hour).toBeUndefined()
    expect(o.precisionNote).toContain('年月二柱')
  })

  it('5. 未知时不伪造：date 精度时 hour 不是空串或默认值', () => {
    const o = computeBaziOverview(maleExact({ precision: 'date' }))
    expect(o.pillars.hour).toBeUndefined()
    expect(o.pillars.hour).not.toBe('')
    expect(o.pillars.hour).not.toBe('甲子')
  })
})

describe('大运起运方向与起运', () => {
  it('6. gender=unspecified → computeDaYun 返回空数组，qiYun 为 undefined', () => {
    const p = maleExact({ traditionalGenderParam: 'unspecified' })
    expect(computeDaYun(p)).toEqual([])
    const o = computeBaziOverview(p)
    expect(o.qiYun).toBeUndefined()
  })

  it('7. male → 顺排；female → 逆排（起运方向）', () => {
    const m = computeBaziOverview(maleExact({ traditionalGenderParam: 'male' }))
    expect(m.qiYun?.direction).toBe('顺')
    const f = computeBaziOverview(maleExact({ traditionalGenderParam: 'female' }))
    expect(f.qiYun?.direction).toBe('逆')
  })

  it('8. exact_time + male → 起运 startAge 为数字，startDate 非空', () => {
    const o = computeBaziOverview(maleExact())
    expect(o.qiYun).toBeDefined()
    expect(typeof o.qiYun!.startAge).toBe('number')
    expect(o.qiYun!.startAge).toBeGreaterThanOrEqual(0)
    expect(o.qiYun!.startDate).toBeTruthy()
  })

  it('9. 大运列表非空，每项有 ganzhi/startAge/endAge', () => {
    const dy = computeDaYun(maleExact(), 10)
    expect(dy.length).toBeGreaterThan(0)
    for (const d of dy) {
      expect(d.ganzhi).toBeTruthy()
      expect(typeof d.startAge).toBe('number')
      expect(typeof d.endAge).toBe('number')
      expect(d.endAge).toBeGreaterThan(d.startAge)
      expect(d.sourceLayer).toBe('bazi-yun')
    }
  })
})

describe('流年', () => {
  it('10. 流年列表非空，每项有 year/age/liuNianGanzhi', () => {
    const ln = computeLiuNian(maleExact(), [0, 30])
    expect(ln.length).toBeGreaterThan(0)
    for (const l of ln) {
      expect(typeof l.year).toBe('number')
      expect(typeof l.age).toBe('number')
      expect(l.liuNianGanzhi).toBeTruthy()
      expect(l.sourceLayer).toBe('bazi-yun')
    }
  })

  it('11. 流年按年份升序排列', () => {
    const ln = computeLiuNian(maleExact(), [0, 60])
    for (let i = 1; i < ln.length; i++) {
      expect(ln[i].year).toBeGreaterThanOrEqual(ln[i - 1].year)
    }
  })
})

describe('时区与精度边界', () => {
  it('12. 公历日期相同时，不同时区不影响四柱', () => {
    const sh = computeBaziOverview(maleExact({ timezone: 'Asia/Shanghai' }))
    const ny = computeBaziOverview(maleExact({ timezone: 'America/New_York' }))
    expect(JSON.stringify(sh.pillars)).toBe(JSON.stringify(ny.pillars))
  })

  it('13. 非 exact_time 精度时 computeDaYun / computeLiuNian 返回空', () => {
    const dateP = maleExact({ precision: 'date' })
    expect(computeDaYun(dateP)).toEqual([])
    expect(computeLiuNian(dateP)).toEqual([])
  })
})

describe('版本可追溯', () => {
  it('14. getLunarVersion 返回非空版本字符串', () => {
    const v = getLunarVersion()
    expect(typeof v).toBe('string')
    expect(v.length).toBeGreaterThan(0)
  })

  it('15. BaziOverview 结构完整可识别', () => {
    const o: BaziOverview = computeBaziOverview(maleExact())
    expect(o).toHaveProperty('pillars')
    expect(o).toHaveProperty('precision')
    expect(o).toHaveProperty('precisionNote')
  })
})
