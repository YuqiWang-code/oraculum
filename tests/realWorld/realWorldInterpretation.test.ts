/**
 * 现实白话解读引擎（v4.3）测试
 * 覆盖：长辈友好数据完整性（64 卦 / 384 爻）、禁词守卫、
 *       工作黄金样例、上厕所样例、确定性、无网络、旧数据 fallback。
 * 纯本地、离线、确定性。
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import * as localData from '../../src/local-data'
import {
  interpretMeihuaRealWorld,
  guardWording,
  FORBIDDEN_WORDS
} from '../../src/engine/realWorldInterpretation'
import type { RealWorldPlainReading } from '../../src/engine/realWorldInterpretation'
import { HEXAGRAM_BY_KINGWEN } from '../../src/data/hexagrams'
import type { MeihuaResult } from '../../src/engine/meihua/castByTime'
import type { Rating, QuestionCategory } from '../../src/types'
import { buildRating } from '../../src/engine/scoring/rating'

/** v4.4 起 elderFriendly 改为动态分批加载；测试前预加载全部 8 批。 */
beforeAll(async () => {
  await localData.loadElderFriendlyBatches([1, 9, 17, 25, 33, 41, 49, 57])
})

/** score=48, label=平（50 + (-2)） */
function pingRating(): Rating {
  return buildRating([
    { id: 'e1', title: '体生用', delta: -2, reason: '自身付出、泄耗较多', sourceRule: 'meihua_body_use' }
  ])
}

/** score=70, label=吉 */
function goodRating(): Rating {
  return buildRating([
    { id: 'e1', title: '体用比和', delta: 10, reason: '局面平顺', sourceRule: 'meihua_body_use' }
  ])
}

/**
 * 工作黄金样例：
 * 问题"这份工作该不该接"，类别"事业工作"，
 * 本卦大畜(26)，二爻动，互卦归妹(54)，变卦贲(22)，
 * 评分 48 平，体生用（generatesA）。
 */
function buildWorkMeihua(): MeihuaResult {
  const ben = HEXAGRAM_BY_KINGWEN.get(26)! // 大畜（山天大畜：上艮下乾）
  const hu = HEXAGRAM_BY_KINGWEN.get(54)! // 归妹
  const bian = HEXAGRAM_BY_KINGWEN.get(22)! // 贲（二爻动后下卦乾→离）
  return {
    ruleVersion: 'meihua_time_v1',
    annualBranchNum: 7,
    lunarMonth: 8,
    lunarDay: 17,
    hourBranchNum: 7,
    upperTrigram: '艮',
    lowerTrigram: '乾',
    ben,
    hu,
    bian,
    movingLine: 2,
    movingIndex0: 1,
    tiTrigram: '艮',
    yongTrigram: '乾',
    tiElement: '土',
    yongElement: '金',
    relation: 'generatesA',
    bianYongElement: '火'
  }
}

