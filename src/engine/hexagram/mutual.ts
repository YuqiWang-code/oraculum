import type { Lines, TrigramName } from '../../types'
import { TRIGRAMS, trigramFromLines } from '../../data/trigrams'

/**
 * 互卦（资料 5.2 第10步）
 * 本卦二三四爻构成下互，三四五爻构成上互。
 * lines 自下而上：0初 1二 2三 3四 4五 5上。
 */
export function mutualHexagram(lines: Lines): { lower: TrigramName; upper: TrigramName; mutualLines: Lines } {
  const lower = trigramFromLines([lines[1], lines[2], lines[3]])
  const upper = trigramFromLines([lines[2], lines[3], lines[4]])
  const mutualLines = [...TRIGRAMS[lower].lines, ...TRIGRAMS[upper].lines] as Lines
  return { lower, upper, mutualLines }
}
