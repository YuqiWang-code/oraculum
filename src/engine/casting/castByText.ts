import { mod8, mod6, MeihuaCastingResult } from './common'
import { TRIGRAM_BY_NUMBER } from '../../data/trigrams'
import type { TrigramName } from '../../types'

/**
 * 文字字数起卦 meihua_text_count_v1（资料 v2 第7节）
 * 只支持 11–100 个有效 grapheme；短字占涉及笔画/声调，未引入未核验笔画表，不硬算。
 */
export interface TextResult extends MeihuaCastingResult {
  normalized: string
  graphemeCount: number
  upperCount: number
  lowerCount: number
}

/** 归一化：NFKC、去空白、去纯标点 */
export function normalizeText(input: string): string {
  let s = input.normalize('NFKC')
  // 去掉所有空白
  s = s.replace(/\s+/g, '')
  // 去掉常见中英文标点
  s = s.replace(/[，。！？；：、""''（）【】《》…—·,.!?;:"'()[\]<>~`@#$%^&*\-_=+|\\/]/g, '')
  return s
}

/** 数 grapheme；Intl.Segmenter 不可用时 fallback 为 Array.from(按码点) */
export function countGraphemes(s: string): number {
  const Seg = (Intl as unknown as { Segmenter?: new (l: string, o: { granularity: string }) => { segment(x: string): Iterable<unknown> } }).Segmenter
  if (Seg) {
    const seg = new Seg(undefined as unknown as string, { granularity: 'grapheme' })
    let n = 0
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const _ of seg.segment(s)) n++
    return n
  }
  return Array.from(s).length
}

export function castByText(rawText: string): TextResult {
  const normalized = normalizeText(rawText)
  const N = countGraphemes(normalized)
  const upperCount = Math.floor(N / 2)
  const lowerCount = Math.ceil(N / 2)
  const upperNum = mod8(upperCount)
  const lowerNum = mod8(lowerCount)
  const moving = mod6(N) as 1 | 2 | 3 | 4 | 5 | 6
  const upper: TrigramName = TRIGRAM_BY_NUMBER[upperNum]
  const lower: TrigramName = TRIGRAM_BY_NUMBER[lowerNum]
  return {
    upperTrigram: upper,
    lowerTrigram: lower,
    movingLine: moving,
    movingIndex0: moving - 1,
    castingRuleVersion: 'meihua_text_count_v1',
    normalized,
    graphemeCount: N,
    upperCount,
    lowerCount,
    evidence: {
      source: 'text',
      ruleVersion: 'meihua_text_count_v1',
      raw: { rawText },
      normalized: { normalized, N, upperCount, lowerCount, upperNum, lowerNum, moving },
      explanation: `原文归一化后有效字数 N=${N}（上${upperCount}/下${lowerCount}）；上卦mod8(${upperCount})=${upperNum}，下卦mod8(${lowerCount})=${lowerNum}，动爻mod6(${N})=${moving}`
    }
  }
}
