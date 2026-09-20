import { describe, it, expect, vi } from 'vitest'
import { readFileSync, readdirSync } from 'fs'
import { resolve } from 'path'
import { HEXAGRAM_BY_KINGWEN } from '../../src/data/hexagrams'
import type { MeihuaResult } from '../../src/engine/meihua/castByTime'
import type { LiuYaoResult } from '../../src/engine/liuyao/layout'
import { buildLiuyao } from '../../src/engine/liuyao/layout'
import { buildCalendarContext } from '../../src/engine/calendar/calendarEngine'
import type { Rating, QuestionCategory } from '../../src/types'
import { buildRating } from '../../src/engine/scoring/rating'
import { classifyQuestionIntent } from '../../src/engine/plainInterpretation/classifyQuestionIntent'
import {
  interpretMeihuaPlain,
  interpretLiuyaoPlain
} from '../../src/engine/plainInterpretation'
import type { PlainInterpretation } from '../../src/engine/plainInterpretation'

const ROOT = resolve(__dirname, '../..')

/**
 * 黄金样例：本卦遁(33) -> 动六二 -> 互姤(44) -> 变姤(44)
 */
function buildGoldenMeihua(): MeihuaResult {
  const ben = HEXAGRAM_BY_KINGWEN.get(33)! // 遁
  const hu = HEXAGRAM_BY_KINGWEN.get(44)! // 姤
  const bian = HEXAGRAM_BY_KINGWEN.get(44)! // 姤
  return {
    ruleVersion: 'meihua_time_v1',
    annualBranchNum: 7,
    lunarMonth: 8,
    lunarDay: 17,
    hourBranchNum: 7,
    upperTrigram: '乾',
    lowerTrigram: '艮',
    ben,
    hu,
    bian,
    movingLine: 2,
    movingIndex0: 1,
    tiTrigram: '乾',
    yongTrigram: '艮',
    tiElement: '金',
    yongElement: '金',
    relation: 'same',
    bianYongElement: '金'
  }
}

