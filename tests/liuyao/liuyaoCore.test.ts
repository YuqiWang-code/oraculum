import { describe, it, expect } from 'vitest'
import { deriveLineRoles, generates, controls } from '../../src/engine/liuyao/roles'
import {
  evaluateLineStrength,
  isClash,
  isCombine,
  type LineStrengthState
} from '../../src/engine/liuyao/strength'
import { evaluateDayClash, dayClashEvidence } from '../../src/engine/liuyao/dayRelations'
import { evaluateCombine } from '../../src/engine/liuyao/combine'
import { evaluateHiddenSpirit, hiddenEvidence } from '../../src/engine/liuyao/hiddenSpiritStrength'
import { scoreLiuyao } from '../../src/engine/liuyao/scoreLiuyao'
import { buildLiuyao } from '../../src/engine/liuyao/layout'
import { buildCalendarContext } from '../../src/engine/calendar/calendarEngine'
import { HEXAGRAM_BY_KINGWEN } from '../../src/data/hexagrams'
import type { LiuYaoResult, LiuYaoLine, Element } from '../../src/types'

/**
 * Phase 17：六爻核心逻辑单元测试
 * 对单个规则函数构造最小化 mock 对象进行测试，
 * 不依赖完整排盘，便于定位规则错误。
 */

// ---- mock 构造器 ----

function mockLine(index: number, el: Element, overrides: Partial<LiuYaoLine> = {}): LiuYaoLine {
  return {
    index: index as LiuYaoLine['index'],
    yinYang: 1,
    moving: false,
    branch: '子',
    branchElement: el,
    stem: '甲',
    sixRelation: '兄弟',
    sixSpirit: '青龙',
    isShi: false,
    isYing: false,
    ...overrides
  }
}

/** 构造一个最小 LiuYaoResult，仅满足 deriveLineRoles 读取的字段。 */
function mockResult(elements: Element[]): LiuYaoResult {
  return {
    hexagram: {} as LiuYaoResult['hexagram'],
    palace: '乾',
    palaceElement: '金',
    shiLine: 3,
    yingLine: 6,
    lines: elements.map((el, i) => mockLine(i + 1, el)),
    shensha: []
  }
}

function mockStrength(overrides: Partial<LineStrengthState> = {}): LineStrengthState {
  return {
    lineIndex: 1,
    branch: '卯',
    monthState: 'neutral',
    dayState: 'neutral',
    isKong: false,
    moving: false,
    strengthScore: 0,
    strengthLevel: 'balanced',
    ...overrides
  }
}

// 五行生成 / 克制表（与 roles.ts 对齐）
const GENERATES: Record<Element, Element> = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' }
const CONTROLS: Record<Element, Element> = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' }

describe('五行生成与克制原语', () => {
  it('generates: 水生木', () => {
    expect(generates('水', '木')).toBe(true)
    expect(generates('木', '水')).toBe(false)
  })
  it('controls: 金克木', () => {
    expect(controls('金', '木')).toBe(true)
    expect(controls('木', '金')).toBe(false)
  })
  it('isClash / isCombine 原语', () => {
    expect(isClash('卯', '酉')).toBe(true)
    expect(isClash('卯', '戌')).toBe(false)
    expect(isCombine('卯', '戌')).toBe(true)
    expect(isCombine('卯', '酉')).toBe(false)
  })
})

describe('用神木：元神/忌神/仇神', () => {
  // line1=木(用神), line2=火, line3=土, line4=金, line5=水
  const r = mockResult(['木', '火', '土', '金', '水', '木'])
  const roles = deriveLineRoles(r, [1])
  const roleAt = (idx: number) => roles.find((x) => x.lineIndex === idx)!.role

  it('用神木 → 水行爻 = 元神(source)', () => {
    // 水生木
    expect(roleAt(5)).toBe('source')
  })
  it('用神木 → 金行爻 = 忌神(taboo)', () => {
    // 金克木
    expect(roleAt(4)).toBe('taboo')
  })
  it('用神木 → 土行爻 = 仇神(enemy)', () => {
    // 木克土
    expect(roleAt(3)).toBe('enemy')
  })
})

describe('五行角色轮转：对五个用神分别验证', () => {
  const elements: Element[] = ['木', '火', '土', '金', '水']
  for (const useful of elements) {
    it(`用神=${useful}：元神/忌神/仇神五行正确`, () => {
      const sourceEl = (Object.keys(GENERATES) as Element[]).find((k) => GENERATES[k] === useful)!
      const tabooEl = (Object.keys(CONTROLS) as Element[]).find((k) => CONTROLS[k] === useful)!
      const enemyEl = CONTROLS[useful]

      const order: Element[] = [useful, sourceEl, tabooEl, enemyEl, '木', '火']
      const r = mockResult(order)
      const roles = deriveLineRoles(r, [1])
      // line1 是用神
      expect(roles.find((x) => x.lineIndex === 1)!.role).toBe('useful')
      // source 行（line2）
      expect(roles.find((x) => x.lineIndex === 2)!.role).toBe('source')
      // taboo 行（line3）
      expect(roles.find((x) => x.lineIndex === 3)!.role).toBe('taboo')
      // enemy 行（line4）
      expect(roles.find((x) => x.lineIndex === 4)!.role).toBe('enemy')
    })
  }
})

