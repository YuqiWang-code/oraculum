/**
 * 京房八宫 / 《易隐》十六变 引擎测试（v4.3）
 * 纯本地、离线、确定性。
 *
 * 严格区分来源层：
 *  - 京房八宫核心（本宫/一世~五世/游魂/归魂）
 *  - 《易隐》后世扩展（外戒/内戒/绝命/血脉/肌肉/骸骨/棺椁/冢墓）
 * "绝命/棺椁/冢墓"是历史术语，不预测死亡疾病。
 */
import { describe, it, expect } from 'vitest'
import {
  FLIP_SEQUENCE,
  SIXTEEN_STAGES,
  HISTORICAL_TERMS,
  HISTORICAL_TERM_DISCLAIMER,
  transformSixteen,
  getPalaceBaseLines,
  SOURCE_LAYER_NOTES,
  SIXTEEN_TRANSFORM_SOURCE_NOTE,
  NO_AGE_MAPPING_NOTE,
  buildStepReadings
} from '../../src/engine/fortune'
import type { SixteenTransformResult, TransformStep } from '../../src/engine/fortune'

const EIGHT_PALACES = ['乾', '兑', '离', '震', '巽', '坎', '艮', '坤'] as const

describe('翻爻序列', () => {
  it('1. FLIP_SEQUENCE 长度为 16', () => {
    expect(FLIP_SEQUENCE.length).toBe(16)
  })

  it('2. 翻爻位置均在 1-6 范围内', () => {
    for (const pos of FLIP_SEQUENCE) {
      expect(pos).toBeGreaterThanOrEqual(1)
      expect(pos).toBeLessThanOrEqual(6)
    }
  })
})

describe('乾宫黄金序列', () => {
  const base = getPalaceBaseLines('乾')!
  const r: SixteenTransformResult = transformSixteen(base)

  it('3. 卦名序列精确为：乾 姤 遁 否 观 剥 晋 旅 鼎 大有 离 噬嗑 颐 益 无妄 同人 乾', () => {
    expect(r.steps.map((s) => s.hexagramName)).toEqual([
      '乾', '姤', '遁', '否', '观', '剥', '晋', '旅',
      '鼎', '大有', '离', '噬嗑', '颐', '益', '无妄', '同人', '乾'
    ])
  })

  it('4. 共 17 个状态（初始本宫 + 16 次变化）', () => {
    expect(r.steps.length).toBe(17)
  })

  it('5. 最终回到本宫 returnsToBase === true', () => {
    expect(r.returnsToBase).toBe(true)
  })
})

describe('八宫全部可还原', () => {
  it('6. 遍历八宫，每个宫第 16 步卦名等于本宫卦名', () => {
    for (const palace of EIGHT_PALACES) {
      const base = getPalaceBaseLines(palace)
      expect(base).not.toBeNull()
      const r = transformSixteen(base!)
      expect(r.returnsToBase).toBe(true)
      expect(r.baseName).toBe(palace)
      expect(r.steps[r.steps.length - 1].hexagramName).toBe(palace)
    }
  })
})

describe('单步翻爻正确性', () => {
  it('7. 每步与上一步相比，只有 FLIP_SEQUENCE[i-1] 位置的爻变化', () => {
    for (const palace of EIGHT_PALACES) {
      const base = getPalaceBaseLines(palace)!
      const r = transformSixteen(base)
      for (let i = 1; i < r.steps.length; i++) {
        const prev = r.steps[i - 1].lines
        const curr = r.steps[i].lines
        const changedIdx = FLIP_SEQUENCE[i - 1] - 1
        const diffs: number[] = []
        for (let j = 0; j < 6; j++) {
          if (prev[j] !== curr[j]) diffs.push(j)
        }
        expect(diffs).toEqual([changedIdx])
        // 变化必须是 0↔1 翻转
        expect(curr[changedIdx]).not.toBe(prev[changedIdx])
      }
    }
  })

  it('8. 初始本宫 flippedLine 为 0，其余步等于本次翻爻位', () => {
    const r = transformSixteen(getPalaceBaseLines('乾')!)
    expect(r.steps[0].flippedLine).toBe(0)
    for (let i = 1; i < r.steps.length; i++) {
      expect(r.steps[i].flippedLine).toBe(FLIP_SEQUENCE[i - 1])
    }
  })
})