/** 随(17)->六二->互渐(53)->变兑(58)，用于普通梅花用例 */
function buildNormalMeihua(): MeihuaResult {
  const ben = HEXAGRAM_BY_KINGWEN.get(17)!
  const hu = HEXAGRAM_BY_KINGWEN.get(53)!
  const bian = HEXAGRAM_BY_KINGWEN.get(58)!
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

/** score=70, label=吉，无强制约 */
function goldenRating(): Rating {
  return buildRating([
    { id: 'e1', title: '体用比和', delta: 10, reason: '局面平顺，内外一致', sourceRule: 'meihua_body_use' },
    { id: 'e2', title: '卦辞', delta: 10, reason: '整体偏顺', sourceRule: 'classic_theme' }
  ])
}

/** score=70, label=吉，但含一条 delta=-5 的强制约 */
function ratingWithCaution(): Rating {
  return buildRating([
    { id: 'e1', title: '体用比和', delta: 15, reason: '局面平顺', sourceRule: 'meihua_body_use' },
    { id: 'e2', title: '卦辞', delta: 10, reason: '整体偏顺', sourceRule: 'classic_theme' },
    { id: 'e3', title: '体生用', delta: -5, reason: '投入大回报慢，注意消耗', sourceRule: 'meihua_body_use' }
  ])
}

/** score=50, label=平 */
function neutralRating(): Rating {
  return buildRating([
    { id: 'e1', title: '中性', delta: 0, reason: '信号中性', sourceRule: 'classic_theme' }
  ])
}

/** score=20, label=凶 */
function negativeRating(): Rating {
  return buildRating([
    { id: 'e1', title: '制约', delta: -15, reason: '外部压力明显', sourceRule: 'meihua_body_use' },
    { id: 'e2', title: '再制约', delta: -15, reason: '时机不利', sourceRule: 'classic_theme' }
  ])
}

function buildTestLiuyao(): { liuyao: LiuYaoResult; monthBranch: string; dayGanzhi: string } {
  const cal = buildCalendarContext({ date: new Date(2026, 8, 17, 12), timezone: 'Asia/Shanghai' })
  const suiLines = HEXAGRAM_BY_KINGWEN.get(17)!.lines
  const movingMask = [false, true, false, false, false, false]
  const liuyao = buildLiuyao([...suiLines], movingMask, cal)
  return { liuyao, monthBranch: cal.monthBranch, dayGanzhi: cal.dayGanzhi }
}

describe('意图分类 classifyQuestionIntent', () => {
  it('1. "该不该" -> should_do', () => {
    expect(classifyQuestionIntent('我该不该换工作')).toBe('should_do')
  })
  it('2. "什么时候" -> when', () => {
    expect(classifyQuestionIntent('我什么时候能离职')).toBe('when')
  })
  it('3. "上厕所" -> body_need', () => {
    expect(classifyQuestionIntent('我现在能上厕所吗')).toBe('body_need')
  })
  it('4. 无法可靠分类 -> generic', () => {
    expect(classifyQuestionIntent('今天天气怎么样')).toBe('generic')
  })
  it('5. body_need 优先于 should_do', () => {
    expect(classifyQuestionIntent('我该不该去上厕所')).toBe('body_need')
  })
})

describe('黄金样例：遁·六二·互姤·变姤·吉', () => {
  const meihua = buildGoldenMeihua()
  const rating = goldenRating()
  const question = '我该不该现在去上厕所'
  const category: QuestionCategory = '日常综合'

  it('6. oneLiner 精确匹配', () => {
    const r = interpretMeihuaPlain(question, category, meihua, rating)
    expect(r.oneLiner).toBe('该去就去，别硬憋；这卦更像提醒你先暂时离开一下，把眼前的小牵绊处理好，办完就回来。')
  })

  it('7. reasons 包含"固志"', () => {
    const r = interpretMeihuaPlain(question, category, meihua, rating)
    const moving = r.reasons.find((x) => x.source === 'moving_line')
    expect(moving).toBeDefined()
    expect(moving!.explanation).toContain('固志')
  })

  it('8. moving_line 不只说"无法解脱"，含"坚定"或"固志"', () => {
    const r = interpretMeihuaPlain(question, category, meihua, rating)
    const moving = r.reasons.find((x) => x.source === 'moving_line')!
    const onlyLiteral = moving.explanation === '用黄牛皮绳绑住，无法解脱。'
    expect(onlyLiteral).toBe(false)
    expect(moving.explanation.includes('固志') || moving.explanation.includes('坚定')).toBe(true)
  })
})

describe('姿态选择与护栏', () => {
  it('9. 吉 + 强制约 -> do_cautiously', () => {
    const meihua = buildNormalMeihua()
    const r = interpretMeihuaPlain('这件事该不该做', '事业工作', meihua, ratingWithCaution())
    expect(r.stance).toBe('do_cautiously')
  })

  it('10. neutral(平) -> small_step 或 neutral', () => {
    const meihua = buildNormalMeihua()
    const r = interpretMeihuaPlain('这件事该不该做', '事业工作', meihua, neutralRating())
    expect(['small_step', 'neutral']).toContain(r.stance)
  })

  it('11. negative(凶) -> wait 或 avoid', () => {
    const meihua = buildNormalMeihua()
    const r = interpretMeihuaPlain('这件事该不该做', '事业工作', meihua, negativeRating())
    expect(['wait', 'avoid']).toContain(r.stance)
  })

  it('12. body_need 不输出"继续憋"', () => {
    const meihua = buildNormalMeihua()
    const r = interpretMeihuaPlain('我该不该去上厕所', '日常综合', meihua, goldenRating())
    expect(r.oneLiner).not.toContain('继续憋')
    for (const reason of r.reasons) {
      expect(reason.explanation).not.toContain('继续憋')
    }
  })

  it('22. 高风险类别有 realityGuard', () => {
    const meihua = buildNormalMeihua()
    const r = interpretMeihuaPlain('我买这个理财划算吗', '财务收益', meihua, goldenRating())
    expect(r.realityGuard).toBeTruthy()
  })
})

describe('输出约束', () => {
  const meihua = buildNormalMeihua()

  it('13. oneLiner 不超过 90 汉字', () => {
    const r = interpretMeihuaPlain('这件事该不该做', '事业工作', meihua, goldenRating())
    expect(r.oneLiner.length).toBeLessThanOrEqual(90)
  })

  it('14. oneLiner 非空', () => {
    const r = interpretMeihuaPlain('这件事该不该做', '事业工作', meihua, goldenRating())
    expect(r.oneLiner.length).toBeGreaterThan(0)
  })

  it('15. reasons 最多 5 条', () => {
    const r = interpretMeihuaPlain('这件事该不该做', '事业工作', meihua, goldenRating())
    expect(r.reasons.length).toBeLessThanOrEqual(5)
  })

  it('16. 同输入同输出（确定性）', () => {
    const a = interpretMeihuaPlain('这件事该不该做', '事业工作', meihua, goldenRating())
    const b = interpretMeihuaPlain('这件事该不该做', '事业工作', meihua, goldenRating())
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })

  it('23. 梅花支持：返回完整 PlainInterpretation', () => {
    const r: PlainInterpretation = interpretMeihuaPlain('这件事该不该做', '事业工作', meihua, goldenRating())
    expect(r.oneLiner).toBeTruthy()
    expect(r.stance).toBeTruthy()
    expect(r.reasons.length).toBeGreaterThan(0)
    expect(r.disclaimer).toContain('不调用大模型')
  })

  it('26. 旧记录 fallback 可正常生成（无 plainInterpretation 字段时）', () => {
    // 模拟旧记录：直接用原始 meihua+rating 调用入口，不依赖 record.plainInterpretation
    const r = interpretMeihuaPlain('这件事怎么样', '日常综合', meihua, goldenRating())
    expect(r.oneLiner).toBeTruthy()
    expect(r.reasons.length).toBeGreaterThan(0)
  })
})

describe('姤不过度联想', () => {
  const meihua = buildGoldenMeihua() // 互/变均为姤

  it('20. 姤不自动生成"排队"', () => {
    const r = interpretMeihuaPlain('这件事发展得怎么样', '日常综合', meihua, goldenRating())
    expect(r.oneLiner).not.toContain('排队')
  })

  it('21. 姤不自动生成"遇熟人"', () => {
    const r = interpretMeihuaPlain('这件事发展得怎么样', '日常综合', meihua, goldenRating())
    expect(r.oneLiner).not.toContain('熟人')
  })
})

describe('纯本地/无副作用', () => {
  it('17. 源码不含 Math.random', () => {
    const dir = resolve(ROOT, 'src/engine/plainInterpretation')
    const files = readdirSync(dir).filter((f) => f.endsWith('.ts'))
    for (const f of files) {
      const src = readFileSync(resolve(dir, f), 'utf-8')
      expect(src.includes('Math.random')).toBe(false)
    }
  })

  it('18. 不改变传入的 rating', () => {
    const meihua = buildNormalMeihua()
    const rating = goldenRating()
    const before = JSON.stringify(rating)
    interpretMeihuaPlain('这件事该不该做', '事业工作', meihua, rating)
    const after = JSON.stringify(rating)
    expect(before).toBe(after)
  })

  it('19. 不改变传入的 meihua', () => {
    const meihua = buildNormalMeihua()
    const rating = goldenRating()
    const before = JSON.stringify(meihua)
    interpretMeihuaPlain('这件事该不该做', '事业工作', meihua, rating)
    const after = JSON.stringify(meihua)
    expect(before).toBe(after)
  })

  it('25. 断网可生成（fetch 不被调用）', () => {
    const fetchMock = vi.fn()
    const originalFetch = globalThis.fetch
    globalThis.fetch = fetchMock
    try {
      const r = interpretMeihuaPlain('这件事该不该做', '事业工作', buildNormalMeihua(), goldenRating())
      expect(r.oneLiner).toBeTruthy()
      expect(fetchMock).not.toHaveBeenCalled()
    } finally {
      globalThis.fetch = originalFetch
    }
  })
})

describe('六爻支持', () => {
  it('24. 六爻返回完整 PlainInterpretation', () => {
    const { liuyao, monthBranch, dayGanzhi } = buildTestLiuyao()
    const rating = buildRating([
      { id: 'e1', title: '用神旺相', delta: 10, reason: '用神临月建', sourceRule: 'usefulGod' }
    ])
    const r = interpretLiuyaoPlain('我该不该做这个项目', '事业工作', liuyao, rating, monthBranch, dayGanzhi)
    expect(r.oneLiner).toBeTruthy()
    expect(r.reasons.length).toBeGreaterThan(0)
    expect(r.oneLiner.length).toBeLessThanOrEqual(90)
  })
})