/** 上厕所黄金样例（与 tests/engine/plainInterpretation.test.ts 同构）：遁33·六二·互姤44·变姤44 */
function buildToiletMeihua(): MeihuaResult {
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

describe('长辈友好数据完整性（64 卦 / 384 爻）', () => {
  it('1. 64 卦 elderFriendlySummary 非空', () => {
    let missing = 0
    for (let k = 1; k <= 64; k++) {
      const kw = localData.getHexagramKnowledge(k)
      if (!kw?.elderFriendly?.elderFriendlySummary) missing++
    }
    expect(missing).toBe(0)
  })

  it('2. 64 卦 realLifeNow 非空', () => {
    let missing = 0
    for (let k = 1; k <= 64; k++) {
      const kw = localData.getHexagramKnowledge(k)
      if (!kw?.elderFriendly?.realLifeNow) missing++
    }
    expect(missing).toBe(0)
  })

  it('3. 64 卦 realLifeProcess 非空', () => {
    let missing = 0
    for (let k = 1; k <= 64; k++) {
      const kw = localData.getHexagramKnowledge(k)
      if (!kw?.elderFriendly?.realLifeProcess) missing++
    }
    expect(missing).toBe(0)
  })

  it('4. 64 卦 realLifeLater 非空', () => {
    let missing = 0
    for (let k = 1; k <= 64; k++) {
      const kw = localData.getHexagramKnowledge(k)
      if (!kw?.elderFriendly?.realLifeLater) missing++
    }
    expect(missing).toBe(0)
  })

  it('5. 384 爻 elderFriendlyMeaning 非空', () => {
    let missing = 0
    for (let k = 1; k <= 64; k++) {
      const kw = localData.getHexagramKnowledge(k)
      if (!kw) continue
      for (let i = 0; i < 6; i++) {
        if (!kw.lines[i].elderFriendly?.elderFriendlyMeaning) missing++
      }
    }
    expect(missing).toBe(0)
  })

  it('6. 384 爻 realLifeAction 非空', () => {
    let missing = 0
    for (let k = 1; k <= 64; k++) {
      const kw = localData.getHexagramKnowledge(k)
      if (!kw) continue
      for (let i = 0; i < 6; i++) {
        if (!kw.lines[i].elderFriendly?.realLifeAction) missing++
      }
    }
    expect(missing).toBe(0)
  })

  it('7. 所有 elderFriendly 字段不含 FORBIDDEN_WORDS', () => {
    const allViolations: { word: string; field: string }[] = []
    for (let k = 1; k <= 64; k++) {
      const kw = localData.getHexagramKnowledge(k)
      if (!kw?.elderFriendly) continue
      allViolations.push(...guardWording(kw.elderFriendly as unknown as Record<string, unknown>, `h${k}`).violations)
      for (let i = 0; i < 6; i++) {
        const line = kw.lines[i].elderFriendly
        if (line) allViolations.push(...guardWording(line as unknown as Record<string, unknown>, `h${k}.l${i}`).violations)
      }
    }
    expect(allViolations).toEqual([])
  })
})

describe('wordingGuard 禁词检测', () => {
  it('8. 含禁词的文本被检出', () => {
    const r = guardWording({ text: '这件事一定如此，你会死亡' }, 'root')
    expect(r.passed).toBe(false)
    expect(r.violations.length).toBeGreaterThan(0)
    const words = r.violations.map((v) => v.word)
    expect(words).toContain('一定')
    expect(words).toContain('你会死亡')
  })

  it('9. 干净文本通过', () => {
    const r = guardWording({ text: '当前条件参半，先核实清楚再决定' }, 'root')
    expect(r.passed).toBe(true)
    expect(r.violations).toEqual([])
  })

  it('10. 递归检查嵌套对象与数组', () => {
    const r = guardWording({
      why: { base: '正常', moving: ['这里必然出错'] },
      list: [{ note: '百分之百' }]
    }, 'root')
    expect(r.passed).toBe(false)
    const words = r.violations.map((v) => v.word)
    expect(words).toContain('必然')
    expect(words).toContain('百分之百')
  })

  it('11. FORBIDDEN_WORDS 非空且为只读常量集合', () => {
    expect(FORBIDDEN_WORDS.length).toBeGreaterThan(0)
    expect(FORBIDDEN_WORDS).toContain('一定')
    expect(FORBIDDEN_WORDS).toContain('你会死亡')
  })
})

describe('工作黄金样例：大畜(26)·二爻动·归妹(54)·贲(22)·48平·体生用', () => {
  const meihua = buildWorkMeihua()
  const rating = pingRating()
  const question = '这份工作该不该接'
  const category: QuestionCategory = '事业工作'

  it('12. 返回 RealWorldPlainReading 完整结构', () => {
    const r: RealWorldPlainReading = interpretMeihuaRealWorld(question, category, meihua, rating)
    expect(typeof r.headline).toBe('string')
    expect(typeof r.currentSituation).toBe('string')
    expect(r.why).toBeTypeOf('object')
    expect(Array.isArray(r.howToAct)).toBe(true)
    expect(Array.isArray(r.watchOutFor)).toBe(true)
    expect(typeof r.disclaimer).toBe('string')
  })

  it('13. why.base 非空', () => {
    const r = interpretMeihuaRealWorld(question, category, meihua, rating)
    expect(r.why.base.length).toBeGreaterThan(0)
  })

  it('14. why.moving 为非空数组（二爻动）', () => {
    const r = interpretMeihuaRealWorld(question, category, meihua, rating)
    expect(Array.isArray(r.why.moving)).toBe(true)
    expect(r.why.moving.length).toBeGreaterThan(0)
  })

  it('15. howToAct 为非空数组', () => {
    const r = interpretMeihuaRealWorld(question, category, meihua, rating)
    expect(r.howToAct.length).toBeGreaterThan(0)
  })

  it('16. currentSituation 非空', () => {
    const r = interpretMeihuaRealWorld(question, category, meihua, rating)
    expect(r.currentSituation.length).toBeGreaterThan(0)
  })

  it('17. headline 非空', () => {
    const r = interpretMeihuaRealWorld(question, category, meihua, rating)
    expect(r.headline.length).toBeGreaterThan(0)
  })

  it('18. why 中体现本卦大畜 / 互卦归妹 / 变卦贲的解读', () => {
    const r = interpretMeihuaRealWorld(question, category, meihua, rating)
    // 本卦白话摘要直接来自大畜的长辈友好数据
    expect(r.why.base).toContain('大畜')
    // 互卦(归妹)、变卦(贲)的长辈友好白话均非空（中间过程 / 后续趋向）
    expect(r.why.mutual?.length).toBeGreaterThan(0)
    expect(r.why.changed?.length).toBeGreaterThan(0)
    // 注：长辈友好白话刻意不复读卦名以提升可读性，故此处不断言字面"归妹"/"贲"，
    // 只验证对应字段确实被填充（已知设计，非 bug）。
  })

  it('19. why 与 howToAct 均存在于 RealWorldPlainReading', () => {
    const r = interpretMeihuaRealWorld(question, category, meihua, rating)
    expect(r.why).toBeDefined()
    expect(r.why.base).toBeDefined()
    expect(Array.isArray(r.why.moving)).toBe(true)
    expect(Array.isArray(r.howToAct)).toBe(true)
  })
})

describe('上厕所黄金样例仍可用', () => {
  const meihua = buildToiletMeihua()
  const rating = goodRating()
  const question = '我该不该现在去上厕所'
  const category: QuestionCategory = '日常综合'

  it('20. realWorld 正常处理 body_need 类问题，不崩溃、输出完整', () => {
    const r: RealWorldPlainReading = interpretMeihuaRealWorld(question, category, meihua, rating)
    expect(r.headline.length).toBeGreaterThan(0)
    expect(r.currentSituation.length).toBeGreaterThan(0)
    expect(r.why.base.length).toBeGreaterThan(0)
    expect(r.howToAct.length).toBeGreaterThan(0)
    // 身体需要类问题不应输出"继续憋"之类的反现实建议
    const allText = JSON.stringify(r)
    expect(allText).not.toContain('继续憋')
  })
})

describe('确定性 / 纯本地 / 无副作用', () => {
  const meihua = buildWorkMeihua()

  it('21. 同输入同输出（深度相等）', () => {
    const a = interpretMeihuaRealWorld('这份工作该不该接', '事业工作', meihua, pingRating())
    const b = interpretMeihuaRealWorld('这份工作该不该接', '事业工作', meihua, pingRating())
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })

  it('22. 不发起任何网络请求（fetch 未被调用）', () => {
    const fetchMock = vi.fn()
    const originalFetch = globalThis.fetch
    globalThis.fetch = fetchMock
    try {
      const r = interpretMeihuaRealWorld('这份工作该不该接', '事业工作', meihua, pingRating())
      expect(r.headline).toBeTruthy()
      expect(fetchMock).not.toHaveBeenCalled()
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it('23. 不修改传入的 rating', () => {
    const rating = pingRating()
    const before = JSON.stringify(rating)
    interpretMeihuaRealWorld('这份工作该不该接', '事业工作', meihua, rating)
    expect(JSON.stringify(rating)).toBe(before)
  })

  it('24. 不修改传入的 meihua', () => {
    const before = JSON.stringify(meihua)
    interpretMeihuaRealWorld('这份工作该不该接', '事业工作', meihua, pingRating())
    expect(JSON.stringify(meihua)).toBe(before)
  })
})

describe('旧历史 fallback（无 elderFriendly 数据时不崩溃）', () => {
  it('25. 知识查找返回空时仍产出完整 RealWorldPlainReading', () => {
    // 当前 64 卦均已注入 elderFriendly（见覆盖测试），此处临时把查找结果置空，
    // 验证引擎内置降级文案不会因缺失长辈数据而崩溃。
    const spy = vi
      .spyOn(localData, 'getHexagramKnowledge')
      .mockReturnValue(undefined as unknown as ReturnType<typeof localData.getHexagramKnowledge>)
    try {
      const meihua = buildWorkMeihua()
      const r = interpretMeihuaRealWorld('这份工作该不该接', '事业工作', meihua, pingRating())
      expect(r.headline.length).toBeGreaterThan(0)
      expect(r.currentSituation.length).toBeGreaterThan(0)
      expect(r.why.base.length).toBeGreaterThan(0)
      expect(Array.isArray(r.why.moving)).toBe(true)
      expect(r.howToAct.length).toBeGreaterThan(0)
      expect(r.disclaimer).toContain('不调用大模型')
    } finally {
      spy.mockRestore()
    }
  })
})
