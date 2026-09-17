import { rollD6, rollD8 } from './secureRandom'
import { MeihuaCastingResult } from './common'
import { TRIGRAM_BY_NUMBER } from '../../data/trigrams'
import type { TrigramName } from '../../types'

/**
 * 骰子起卦 meihua_dice_v1（资料 v2 第5节，现代交互规则）
 * d8×2 直接定上下卦（1乾..8坤），d6 直接定动爻（1初..6上）。
 */
export interface DiceResult extends MeihuaCastingResult {
  upperD8: number
  lowerD8: number
  movingD6: number
}

export function rollDice(): { upperD8: number; lowerD8: number; movingD6: number } {
  return { upperD8: rollD8(), lowerD8: rollD8(), movingD6: rollD6() }
}

export function castByDice(upperD8: number, lowerD8: number, movingD6: number): DiceResult {
  const upper: TrigramName = TRIGRAM_BY_NUMBER[upperD8]
  const lower: TrigramName = TRIGRAM_BY_NUMBER[lowerD8]
  const moving = movingD6 as 1 | 2 | 3 | 4 | 5 | 6
  return {
    upperTrigram: upper,
    lowerTrigram: lower,
    movingLine: moving,
    movingIndex0: moving - 1,
    castingRuleVersion: 'meihua_dice_v1',
    upperD8, lowerD8, movingD6,
    evidence: {
      source: 'dice',
      ruleVersion: 'meihua_dice_v1',
      raw: { upperD8, lowerD8, movingD6 },
      normalized: { upper, lower, moving },
      explanation: `上卦d8=${upperD8}→${upper}，下卦d8=${lowerD8}→${lower}，动爻d6=${movingD6}`
    }
  }
}
