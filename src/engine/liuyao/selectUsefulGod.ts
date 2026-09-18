import type { QuestionCategory, SixRelation } from '../../types'
import type { LiuYaoResult } from './layout'
import { CATEGORY_USEFUL_GOD } from '../../data/sixRelations'

/**
 * 六爻用神选择（v3.1 P1）
 * 按问题类别从 CATEGORY_USEFUL_GOD 选首要用神，匹配实际爻位。
 */
export interface UsefulGodSelection {
  primary: SixRelation | '世爻'
  secondary: (SixRelation | '世爻')[]
  matchedLines: number[]
  reason: string
}

export function selectUsefulGod(category: QuestionCategory, r: LiuYaoResult): UsefulGodSelection {
  const cfg = CATEGORY_USEFUL_GOD[category] || { gods: ['世爻'] as (SixRelation | '世爻')[], reason: '未明确类别，默认以世爻为参考' }
  const primary = cfg.gods[0] || '世爻'
  const secondary = cfg.gods.slice(1)

  // 匹配爻位
  const matchedLines: number[] = []
  for (const god of cfg.gods) {
    for (const line of r.lines) {
      if (god === '世爻') {
        if (line.isShi) matchedLines.push(line.index)
      } else if (line.sixRelation === god) {
        matchedLines.push(line.index)
      }
    }
  }

  return {
    primary,
    secondary,
    matchedLines: [...new Set(matchedLines)],
    reason: `类别「${category}」：${cfg.reason}`
  }
}
