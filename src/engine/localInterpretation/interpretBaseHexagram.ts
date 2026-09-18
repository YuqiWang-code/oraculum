/**
 * 本卦解读——当前主旨
 * 依据《梅花易数》"体为主，用为事"。
 */

import type { HexagramData } from '../../types'
import type { LocalInterpretationSection } from './types'
import { MEIHUA_ROLES } from '../../local-data/meihua/roles'
import {
  selectHexagramKnowledge,
  getHexagramSourceRefs,
  fallbackHexagramPlainExplanation
} from './selectKnowledge'

/**
 * 生成本卦解读区块
 */
export function interpretBaseHexagram(ben: HexagramData): LocalInterpretationSection {
  const knowledge = selectHexagramKnowledge(ben.kingWen)
  const sources = getHexagramSourceRefs(ben.kingWen)
  const sourceLabel = sources.join('；')

  const role = MEIHUA_ROLES.base
  const title = role.title
  const classicalBasis = role.classicalBasis

  if (knowledge) {
    // 有完整本地知识
    const classicTexts = [
      { label: '卦辞', text: knowledge.classic.judgment, source: sourceLabel },
      { label: '彖曰', text: knowledge.classic.tuan, source: sourceLabel },
      { label: '象曰', text: knowledge.classic.daXiang, source: sourceLabel }
    ]
    const plainExplanation =
      `${knowledge.localMeaning.plainJudgment} ` +
      `${knowledge.localMeaning.plainTuan} ` +
      `${knowledge.localMeaning.plainDaXiang}`
    const roleExplanation =
      `${classicalBasis} 当前事情的主旨如下：${knowledge.localMeaning.asBaseHexagram}`

    return {
      role: 'base',
      title,
      classicTexts,
      plainExplanation,
      roleExplanation
    }
  }

  // 降级：使用经典原文 + editorialKeywords
  const judgmentText = ben.judgmentClassic
  const classicTexts: { label: string; text: string; source: string }[] = []
  if (judgmentText) {
    classicTexts.push({ label: '卦辞', text: judgmentText, source: sourceLabel })
  }

  const plainExplanation = fallbackHexagramPlainExplanation(ben)
  const roleExplanation = `${classicalBasis} 本卦为「${ben.name}」，代表当前事情的基础格局与主旨方向。`

  return {
    role: 'base',
    title,
    classicTexts,
    plainExplanation,
    roleExplanation
  }
}