describe('阶段标签与来源层', () => {
  const r = transformSixteen(getPalaceBaseLines('乾')!)

  it('9. steps[i].stage.name 与 SIXTEEN_STAGES[i].name 一致', () => {
    expect(r.steps.length).toBe(SIXTEEN_STAGES.length)
    for (let i = 0; i < r.steps.length; i++) {
      expect(r.steps[i].stage.name).toBe(SIXTEEN_STAGES[i].name)
    }
  })

  it('10. 京房八宫核心阶段 sourceLayer = jingfang-eight-palace', () => {
    const coreNames = ['本宫', '一世', '二世', '三世', '四世', '五世', '游魂', '归魂']
    for (const name of coreNames) {
      const stage = SIXTEEN_STAGES.find((s) => s.name === name)
      expect(stage, `缺少阶段 ${name}`).toBeDefined()
      expect(stage!.sourceLayer).toBe('jingfang-eight-palace')
    }
  })

  it('11. 《易隐》后世扩展阶段 sourceLayer = yiyin-sixteen-extension', () => {
    const extNames = ['外戒', '内戒', '绝命', '血脉', '肌肉', '骸骨', '棺椁', '冢墓']
    for (const name of extNames) {
      const stage = SIXTEEN_STAGES.find((s) => s.name === name)
      expect(stage, `缺少阶段 ${name}`).toBeDefined()
      expect(stage!.sourceLayer).toBe('yiyin-sixteen-extension')
    }
  })

  it('12. 还原阶段为项目规范化来源层', () => {
    const final = SIXTEEN_STAGES[SIXTEEN_STAGES.length - 1]
    expect(final.name).toBe('还原')
    expect(final.sourceLayer).toBe('oraculum-normalization')
  })
})

describe('历史术语保护（不预测死亡/疾病）', () => {
  it('13. 所有阶段 modernNote 不含死亡/重病预测用语', () => {
    const banned = ['你会死亡', '某年去世', '必患重病', '某年重病', '寿命到这里', '必死']
    for (const stage of SIXTEEN_STAGES) {
      for (const b of banned) {
        expect(stage.modernNote, `阶段"${stage.name}"含禁词"${b}"`).not.toContain(b)
      }
    }
  })

  it('14. "绝命/棺椁/冢墓"等历史术语有保护提示', () => {
    expect(HISTORICAL_TERMS).toContain('绝命')
    expect(HISTORICAL_TERMS).toContain('棺椁')
    expect(HISTORICAL_TERMS).toContain('冢墓')
    expect(HISTORICAL_TERM_DISCLAIMER).toContain('不表示现实死亡')
  })

  it('15. 绝命阶段的现代说明明确"不表示现实死亡"', () => {
    const jm = SIXTEEN_STAGES.find((s) => s.name === '绝命')!
    expect(jm.modernNote).toContain('不表示现实死亡')
  })
})

describe('不自动映射年龄', () => {
  it('16. TransformStep 运行时不含 age 字段（结构检查）', () => {
    const r = transformSixteen(getPalaceBaseLines('坤')!)
    for (const step of r.steps) {
      expect('age' in (step as unknown as Record<string, unknown>)).toBe(false)
      expect('每岁' in (step as unknown as Record<string, unknown>)).toBe(false)
    }
  })

  it('17. NO_AGE_MAPPING_NOTE 明确不按年龄平均分配', () => {
    expect(NO_AGE_MAPPING_NOTE).toBeTruthy()
    expect(NO_AGE_MAPPING_NOTE).toContain('不自动映射')
  })
})

