import type { Lines, YinYang } from '../../types'
import { TRIGRAMS, trigramFromLines } from '../../data/trigrams'
import type { TrigramName } from '../../types'

/**
 * 卦象编码工具（资料 2.1）
 * 约定：六爻数组自下而上 [初,二,三,四,五,上]。
 */

/** 由上下经卦拼六爻（lower=下卦/内卦，upper=上卦/外卦） */
export function linesFromTrigrams(lower: TrigramName, upper: TrigramName): Lines {
  return [...TRIGRAMS[lower].lines, ...TRIGRAMS[upper].lines] as Lines
}

/** 六爻 -> 上、下经卦 */
export function splitTrigrams(lines: Lines): { lower: TrigramName; upper: TrigramName } {
  const lower = trigramFromLines(lines.slice(0, 3) as [YinYang, YinYang, YinYang])
  const upper = trigramFromLines(lines.slice(3, 6) as [YinYang, YinYang, YinYang])
  return { lower, upper }
}
