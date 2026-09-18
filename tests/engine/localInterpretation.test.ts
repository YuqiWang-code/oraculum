import { describe, it, expect, vi, beforeAll } from 'vitest'
import { HEXAGRAM_BY_KINGWEN } from '../../src/data/hexagrams'
import type { MeihuaResult } from '../../src/engine/meihua/castByTime'
import type { Rating, QuestionCategory } from '../../src/types'
import { buildRating } from '../../src/engine/scoring/rating'
import { composeMeihuaInterpretation } from '../../src/engine/localInterpretation/composeMeihuaInterpretation'

/**
 * 构造黄金样例：本卦随(17) → 动爻六二 → 互卦渐(53) → 变卦兑(58)
 */
function buildGoldenMeihuaResult(): MeihuaResult {
  const ben = HEXAGRAM_BY_KINGWEN.get(17)! // 随
  const hu = HEXAGRAM_BY_KINGWEN.get(53)! // 渐
  const bian = HEXAGRAM_BY_KINGWEN.get(58)! // 兑

  // 随：上兑(金) 下震(木)，动爻在第2爻（下卦）
  // 动爻在下卦 → 用卦=下卦=震(木)，体卦=上卦=兑(金)
  // 金克木 = controlsA（体克用）
  return {
    ruleVersion: 'meihua_time_v1',
    annualBranchNum: 7,
    lunarMonth: 8,
    lunarDay: 17,
    hourBranchNum: 7,
    upperTrigram: '兑',
    lowerTrigram: '震',
    ben,
    hu,
    bian,
    movingLine: 2,
    movingIndex0: 1,
    tiTrigram: '兑',
    yongTrigram: '震',
    tiElement: '金',
    yongElement: '木',
    relation: 'controlsA',
    bianYongElement: '金'
  }
}

function buildTestRating(): Rating {
  return buildRating([
    { id: 'ev1', title: '体克用', delta: 8, reason: '体克用，自身有主动权', sourceRule: 'meihua_body_use' },
    { id: 'ev2', title: '卦辞', delta: 5, reason: '元亨利贞，整体偏顺', sourceRule: 'classic_theme' }
  ])
}

describe('本地梅花解读引擎 composeMeihuaInterpretation', () => {
  const r = buildGoldenMeihuaResult()
  const rating = buildTestRating()
  const category: QuestionCategory = '事业工作'

  it('黄金样例：随→六二→互渐→变兑，结构完整', () => {
    const result = composeMeihuaInterpretation(r, rating, category)

    // overview
    expect(result.overview).toContain('随')
    expect(result.overview).toContain('渐')
    expect(result.overview).toContain('兑')

    // base section
    expect(result.base.role).toBe('base')
    expect(result.base.title).toContain('本卦')
    expect(result.base.classicTexts.length).toBeGreaterThan(0)
    // 随卦辞：元亨。利貞。无咎。
    expect(result.base.classicTexts[0].text).toContain('元亨')

    // moving line section
    expect(result.movingLines.length).toBe(1)
    expect(result.movingLines[0].role).toBe('moving_line')
    expect(result.movingLines[0].title).toContain('第 2 爻')
    expect(result.movingLines[0].classicTexts[0].text).toContain('系小子')

    // mutual section
    expect(result.mutual).toBeDefined()
    expect(result.mutual!.role).toBe('mutual')
    expect(result.mutual!.title).toContain('互卦')
    expect(result.mutual!.title).toContain('渐')
    expect(result.mutual!.roleExplanation).toContain('中间')

    // changed section
    expect(result.changed).toBeDefined()
    expect(result.changed!.role).toBe('changed')
    expect(result.changed!.title).toContain('变卦')
    expect(result.changed!.title).toContain('兑')
    expect(result.changed!.roleExplanation).toContain('后续')

    // body use section
    expect(result.bodyUse).toBeDefined()
    expect(result.bodyUse!.role).toBe('body_use')
  })

  it('综合段落包含本卦、动爻、互卦、变卦', () => {
    const result = composeMeihuaInterpretation(r, rating, category)
    expect(result.synthesis).toContain('随')
    expect(result.synthesis).toContain('渐')
    expect(result.synthesis).toContain('兑')
    expect(result.synthesis).toContain('第2爻')
  })

  it('同输入同输出（确定性）', () => {
    const a = composeMeihuaInterpretation(r, rating, category)
    const b = composeMeihuaInterpretation(r, rating, category)
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })

  it('favorable/constraints/actionTips 非空', () => {
    const result = composeMeihuaInterpretation(r, rating, category)
    expect(result.favorable.length).toBeGreaterThan(0)
    expect(result.constraints.length).toBeGreaterThan(0)
    expect(result.actionTips.length).toBeGreaterThan(0)
  })

  it('随卦本卦显示卦辞+彖传+大象', () => {
    const result = composeMeihuaInterpretation(r, rating, category)
    const labels = result.base.classicTexts.map((ct) => ct.label)
    expect(labels).toContain('卦辞')
    expect(labels).toContain('彖曰')
    expect(labels).toContain('象曰')
  })

  it('随卦六二显示爻辞+小象', () => {
    const result = composeMeihuaInterpretation(r, rating, category)
    const labels = result.movingLines[0].classicTexts.map((ct) => ct.label)
    expect(labels).toContain('爻辞')
    expect(labels).toContain('象曰')
    // 爻辞内容
    expect(result.movingLines[0].classicTexts[0].text).toContain('系小子')
  })

  it('互渐卦辞正确', () => {
    const result = composeMeihuaInterpretation(r, rating, category)
    // 渐卦辞：女歸吉，利貞。
    expect(result.mutual!.classicTexts[0].text).toContain('女歸吉')
  })

  it('变兑卦辞正确', () => {
    const result = composeMeihuaInterpretation(r, rating, category)
    // 兑卦辞：亨。利貞。
    expect(result.changed!.classicTexts[0].text).toContain('亨')
    expect(result.changed!.classicTexts[0].text).toContain('利貞')
  })

  it('不发起网络请求（离线确定性）', () => {
    const fetchMock = vi.fn()
    const originalFetch = globalThis.fetch
    globalThis.fetch = fetchMock

    composeMeihuaInterpretation(r, rating, category)

    expect(fetchMock).not.toHaveBeenCalled()
    globalThis.fetch = originalFetch
  })
})
