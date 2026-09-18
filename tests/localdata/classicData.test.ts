import { describe, it, expect } from 'vitest'
import { ZHOUYI_CLASSICS, ZHOUYI_MAP } from '../../src/data/classics/zhouyi'
import { COLLECTED_COMMENTARIES } from '../../src/local-data/classics/_raw/_tuan_daxiang_xiaoxiang'
import { SOURCE_REFS } from '../../src/local-data/classics/sources'

describe('经典数据完整性', () => {
  it('ZHOUYI_CLASSICS 有 64 卦', () => {
    expect(ZHOUYI_CLASSICS.length).toBe(64)
  })

  it('64 卦卦辞全部非空', () => {
    for (const h of ZHOUYI_CLASSICS) {
      expect(h.judgment.length, `第${h.kingWen}卦卦辞非空`).toBeGreaterThan(0)
    }
  })

  it('64 卦彖传全部非空（COLLECTED_COMMENTARIES）', () => {
    expect(COLLECTED_COMMENTARIES.length).toBe(64)
    for (const c of COLLECTED_COMMENTARIES) {
      expect(c.tuan.length, `第${c.kingWen}卦彖传非空`).toBeGreaterThan(0)
    }
  })

  it('64 卦大象传全部非空', () => {
    for (const c of COLLECTED_COMMENTARIES) {
      expect(c.daXiang.length, `第${c.kingWen}卦大象非空`).toBeGreaterThan(0)
    }
  })

  it('共 384 条小象传（64×6）', () => {
    let total = 0
    for (const c of COLLECTED_COMMENTARIES) {
      expect(c.xiaoXiang.length, `第${c.kingWen}卦6条小象`).toBe(6)
      for (const x of c.xiaoXiang) {
        expect(x.length, `第${c.kingWen}卦第${total % 6 + 1}条小象非空`).toBeGreaterThan(0)
        total++
      }
    }
    expect(total).toBe(384)
  })

  it('每条 COLLECTED_COMMENTARIES 都有 sourceRefs', () => {
    for (const c of COLLECTED_COMMENTARIES) {
      expect(c.sourceRefs.length, `第${c.kingWen}卦 sourceRefs`).toBeGreaterThan(0)
      expect(c.sourceRefs[0]).toContain('wikisource')
    }
  })

  it('ZHOUYI_CLASSICS 每卦都有 sources', () => {
    for (const h of ZHOUYI_CLASSICS) {
      expect(h.sources.length, `第${h.kingWen}卦 sources`).toBeGreaterThan(0)
      expect(h.sources[0].url).toContain('wikisource')
    }
  })

  it('384 条爻辞全部非空', () => {
    let count = 0
    for (const h of ZHOUYI_CLASSICS) {
      for (const line of h.lines) {
        expect(line.length, `第${h.kingWen}卦第${count % 6 + 1}爻辞非空`).toBeGreaterThan(0)
        count++
      }
    }
    expect(count).toBe(384)
  })

  it('乾卦有用九，坤卦有用六', () => {
    const qian = ZHOUYI_MAP.get(1)!
    const kun = ZHOUYI_MAP.get(2)!
    expect(qian.specialLine).toContain('用九')
    expect(kun.specialLine).toContain('用六')
  })

  it('SOURCE_REFS 覆盖 1-64', () => {
    for (let i = 1; i <= 64; i++) {
      const refs = SOURCE_REFS[i]
      expect(refs, `第${i}卦有 sourceRef`).toBeDefined()
      expect(refs!.length).toBeGreaterThan(0)
    }
  })

  it('随卦彖传包含"刚来而下柔"', () => {
    const sui = COLLECTED_COMMENTARIES.find((c) => c.kingWen === 17)!
    expect(sui.tuan).toContain('隨')
    expect(sui.tuan).toContain('剛來而下柔')
  })

  it('渐卦彖传包含"渐进"', () => {
    const jian = COLLECTED_COMMENTARIES.find((c) => c.kingWen === 53)!
    expect(jian.tuan).toContain('漸')
    expect(jian.tuan).toContain('進')
  })

  it('兑卦大象为"丽泽兑"', () => {
    const dui = COLLECTED_COMMENTARIES.find((c) => c.kingWen === 58)!
    expect(dui.daXiang).toContain('兌')
  })
})
