import type { Lines, YinYang } from '../../types'

/**
 * 变卦：翻转指定动爻（资料 5.2 第9步）。
 * @param lines 原六爻（自下而上）
 * @param movingIndex0 动爻索引 0=初爻 ... 5=上爻
 */
export function changeMovingLine(lines: Lines, movingIndex0: number): Lines {
  if (movingIndex0 < 0 || movingIndex0 > 5) throw new Error(`动爻索引越界: ${movingIndex0}`)
  const next = [...lines] as Lines
  next[movingIndex0] = (next[movingIndex0] === 1 ? 0 : 1) as YinYang
  return next
}
