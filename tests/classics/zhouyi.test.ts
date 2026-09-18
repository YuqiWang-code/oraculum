import { describe, it, expect } from 'vitest'
import { HEXAGRAMS } from '../../src/data/hexagrams'
import { ZHOUYI_CLASSICS, ZHOUYI_MAP } from '../../src/data/classics/zhouyi'

describe('经典数据 v3.2', () => {
  it('64 卦全部存在', () => {
    expect(ZHOUYI_CLASSICS.length).toBe(64)
  })

  it('每卦有非空卦辞', () => {
    for (const h of ZHOUYI_CLASSICS) {
      expect(h.judgment.length).toBeGreaterThan(0)
    }
  })

  it('共 384 条爻辞', () => {
    let count = 0
    for (const h of ZHOUYI_CLASSICS) {
      for (const l of h.lines) {
        expect(l.length).toBeGreaterThan(0)
        count++
      }
    }
    expect(count).toBe(384)
  })

  it('乾卦有卦辞和用九', () => {
    const qian = ZHOUYI_MAP.get(1)!
    expect(qian.judgment).toContain('元亨')
    expect(qian.specialLine).toContain('用九')
  })

  it('坤卦有用六', () => {
    const kun = ZHOUYI_MAP.get(2)!
    expect(kun.specialLine).toContain('用六')
  })

  it('所有卦 verified=true', () => {
    for (const h of ZHOUYI_CLASSICS) {
      expect(h.verified).toBe(true)
    }
  })

  it('与 HEXAGRAMS 合并后 needsVerify=false', () => {
    for (const h of HEXAGRAMS) {
      expect(h.needsVerify).toBe(false)
      expect(h.judgmentClassic.length).toBeGreaterThan(0)
      expect(h.lineTextsClassic.filter((l) => l.length > 0).length).toBe(6)
    }
  })

  it('来源完整', () => {
    for (const h of ZHOUYI_CLASSICS) {
      expect(h.sources.length).toBeGreaterThan(0)
      expect(h.sources[0].url).toContain('wikisource')
    }
  })
})