describe('来源可追溯（常量存在性）', () => {
  it('18. SOURCE_LAYER_NOTES 同时标注京房核心与《易隐》扩展', () => {
    expect(SOURCE_LAYER_NOTES['jingfang-eight-palace']).toBeDefined()
    expect(SOURCE_LAYER_NOTES['yiyin-sixteen-extension']).toBeDefined()
    expect(SOURCE_LAYER_NOTES['oraculum-normalization']).toBeDefined()
  })

  it('19. SIXTEEN_TRANSFORM_SOURCE_NOTE 区分两个来源层', () => {
    expect(SIXTEEN_TRANSFORM_SOURCE_NOTE).toContain('京房')
    expect(SIXTEEN_TRANSFORM_SOURCE_NOTE).toContain('易隐')
  })

  it('20. 阶段结构稳定：每项含 stage/lines/hexagramName/kingWen', () => {
    const r = transformSixteen(getPalaceBaseLines('坎')!)
    for (const step of r.steps) {
      const s = step as TransformStep
      expect(s.stage).toBeDefined()
      expect(s.lines.length).toBe(6)
      expect(typeof s.hexagramName).toBe('string')
      expect(typeof s.kingWen).toBe('number')
    }
  })
})

describe('归魂翻爻位（不手写）', () => {
  it('21. 归魂（index 9）flippedLine = 1（初爻），非"三爻再变"', () => {
    const r = transformSixteen(getPalaceBaseLines('乾')!)
    const guihun = r.steps[9]
    expect(guihun.stage.name).toBe('归魂')
    expect(guihun.flippedLine).toBe(1)
  })

  it('22. 归魂 modernNote 不再手写具体爻位', () => {
    const guihun = SIXTEEN_STAGES.find((s) => s.name === '归魂')!
    expect(guihun.modernNote).not.toContain('三爻再变')
  })
})

describe('buildStepReadings', () => {
  it('23. 17 步 reading 全部非空', () => {
    const r = transformSixteen(getPalaceBaseLines('乾')!)
    const readings = buildStepReadings(r)
    expect(readings.length).toBe(17)
    for (const rd of readings) {
      expect(rd.transition).toBeTruthy()
      expect(rd.stageMeaning).toBeTruthy()
      expect(rd.hexagramMeaning).toBeTruthy()
      expect(rd.structuralChange).toBeTruthy()
    }
  })

  it('24. 每步 hexagramMeaning 来自实际当前卦', () => {
    const r = transformSixteen(getPalaceBaseLines('乾')!)
    const readings = buildStepReadings(r)
    for (let i = 0; i < readings.length; i++) {
      // transition 的末段应为当前卦名
      expect(readings[i].transition).toContain(r.steps[i].hexagramName)
    }
  })

  it('25. 不同宫同 index 的解读不完全相同（随卦变化）', () => {
    const qian = buildStepReadings(transformSixteen(getPalaceBaseLines('乾')!))
    const kun = buildStepReadings(transformSixteen(getPalaceBaseLines('坤')!))
    // 至少 transition 或 hexagramMeaning 有差异
    const diff = qian.filter((q, i) => q.hexagramMeaning !== kun[i].hexagramMeaning)
    expect(diff.length).toBeGreaterThan(0)
  })

  it('26. structuralChange 描述阳转阴/阴转阳', () => {
    const r = transformSixteen(getPalaceBaseLines('乾')!)
    const readings = buildStepReadings(r)
    // 乾宫第一步（姤）是初爻由阳转阴
    expect(readings[1].structuralChange).toContain('阳')
    expect(readings[1].structuralChange).toContain('阴')
  })
})

describe('历史术语保护（reading 层）', () => {
  it('27. 所有 reading 不含死亡/重病预测', () => {
    const banned = ['你会死亡', '某年去世', '必患重病', '必死']
    for (const palace of EIGHT_PALACES) {
      const readings = buildStepReadings(transformSixteen(getPalaceBaseLines(palace)!))
      for (const rd of readings) {
        const text = rd.hexagramMeaning + rd.stageMeaning
        for (const b of banned) {
          expect(text).not.toContain(b)
        }
      }
    }
  })
})
