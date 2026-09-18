/**
 * 动爻解读——当前变化点
 * 依据《梅花易数》"动爻为事之几"。
 */

import type { HexagramData } from '../../types'
import type { LocalInterpretationSection } from './types'
import { MEIHUA_ROLES } from '../../local-data/meihua/roles'
import {
  selectLineKnowledge,
  getHexagramSourceRefs,
  fallbackLinePlainExplanation
} from './selectKnowledge'

/** 爻位中文名称 */
const LINE_NAMES: Record<number, string> = {
  1: '初爻',
  2: '二爻',
  3: '三爻',
  4: '四爻',
  5: '五爻',
  6: '上爻'
}

/**
 * 生成单个动爻解读区块
 * @param benHex 本卦数据
 * @param lineIndex 爻位 1-6
 */
export function interpretMovingLine(
  benHex: HexagramData,
  lineIndex: 1 | 2 | 3 | 4 | 5 | 6
): LocalInterpretationSection {
  const lineKnowledge = selectLineKnowledge(benHex.kingWen, lineIndex)
  const sources = getHexagramSourceRefs(benHex.kingWen)
  const sourceLabel = sources.join('；')

  const role = MEIHUA_ROLES.moving_line
  const lineName = LINE_NAMES[lineIndex]
  const title = `${role.title}：第 ${lineIndex} 爻（${lineName}）`

  if (lineKnowledge) {
    const classicTexts = [
      { label: '爻辞', text: lineKnowledge.classicText, source: sourceLabel },
      { label: '象曰', text: lineKnowledge.xiaoXiang, source: sourceLabel }
    ]
    const plainExplanation =
      `${lineKnowledge.plainText} ${lineKnowledge.plainXiaoXiang}`
    const roleExplanation =
      `${role.classicalBasis} 本次变化点在${lineName}：${lineKnowledge.coreMeaning}`

    return {
      role: 'moving_line',
      title,
      classicTexts,
      plainExplanation,
      roleExplanation
    }
  }

  // 降级：使用经典爻辞
  const classicText = benHex.lineTextsClassic[lineIndex - 1] || ''
  const classicTexts: { label: string; text: string; source: string }[] = []
  if (classicText) {
    classicTexts.push({ label: '爻辞', text: classicText, source: sourceLabel })
  }

  const plainExplanation = fallbackLinePlainExplanation(benHex, lineIndex)
  const roleExplanation =
    `${role.classicalBasis} 本次变化点在${lineName}，是当前局面的关键转折。`

  return {
    role: 'moving_line',
    title,
    classicTexts,
    plainExplanation,
    roleExplanation
  }
}
