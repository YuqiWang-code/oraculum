import { describe, it, expect } from 'vitest'
import { buildCalendarContext } from '../../src/engine/calendar/calendarEngine'
import { castMeihuaByTime } from '../../src/engine/meihua/castByTime'
import { scoreMeihua } from '../../src/engine/scoring/scoreMeihua'
import { buildRating, labelForScore, clamp } from '../../src/engine/scoring/rating'
import { HEXAGRAM_BY_LINES } from '../../src/data/hexagrams'
import type { ScoreEvidence } from '../../src/types'

describe('梅花时间起卦 meihua_time_v1（资料 5.2）', () => {
  const cal = buildCalendarContext({ date: new Date(2026, 8, 17, 12), timezone: 'Asia/Shanghai' })

  it('历法上下文字段完整', () => {
    expect(cal.dayGanzhi).toBeTruthy()
    expect(cal.monthBranch).toBeTruthy()
    expect(cal.xunKong.length).toBe(2)
  })

  const r = castMeihuaByTime(cal)

  it('本/互/变卦都是合法卦', () => {
    expect(HEXAGRAM_BY_LINES.has(r.ben.lines.join(''))).toBe(true)
    expect(HEXAGRAM_BY_LINES.has(r.hu.lines.join(''))).toBe(true)
    expect(HEXAGRAM_BY_LINES.has(r.bian.lines.join(''))).toBe(true)
  })

  it('动爻在1-6之间', () => {
    expect(r.movingLine).toBeGreaterThanOrEqual(1)
    expect(r.movingLine).toBeLessThanOrEqual(6)
  })

  it('变卦=本卦翻转动爻', () => {
    const diff = r.ben.lines.map((l, i) => (l === r.bian.lines[i] ? 0 : 1))
    expect(diff.reduce((a: number, b: number) => a + b, 0)).toBe(1)
  })

  it('同输入同结果确定性', () => {
    const r2 = castMeihuaByTime(cal)
    expect(JSON.stringify(r2)).toBe(JSON.stringify(r))
  })

  it('体用之一', () => {
    expect(['generatesB', 'controlsA', 'same', 'generatesA', 'controlsB']).toContain(r.relation)
  })
})

describe('评分系统（资料 11）', () => {
  it('五档标签区间', () => {
    expect(labelForScore(10)).toBe('大凶')
    expect(labelForScore(30)).toBe('凶')
    expect(labelForScore(50)).toBe('平')
    expect(labelForScore(70)).toBe('吉')
    expect(labelForScore(90)).toBe('大吉')
  })
  it('clamp 边界', () => {
    expect(clamp(-5, 0, 100)).toBe(0)
    expect(clamp(150, 0, 100)).toBe(100)
  })
  it('score = 50 + sum(delta)', () => {
    const ev: ScoreEvidence[] = [
      { id: 'a', title: 't', delta: 10, reason: 'r', sourceRule: 'x' },
      { id: 'b', title: 't', delta: -5, reason: 'r', sourceRule: 'x' }
    ]
    expect(buildRating(ev).score).toBe(55)
  })
  it('无证据为平', () => {
    expect(buildRating([]).score).toBe(50)
    expect(buildRating([]).label).toBe('平')
  })
  it('梅花评分有 evidence 且分数在0-100', () => {
    const cal = buildCalendarContext({ date: new Date(2026, 8, 17, 12), timezone: 'Asia/Shanghai' })
    const r = castMeihuaByTime(cal)
    const rating = scoreMeihua(r, cal.monthBranch)
    expect(rating.evidence.length).toBeGreaterThan(0)
    expect(rating.score).toBeGreaterThanOrEqual(0)
    expect(rating.score).toBeLessThanOrEqual(100)
  })
})
