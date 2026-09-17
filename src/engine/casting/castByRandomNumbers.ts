import { secureRandomInt } from './secureRandom'
import { mod8, mod6, MeihuaCastingResult } from './common'
import { TRIGRAM_BY_NUMBER } from '../../data/trigrams'
import type { TrigramName } from '../../types'

/**
 * 随机数起卦 meihua_random_numbers_v1（资料 v2 第4节）
 * N1,N2,N3 ∈ [1,9999]
 * 上卦=mod8(N1)，下卦=mod8(N2)，动爻=mod6(N1+N2+N3)
 */
export interface RandomResult extends MeihuaCastingResult {
  numbers: [number, number, number]
}

export function rollRandomNumbers(): [number, number, number] {
  return [secureRandomInt(1, 9999), secureRandomInt(1, 9999), secureRandomInt(1, 9999)]
}

export function castByRandomNumbers(numbers: [number, number, number]): RandomResult {
  const [n1, n2, n3] = numbers
  const upperNum = mod8(n1)
  const lowerNum = mod8(n2)
  const moving = mod6(n1 + n2 + n3) as 1 | 2 | 3 | 4 | 5 | 6
  const upper: TrigramName = TRIGRAM_BY_NUMBER[upperNum]
  const lower: TrigramName = TRIGRAM_BY_NUMBER[lowerNum]

  return {
    upperTrigram: upper,
    lowerTrigram: lower,
    movingLine: moving,
    movingIndex0: moving - 1,
    castingRuleVersion: 'meihua_random_numbers_v1',
    numbers,
    evidence: {
      source: 'random',
      ruleVersion: 'meihua_random_numbers_v1',
      raw: { numbers },
      normalized: { upperNum, lowerNum, moving, sum: n1 + n2 + n3 },
      explanation: `N1=${n1},N2=${n2},N3=${n3}；上卦mod8(N1)=${upperNum}，下卦mod8(N2)=${lowerNum}，动爻mod6(N1+N2+N3)=mod6(${n1 + n2 + n3})=${moving}`
    }
  }
}
