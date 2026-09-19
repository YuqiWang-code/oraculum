import { describe, it, expect } from 'vitest'
import { buildCalendarContext } from '../../src/engine/calendar/calendarEngine'
import { buildLiuyao } from '../../src/engine/liuyao/layout'
import type { Rating, QuestionCategory, RatingBreakdown } from '../../src/types'
import { buildRating } from '../../src/engine/scoring/rating'
import { composeLiuyaoInterpretation } from '../../src/engine/localInterpretation/composeLiuyaoInterpretation'
import { HEXAGRAM_BY_KINGWEN } from '../../src/data/hexagrams'

function buildTestRatingWithBreakdown(): Rating {
  const breakdown: RatingBreakdown = {
    usefulGod: 10,
    sourceTaboo: 0,
    shiYing: 5,
    monthDay: -3,
    movement: 8,
    conflictHarmony: 0,
    classicTheme: 5,
    auxiliary: 0
  }
  return buildRating([
    { id: 'ev1', title: '用神旺相', delta: 10, reason: '用神临月建', sourceRule: 'usefulGod', bucket: 'usefulGod' },
    { id: 'ev2', title: '世应相生', delta: 5, reason: '世应相生合', sourceRule: 'shiYing', bucket: 'shiYing' },
    { id: 'ev3', title: '日冲爻', delta: -3, reason: '日辰冲克', sourceRule: 'monthDay', bucket: 'monthDay' }
  ], breakdown)
}

describe('本地六爻解读引擎 composeLiuyaoInterpretation', () => {
  const cal = buildCalendarContext({ date: new Date(2026, 8, 17, 12), timezone: 'Asia/Shanghai' })

  // 随卦(17)：下震[1,0,0] 上兑[1,1,0]，第2爻动
  const suiLines = HEXAGRAM_BY_KINGWEN.get(17)!.lines
  const movingMask = [false, true, false, false, false, false]
  const liuyao = buildLiuyao([...suiLines], movingMask, cal)
  const rating = buildTestRatingWithBreakdown()
  const category: QuestionCategory = '事业工作'

  it('结构完整：有 base、movingLines、changed', () => {
    const result = composeLiuyaoInterpretation(liuyao, rating, category)
    expect(result.base).toBeDefined()
    expect(result.base.role).toBe('base')
    expect(result.movingLines.length).toBeGreaterThan(0)
    expect(result.changed).toBeDefined()
  })

  it('综合段落提到用神', () => {
    const result = composeLiuyaoInterpretation(liuyao, rating, category)
    expect(result.synthesis).toContain('用神')
  })

  it('RatingBreakdown 进入本地解释', () => {
    const result = composeLiuyaoInterpretation(liuyao, rating, category)
    expect(result.synthesis).toContain('评分分类明细')
    expect(result.synthesis).toContain('用神旺衰')
  })

  it('有 usefulGodReason', () => {
    const result = composeLiuyaoInterpretation(liuyao, rating, category)
    expect(result.usefulGodReason).toBeDefined()
    expect(result.usefulGodReason).toContain('事业工作')
  })

  it('本卦经典证据在 base.classicTexts', () => {
    const result = composeLiuyaoInterpretation(liuyao, rating, category)
    expect(result.base.classicTexts.length).toBeGreaterThan(0)
    // 随卦辞：元亨。利貞。无咎。
    expect(result.base.classicTexts[0].text).toContain('元亨')
  })

  it('动爻经典证据在 movingLines', () => {
    const result = composeLiuyaoInterpretation(liuyao, rating, category)
    expect(result.movingLines.length).toBe(1)
    expect(result.movingLines[0].classicTexts.length).toBeGreaterThan(0)
    expect(result.movingLines[0].classicTexts[0].text).toContain('系小子')
  })

  it('变卦经典证据在 changed', () => {
    const result = composeLiuyaoInterpretation(liuyao, rating, category)
    expect(result.changed).toBeDefined()
    expect(result.changed!.classicTexts.length).toBeGreaterThan(0)
  })

  it('favorable/constraints/actionTips 非空', () => {
    const result = composeLiuyaoInterpretation(liuyao, rating, category)
    expect(result.favorable.length).toBeGreaterThan(0)
    expect(result.constraints.length).toBeGreaterThan(0)
    expect(result.actionTips.length).toBeGreaterThan(0)
  })

  it('overview 包含卦名和宫位', () => {
    const result = composeLiuyaoInterpretation(liuyao, rating, category)
    expect(result.overview).toContain('随')
    expect(result.overview).toContain('宫')
  })

  it('同输入同输出（确定性）', () => {
    const a = composeLiuyaoInterpretation(liuyao, rating, category)
    const b = composeLiuyaoInterpretation(liuyao, rating, category)
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })
})
