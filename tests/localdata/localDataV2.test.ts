import { describe, it, expect } from 'vitest'
import { getHexagramKnowledge, LINE_POSITION_MEANINGS } from '../../src/local-data'
import type { LocalHexagramKnowledge } from '../../src/local-data'

/**
 * Phase 17：本地数据 v2 测试
 * 覆盖爻位措辞、themeKeyword 非空、数据完整性。
 */

describe('爻位措辞：不凭位置空说"居中得正"', () => {
  it('LINE_POSITION_MEANINGS 二爻不出现"居中得正"，应为"下卦中位"', () => {
    const m2 = LINE_POSITION_MEANINGS[2]
    expect(m2.meaning).not.toContain('居中得正')
    expect(m2.meaning).toContain('下卦中位')
  })
  it('LINE_POSITION_MEANINGS 五爻不出现"居中得正"，应为"上卦中位"', () => {
    const m5 = LINE_POSITION_MEANINGS[5]
    expect(m5.meaning).not.toContain('居中得正')
    expect(m5.meaning).toContain('上卦中位')
  })

  it('遍历 64 卦二爻/五爻 plainText 不含"居中得正"', () => {
    // 回归守卫：白话爻辞 plainText 不得仅凭位置就说"居中得正"。
    // 注：coreMeaning 中对真正的九五/六二等经典"中正"用法保留原文，不在此断言。
    for (let i = 1; i <= 64; i++) {
      const k = getHexagramKnowledge(i)!
      for (const idx of [1, 4]) {
        const line = k.lines[idx]
        expect(line.plainText, `第${i}卦第${idx + 1}爻 plainText`).not.toContain('居中得正')
      }
    }
  })
})

describe('384 条爻知识 themeKeyword 非空', () => {
  it('64 卦 × 6 爻 = 384 条 themeKeyword 均为非空字符串', () => {
    let count = 0
    for (let i = 1; i <= 64; i++) {
      const k = getHexagramKnowledge(i)!
      for (const line of k.lines) {
        expect(typeof line.themeKeyword, `第${i}卦第${line.index}爻 themeKeyword 类型`).toBe('string')
        expect(line.themeKeyword.trim().length, `第${i}卦第${line.index}爻 themeKeyword 非空`).toBeGreaterThan(0)
        count++
      }
    }
    expect(count).toBe(384)
  })
})

describe('local-data 经典字段完整性（validate 覆盖）', () => {
  it('每卦 classic 均有 judgment/tuan/daXiang/sourceRefs 非空', () => {
    for (let i = 1; i <= 64; i++) {
      const k: LocalHexagramKnowledge = getHexagramKnowledge(i)!
      expect(k.classic.judgment.length, `第${i}卦 judgment`).toBeGreaterThan(0)
      expect(k.classic.tuan.length, `第${i}卦 tuan`).toBeGreaterThan(0)
      expect(k.classic.daXiang.length, `第${i}卦 daXiang`).toBeGreaterThan(0)
      expect(k.classic.sourceRefs.length, `第${i}卦 sourceRefs`).toBeGreaterThan(0)
    }
  })
})

describe('64 卦知识完整', () => {
  it('导出知识覆盖 1-64，每卦 6 爻，每爻 classicText/xiaoXiang/plainText 非空', () => {
    for (let i = 1; i <= 64; i++) {
      const k = getHexagramKnowledge(i)!
      expect(k, `第${i}卦存在`).toBeDefined()
      expect(k.lines.length).toBe(6)
      for (const line of k.lines) {
        expect(line.classicText.length, `第${i}卦第${line.index}爻 classicText`).toBeGreaterThan(0)
        expect(line.xiaoXiang.length, `第${i}卦第${line.index}爻 xiaoXiang`).toBeGreaterThan(0)
        expect(line.plainText.length, `第${i}卦第${line.index}爻 plainText`).toBeGreaterThan(0)
      }
    }
  })
})
