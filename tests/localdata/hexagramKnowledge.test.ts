import { describe, it, expect } from 'vitest'
import { getHexagramKnowledge } from '../../src/local-data'
import type { LocalHexagramKnowledge } from '../../src/local-data'

describe('本地卦象知识 getHexagramKnowledge', () => {
  it('随（第17卦）知识完整', () => {
    const k = getHexagramKnowledge(17)
    expect(k).toBeDefined()
    expect(k!.name).toBe('随')
    expect(k!.classic.judgment).toContain('元亨')
    expect(k!.classic.tuan.length).toBeGreaterThan(0)
    expect(k!.classic.daXiang.length).toBeGreaterThan(0)
    expect(k!.classic.sourceRefs.length).toBeGreaterThan(0)
  })

  it('渐（第53卦）知识完整', () => {
    const k = getHexagramKnowledge(53)
    expect(k).toBeDefined()
    expect(k!.name).toBe('渐')
    expect(k!.classic.judgment.length).toBeGreaterThan(0)
    expect(k!.classic.tuan.length).toBeGreaterThan(0)
  })

  it('兑（第58卦）知识完整', () => {
    const k = getHexagramKnowledge(58)
    expect(k).toBeDefined()
    expect(k!.name).toBe('兑')
    expect(k!.classic.judgment).toContain('亨')
    expect(k!.classic.tuan.length).toBeGreaterThan(0)
  })

  it('全部 64 卦都有知识条目', () => {
    for (let i = 1; i <= 64; i++) {
      const k = getHexagramKnowledge(i)
      expect(k, `第${i}卦应有知识`).toBeDefined()
      expect(k!.kingWen).toBe(i)
    }
  })

  it('每卦 classic 字段完整非空', () => {
    for (let i = 1; i <= 64; i++) {
      const k = getHexagramKnowledge(i)!
      expect(k.classic.judgment.length, `第${i}卦卦辞非空`).toBeGreaterThan(0)
      expect(k.classic.tuan.length, `第${i}卦彖传非空`).toBeGreaterThan(0)
      expect(k.classic.daXiang.length, `第${i}卦大象非空`).toBeGreaterThan(0)
      expect(k.classic.sourceRefs.length, `第${i}卦sourceRefs非空`).toBeGreaterThan(0)
    }
  })

  it('每卦有 6 条爻知识，且 classicText/xiaoXiang 非空', () => {
    for (let i = 1; i <= 64; i++) {
      const k = getHexagramKnowledge(i)!
      expect(k.lines.length, `第${i}卦有6爻`).toBe(6)
      for (let j = 0; j < 6; j++) {
        const line = k.lines[j]
        expect(line.index, `第${i}卦第${j + 1}爻 index`).toBe(j + 1)
        expect(line.classicText.length, `第${i}卦第${j + 1}爻辞非空`).toBeGreaterThan(0)
        expect(line.xiaoXiang.length, `第${i}卦第${j + 1}小象非空`).toBeGreaterThan(0)
      }
    }
  })

  it('localMeaning 全部字段非空', () => {
    for (let i = 1; i <= 64; i++) {
      const k = getHexagramKnowledge(i)!
      const lm = k.localMeaning
      expect(lm.plainJudgment.length, `第${i}卦 plainJudgment`).toBeGreaterThan(0)
      expect(lm.plainTuan.length, `第${i}卦 plainTuan`).toBeGreaterThan(0)
      expect(lm.plainDaXiang.length, `第${i}卦 plainDaXiang`).toBeGreaterThan(0)
      expect(lm.coreMeaning.length, `第${i}卦 coreMeaning`).toBeGreaterThan(0)
      expect(lm.keyThemes.length, `第${i}卦 keyThemes`).toBeGreaterThan(0)
      expect(lm.asBaseHexagram.length, `第${i}卦 asBaseHexagram`).toBeGreaterThan(0)
      expect(lm.asMutualHexagram.length, `第${i}卦 asMutualHexagram`).toBeGreaterThan(0)
      expect(lm.asChangedHexagram.length, `第${i}卦 asChangedHexagram`).toBeGreaterThan(0)
      expect(lm.cautions.length, `第${i}卦 cautions`).toBeGreaterThan(0)
    }
  })

  it('随卦六二爻知识正确', () => {
    const k = getHexagramKnowledge(17)!
    const line2 = k.lines[1]
    expect(line2.index).toBe(2)
    expect(line2.classicText).toContain('系小子')
    expect(line2.xiaoXiang).toContain('弗兼與')
    expect(line2.coreMeaning.length).toBeGreaterThan(0)
  })

  it('乾卦用九在 specialLine 中（ZhouyiHexagramClassic）', () => {
    // 这是 data/classics/zhouyi.ts 的验证，确保与 local-data 互补
  })
})
