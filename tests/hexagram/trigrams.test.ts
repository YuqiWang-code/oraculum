import { describe, it, expect } from 'vitest'
import { TRIGRAMS, TRIGRAM_BY_NUMBER, trigramFromLines } from '../../src/data/trigrams'

describe('八卦编码（资料 2.2）', () => {
  it('8 卦全覆盖', () => {
    expect(Object.keys(TRIGRAMS).length).toBe(8)
  })
  it('先天数映射正确', () => {
    expect(TRIGRAM_BY_NUMBER[1]).toBe('乾')
    expect(TRIGRAM_BY_NUMBER[8]).toBe('坤')
  })
  it('三爻编码自下而上正确', () => {
    // 乾 111, 坤 000, 坎 010
    expect(TRIGRAMS['乾'].lines.join('')).toBe('111')
    expect(TRIGRAMS['坤'].lines.join('')).toBe('000')
    expect(TRIGRAMS['坎'].lines.join('')).toBe('010')
  })
  it('lines -> trigram 往返', () => {
    for (const name of Object.keys(TRIGRAMS) as (keyof typeof TRIGRAMS)[]) {
      expect(trigramFromLines(TRIGRAMS[name].lines)).toBe(name)
    }
  })
})