describe('月建状态（evaluateLineStrength）', () => {
  it('寅月卯木 = month_same_element（同五行，非 month_value）', () => {
    const line = mockLine(2, '木', { branch: '卯' })
    const s = evaluateLineStrength(line, '寅', '子', [])
    expect(s.monthState).toBe('month_same_element')
    expect(s.monthState).not.toBe('month_value')
  })

  it('丑月未土 = month_broken（丑未冲）', () => {
    const line = mockLine(3, '土', { branch: '未' })
    const s = evaluateLineStrength(line, '丑', '子', [])
    expect(s.monthState).toBe('month_broken')
  })

  it('辰日戌土 = day_clashed（辰戌冲）', () => {
    const line = mockLine(4, '土', { branch: '戌' })
    const s = evaluateLineStrength(line, '寅', '辰', [])
    expect(s.dayState).toBe('day_clashed')
  })
})

describe('日冲状态（evaluateDayClash）', () => {
  it('动爻被日冲 = moving_clashed（不是 hidden_movement）', () => {
    const s = mockStrength({ branch: '卯', moving: true, strengthLevel: 'balanced' })
    // 卯酉冲
    expect(evaluateDayClash(s, '酉', false)).toBe('moving_clashed')
  })

  it('静旺爻被日冲 = hidden_movement', () => {
    const s = mockStrength({ branch: '卯', moving: false, strengthLevel: 'strong' })
    expect(evaluateDayClash(s, '酉', false)).toBe('hidden_movement')
  })

  it('静弱爻被日冲 = day_break', () => {
    const s = mockStrength({ branch: '卯', moving: false, strengthLevel: 'weak' })
    expect(evaluateDayClash(s, '酉', false)).toBe('day_break')
  })

  it('有合的爻被日冲 = break_combine', () => {
    const s = mockStrength({ branch: '卯', moving: false, strengthLevel: 'strong' })
    // 卯戌合，但这里 hasCombine=true 表示该爻与日/月有合
    expect(evaluateDayClash(s, '酉', true)).toBe('break_combine')
  })

  it('dayClashEvidence 为 hidden_movement 返回正 delta', () => {
    const ev = dayClashEvidence('hidden_movement', 2, '卯')
    expect(ev).not.toBeNull()
    expect(ev!.delta).toBeGreaterThan(0)
    expect(ev!.title).toContain('暗动')
  })
})

describe('合绊（evaluateCombine）', () => {
  it('静爻逢日合 = static_activated', () => {
    const line = mockLine(3, '木', { branch: '卯', moving: false })
    // 卯戌合
    expect(evaluateCombine(line, '戌', '寅')).toBe('static_activated')
  })
  it('动爻逢月合 = moving_bound', () => {
    const line = mockLine(3, '木', { branch: '卯', moving: true })
    expect(evaluateCombine(line, '子', '戌')).toBe('moving_bound')
  })
})

describe('飞伏神（evaluateHiddenSpirit / hiddenEvidence）', () => {
  it('飞神月破 → hiddenEvidence 有正 delta（伏神易出）', () => {
    // 飞神午火，月建子水（子午冲）
    const line = mockLine(3, '火', {
      branch: '午',
      hidden: { branch: '巳', element: '火', relation: '兄弟' }
    })
    const a = evaluateHiddenSpirit(line, '子', '寅', [])
    expect(a).not.toBeNull()
    expect(a!.flyingIsYuepo).toBe(true)
    const ev = hiddenEvidence(a!)
    const yuepo = ev.find((e) => e.title.includes('飞神月破'))
    expect(yuepo).toBeDefined()
    expect(yuepo!.delta).toBeGreaterThan(0)
  })

  it('伏神得日辰生 → hiddenEvidence 含"伏神得日"项', () => {
    // 飞神辰土，伏神午火，日辰卯木（木生火）
    const line = mockLine(4, '土', {
      branch: '辰',
      hidden: { branch: '午', element: '火', relation: '子孙' }
    })
    const a = evaluateHiddenSpirit(line, '寅', '卯', [])
    expect(a).not.toBeNull()
    expect(a!.hiddenGeneratedByDay).toBe(true)
    const ev = hiddenEvidence(a!)
    const dayGen = ev.find((e) => e.title.includes('伏神得日'))
    expect(dayGen).toBeDefined()
    expect(dayGen!.reason).toContain('日辰生')
  })
})

describe('scoreLiuyao 端到端（用 buildLiuyao 构造完整盘）', () => {
  const cal = buildCalendarContext({ date: new Date(2026, 8, 17, 12), timezone: 'Asia/Shanghai' })
  const suiLines = HEXAGRAM_BY_KINGWEN.get(17)!.lines
  const movingMask = [false, true, false, false, false, false]
  const liuyao = buildLiuyao([...suiLines], movingMask, cal)
  const rating = scoreLiuyao(liuyao, cal.monthBranch, cal.dayGanzhi, true, '事业工作')

  it('Rating.breakdown.sourceTaboo 存在且为 number', () => {
    expect(rating.breakdown).toBeDefined()
    expect(typeof rating.breakdown!.sourceTaboo).toBe('number')
  })

  it('breakdown 各项之和 === evidence delta 之和', () => {
    const b = rating.breakdown!
    const breakdownSum = Object.values(b).reduce((a, c) => a + c, 0)
    const evidenceSum = rating.evidence.reduce((a, e) => a + e.delta, 0)
    expect(breakdownSum).toBe(evidenceSum)
  })

  it('评分在 0-100 区间且有 evidence 列表', () => {
    expect(rating.score).toBeGreaterThanOrEqual(0)
    expect(rating.score).toBeLessThanOrEqual(100)
    expect(rating.evidence.length).toBeGreaterThan(0)
  })
})
