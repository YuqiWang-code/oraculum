/**
 * 本地知识选择器
 * 从 local-data 查找卦象知识；未收录的卦使用降级模板（基于经典原文 + editorialKeywords）。
 * 运行时不联网、不调用大模型。
 */

import { getHexagramKnowledge } from '../../local-data'
import type { LocalHexagramKnowledge, LocalLineKnowledge } from '../../local-data'
import { ZHOUYI_MAP } from '../../data/classics/zhouyi'
import { WIKISOURCE_ZHOUYI, SOURCE_REFS } from '../../local-data/classics/sources'
import type { HexagramData } from '../../types'

/**
 * 查找卦象本地知识
 * @param kingWen 周文王序 1-64
 * @returns 完整本地知识；未收录时返回 undefined
 */
export function selectHexagramKnowledge(kingWen: number): LocalHexagramKnowledge | undefined {
  return getHexagramKnowledge(kingWen)
}

/**
 * 查找某卦某爻的本地知识
 * @param kingWen 周文王序 1-64
 * @param lineIndex 爻位 1-6（1=初）
 * @returns 爻知识；未收录时返回 undefined
 */
export function selectLineKnowledge(
  kingWen: number,
  lineIndex: 1 | 2 | 3 | 4 | 5 | 6
): LocalLineKnowledge | undefined {
  const hex = getHexagramKnowledge(kingWen)
  if (!hex) return undefined
  return hex.lines[lineIndex - 1]
}

/**
 * 获取卦辞来源 URL
 * 优先使用本地知识中的 sourceRefs，否则使用 SOURCE_REFS 查表。
 */
export function getHexagramSourceRefs(kingWen: number): string[] {
  const local = getHexagramKnowledge(kingWen)
  if (local && local.classic.sourceRefs.length > 0) {
    return local.classic.sourceRefs
  }
  const fallback = SOURCE_REFS[kingWen]
  if (fallback) return [WIKISOURCE_ZHOUYI, ...fallback]
  return [WIKISOURCE_ZHOUYI]
}

/**
 * 降级解释：当某卦没有完整本地知识时，
 * 基于 HexagramData 的 judgmentClassic 和 editorialKeywords 生成基础解释。
 */
export function fallbackHexagramPlainExplanation(hex: HexagramData): string {
  const kw = hex.editorialKeywords.length > 0 ? hex.editorialKeywords.join('、') : ''
  const parts: string[] = []
  if (hex.judgmentClassic) {
    parts.push(`卦辞：${hex.judgmentClassic}`)
  }
  if (kw) {
    parts.push(`此卦传统关键词：${kw}。`)
  }
  parts.push('（此卦的完整 Oraculum 现代释义尚在整理中，当前展示经典原文与传统关键词。）')
  return parts.join('')
}

/**
 * 降级动爻解释
 */
export function fallbackLinePlainExplanation(hex: HexagramData, lineIndex: 1 | 2 | 3 | 4 | 5 | 6): string {
  const lineText = hex.lineTextsClassic[lineIndex - 1] ?? ''
  const parts: string[] = []
  if (lineText) {
    parts.push(`爻辞：${lineText}`)
  }
  parts.push('（此爻的完整 Oraculum 现代释义尚在整理中，当前展示经典爻辞。）')
  return parts.join('')
}
