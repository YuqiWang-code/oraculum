import type { SixSourcePayload, TrigramName } from '../../types'
import { mod8, mod6 } from './common'
import { TRIGRAM_BY_NUMBER } from '../../data/trigrams'
import type { MeihuaCastingResult } from './common'

/**
 * 六源合参 six_source_hybrid_v1（资料 v2 第9节，本项目实验规则，非古籍原法）
 * 固定字段序序列化 -> FNV-1a 派生三个 32-bit H1/H2/H3 -> 上下卦动爻。
 * 纯本地、确定性、不调云端；同一 payload 必得同一卦。
 */

/** FNV-1a 32-bit hash */
function fnv1a(str: string, seed = 0x811c9dc5): number {
  let h = seed >>> 0
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h >>> 0
}

/** 固定字段顺序 canonical 序列化 */
export function canonicalize(payload: SixSourcePayload): string {
  return JSON.stringify({
    version: payload.version,
    exactTime: payload.exactTime,
    secondOfHour: payload.secondOfHour,
    randomNumber: payload.randomNumber,
    dice: { d8: payload.dice.d8, d6: payload.dice.d6 },
    omen: { kind: payload.omen.kind, value: payload.omen.value, trigramNumber: payload.omen.trigramNumber },
    text: { normalized: payload.text.normalized, graphemeCount: payload.text.graphemeCount },
    coin: { coins: payload.coin.coins.slice(), sum: payload.coin.sum }
  })
}

/** 由 canonical 字符串派生三个独立哈希 */
export function deriveHashes(canonical: string): { h1: number; h2: number; h3: number } {
  // 用不同种子派生，保证三段独立且可测
  return {
    h1: fnv1a(canonical, 0x811c9dc5),
    h2: fnv1a(canonical, 0x01000193),
    h3: fnv1a(canonical, 0xdeadbeef)
  }
}

export interface SixSourceResult extends MeihuaCastingResult {
  payload: SixSourcePayload
  canonical: string
  h1: number
  h2: number
  h3: number
}

export function castBySixSources(payload: SixSourcePayload): SixSourceResult {
  const canonical = canonicalize(payload)
  const { h1, h2, h3 } = deriveHashes(canonical)
  const upperNum = mod8(h1)
  const lowerNum = mod8(h2)
  const moving = mod6(h3) as 1 | 2 | 3 | 4 | 5 | 6
  const upper: TrigramName = TRIGRAM_BY_NUMBER[upperNum]
  const lower: TrigramName = TRIGRAM_BY_NUMBER[lowerNum]

  return {
    upperTrigram: upper,
    lowerTrigram: lower,
    movingLine: moving,
    movingIndex0: moving - 1,
    castingRuleVersion: 'six_source_hybrid_v1',
    payload,
    canonical,
    h1, h2, h3,
    evidence: {
      source: 'time',
      ruleVersion: 'six_source_hybrid_v1',
      raw: payload,
      normalized: { canonical, h1, h2, h3, upperNum, lowerNum, moving },
      explanation: `六点原始值 -> canonical -> FNV-1a 派生 H1=${h1},H2=${h2},H3=${h3}；上卦mod8(H1)=${upperNum}，下卦mod8(H2)=${lowerNum}，动爻mod6(H3)=${moving}（本项目实验规则，非古籍原法）`
    }
  }
}
