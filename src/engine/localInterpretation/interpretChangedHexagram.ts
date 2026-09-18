/**
 * 变卦解读——后续趋向
 * 依据《梅花易数》"变为事占之终应"。
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
 * 生成变卦解读区块
 * @param bianHex 变卦数据
 */
export function interpretChangedHexagram(bianHex: HexagramData): LocalInterpretationSection {
  const knowledge = selectHexagramKnowledge(bianHex.kingWen)
  const sources = getHexagramSourceRefs(bianHex.kingWen)
  const sourceLabel = sources.join('；')

  const role = MEIHUA_ROLES.changed
  const title = `变卦「${bianHex.name}」—— 后续趋向`

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
      `${role.classicalBasis} 变卦「${bianHex.name}」代表事情的后续发展趋向：${knowledge.localMeaning.asChangedHexagram}`

    return {
      role: 'changed',
      title,
      classicTexts,
      plainExplanation,
      roleExplanation
    }
  }

  // 降级
  const judgmentText = bianHex.judgmentClassic || ''
  const classicTexts: { label: string; text: string; source: string }[] = []
  if (judgmentText) {
    classicTexts.push({ label: '卦辞', text: judgmentText, source: sourceLabel })
  }
  const plainExplanation = fallbackHexagramPlainExplanation(bianHex)
  const roleExplanation =
    `${role.classicalBasis} 变卦「${bianHex.name}」代表事情的后续发展与最终趋向。`

  return {
    role: 'changed',
    title,
    classicTexts,
    plainExplanation,
    roleExplanation
  }
}
