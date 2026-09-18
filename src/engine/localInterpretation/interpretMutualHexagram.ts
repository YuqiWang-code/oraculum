/**
 * 互卦解读——中间过程
 * 依据《梅花易数》"互为中间之应"。
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
 * 生成互卦解读区块
 * @param huHex 互卦数据
 */
export function interpretMutualHexagram(huHex: HexagramData): LocalInterpretationSection {
  const knowledge = selectHexagramKnowledge(huHex.kingWen)
  const sources = getHexagramSourceRefs(huHex.kingWen)
  const sourceLabel = sources.join('；')

  const role = MEIHUA_ROLES.mutual
  const title = `互卦「${huHex.name}」—— 中间过程`

  if (knowledge) {
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
      `${role.classicalBasis} 互卦「${huHex.name}」代表事情的中间过程：${knowledge.localMeaning.asMutualHexagram}`

    return {
      role: 'mutual',
      title,
      classicTexts,
      plainExplanation,
      roleExplanation
    }
  }

  // 降级
  const judgmentText = huHex.judgmentClassic || ''
  const classicTexts: { label: string; text: string; source: string }[] = []
  if (judgmentText) {
    classicTexts.push({ label: '卦辞', text: judgmentText, source: sourceLabel })
  }
  const plainExplanation = fallbackHexagramPlainExplanation(huHex)
  const roleExplanation =
    `${role.classicalBasis} 互卦「${huHex.name}」代表事情的中间过程与内在演变。`

  return {
    role: 'mutual',
    title,
    classicTexts,
    plainExplanation,
    roleExplanation
  }
}
