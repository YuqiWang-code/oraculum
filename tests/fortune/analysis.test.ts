/**
 * 运势解释引擎测试（v4.4）
 *
 * 约束：
 * - 同输入同输出（无 Math.random）
 * - 不出现"发财率/升职概率/必生病"等伪精确词
 * - 十神 10x10 全覆盖
 * - 六冲/六合 evidence 可生成
 */
import { describe, it, expect } from 'vitest'
import {
  tenGod,
  isLiuChong,
  isLiuHe,
  analyzeDaYun,
  analyzeLiuNian,
  computeDaYun,
  computeLiuNian,
  type BirthProfile
} from '../../src/engine/fortune'

const GANS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']

function exactPerson(over: Partial<BirthProfile> = {}): BirthProfile {
  return {
    calendarType: 'solar', year: 2005, month: 12, day: 23, hour: 8, minute: 37,
    timezone: 'Asia/Shanghai', precision: 'exact_time',
    traditionalGenderParam: 'male', saveLocally: false,
    ...over
  }
}

describe('十神 10x10 全覆盖', () => {
  it('遍历 10 天干 × 10 天干，每个都返回合法十神', () => {
    const valid = new Set(['比肩', '劫财', '食神', '伤官', '偏财', '正财', '七杀', '正官', '偏印', '正印'])
    for (const day of GANS) {
      for (const other of GANS) {
        const g = tenGod(day, other)
        expect(g).not.toBeNull()
        expect(valid.has(g!)).toBe(true)
      }
    }
  })

  it('同五行同阴阳=比肩', () => {
    expect(tenGod('甲', '甲')).toBe('比肩')
    expect(tenGod('乙', '乙')).toBe('比肩')
  })
  it('同五行异阴阳=劫财', () => {
    expect(tenGod('甲', '乙')).toBe('劫财')
  })
  it('我生同阴阳=食神', () => {
    expect(tenGod('甲', '丙')).toBe('食神') // 木生火，甲阳丙阳
  })
  it('我克异阴阳=正财', () => {
    expect(tenGod('甲', '己')).toBe('正财') // 木克土，甲阳己阴
  })
})

describe('地支六合/六冲', () => {
  it('子午为冲', () => expect(isLiuChong('子', '午')).toBe(true))
  it('子丑为合', () => expect(isLiuHe('子', '丑')).toBe(true))
  it('寅申为冲', () => expect(isLiuChong('寅', '申')).toBe(true))
  it('卯戌为合', () => expect(isLiuHe('卯', '戌')).toBe(true))
})

describe('DaYunAnalysis', () => {
  it('每步大运有 stemTenGod、evidence、reading(why/howToAct)', () => {
    const p = exactPerson()
    const dy = computeDaYun(p, 10)
    const analyses = analyzeDaYun(p, dy)
    expect(analyses.length).toBe(dy.length)
    for (const a of analyses) {
      expect(a.stemTenGod).toBeTruthy()
      expect(a.evidence.length).toBeGreaterThan(0)
      expect(a.reading.why).toBeTruthy()
      expect(a.reading.howToAct).toBeTruthy()
      expect(a.reading.focus).toBeTruthy()
      expect(a.reading.watchOut).toBeTruthy()
    }
  })

  it('同输入两次输出完全一致（确定性）', () => {
    const p = exactPerson()
    const a1 = analyzeDaYun(p, computeDaYun(p, 10))
    const a2 = analyzeDaYun(p, computeDaYun(p, 10))
    expect(JSON.stringify(a1)).toBe(JSON.stringify(a2))
  })
})

describe('LiuNianAnalysis', () => {
  it('每个流年有 evidence 与 plainReading', () => {
    const p = exactPerson()
    const ln = computeLiuNian(p, [0, 29])
    const analyses = analyzeLiuNian(p, ln)
    expect(analyses.length).toBe(ln.length)
    for (const a of analyses) {
      expect(a.evidence.length).toBeGreaterThan(0)
      expect(a.entry.plainReading).toBeTruthy()
      expect(a.reading.why).toBeTruthy()
    }
  })

  it('同输入两次输出完全一致', () => {
    const p = exactPerson()
    const a1 = analyzeLiuNian(p, computeLiuNian(p, [0, 29]))
    const a2 = analyzeLiuNian(p, computeLiuNian(p, [0, 29]))
    expect(JSON.stringify(a1)).toBe(JSON.stringify(a2))
  })
})

describe('禁止伪精确词', () => {
  it('解读中不出现发财率/升职概率/必生病', () => {
    const p = exactPerson()
    const dy = analyzeDaYun(p, computeDaYun(p, 10))
    const ln = analyzeLiuNian(p, computeLiuNian(p, [0, 29]))
    const banned = ['发财率', '升职概率', '结婚概率', '必生病', '必发财', '80分']
    const all = JSON.stringify([dy, ln])
    for (const b of banned) {
      expect(all).not.toContain(b)
    }
  })
})

describe('evidence 可追溯', () => {
  it('每条 evidence 有 id/kind/title/detail/sourceLayer', () => {
    const p = exactPerson()
    const analyses = analyzeDaYun(p, computeDaYun(p, 10))
    for (const a of analyses) {
      for (const ev of a.evidence) {
        expect(ev.id).toBeTruthy()
        expect(ev.title).toBeTruthy()
        expect(ev.detail).toBeTruthy()
        expect(['bazi-yun', 'oraculum-normalization']).toContain(ev.sourceLayer)
      }
    }
  })
})
