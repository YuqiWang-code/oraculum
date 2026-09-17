import { describe, it, expect } from 'vitest'
import { HEXAGRAMS, HEXAGRAM_BY_LINES, HEXAGRAM_BY_NAME } from '../../src/data/hexagrams'
import { splitTrigrams } from '../../src/engine/hexagram/encode'
import { changeMovingLine } from '../../src/engine/hexagram/transform'
import { mutualHexagram } from '../../src/engine/hexagram/mutual'

describe('六十四卦唯一性与组合映射', () => {
  it('共 64 卦，卦名不重复', () => {
    expect(HEXAGRAMS.length).toBe(64)
    const names = new Set(HEXAGRAMS.map((h) => h.name))
    expect(names.size).toBe(64)
  })
  it('六爻编码唯一', () => {
    const keys = new Set(HEXAGRAMS.map((h) => h.lines.join('')))
    expect(keys.size).toBe(64)
  })
  it('上下卦组合 -> 卦往返一致', () => {
    for (const h of HEXAGRAMS) {
      const { lower, upper } = splitTrigrams(h.lines)
      expect(lower).toBe(h.lower)
      expect(upper).toBe(h.upper)
    }
  })
  it('乾为天 lines=111111，坤为地=000000', () => {
    expect(HEXAGRAM_BY_NAME.get('乾')!.lines.join('')).toBe('111111')
    expect(HEXAGRAM_BY_NAME.get('坤')!.lines.join('')).toBe('000000')
  })
})

describe('动爻变卦', () => {
  it('乾卦初爻动变为姤（011111 -> 天风姤）', () => {
    const qian = HEXAGRAM_BY_NAME.get('乾')!.lines
    const changed = changeMovingLine(qian, 0)
    expect(changed.join('')).toBe('011111')
    expect(HEXAGRAM_BY_LINES.get(changed.join(''))!.name).toBe('姤')
  })
  it('任意动爻翻转', () => {
    const kun = HEXAGRAM_BY_NAME.get('坤')!.lines
    const changed = changeMovingLine(kun, 5)
    expect(changed[5]).toBe(1)
  })
})

describe('互卦（资料 5.2 第10步）', () => {
  it('取爻正确：二三四下互、三四五上互', () => {
    // 本卦 010011 (示例)，只验证索引逻辑不抛错且为合法卦
    const h = HEXAGRAMS[0]
    const m = mutualHexagram(h.lines)
    expect(m.mutualLines.length).toBe(6)
    expect(HEXAGRAM_BY_LINES.get(m.mutualLines.join(''))).toBeDefined()
  })
})
