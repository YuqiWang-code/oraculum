/**
 * 体用解读——主体与事情的五行关系
 * 依据《梅花易数》"体为主，用为事。体用之诀在五行生克"。
 */

import type { MeihuaResult } from '../meihua/castByTime'
import type { LocalInterpretationSection } from './types'
import { MEIHUA_ROLES } from '../../local-data/meihua/roles'
import { BODY_USE_MEANINGS } from '../../local-data/meihua/bodyUseMeanings'
import { TRIGRAM_MEANINGS } from '../../local-data/interpretation/trigramMeanings'

/**
 * 生成本卦解读区块
 */
export function interpretBodyUse(r: MeihuaResult): LocalInterpretationSection {
  const role = MEIHUA_ROLES.body_use
  const bodyUseMeaning = BODY_USE_MEANINGS[r.relation]
  const tiMeaning = TRIGRAM_MEANINGS[r.tiTrigram]
  const yongMeaning = TRIGRAM_MEANINGS[r.yongTrigram]

  const classicTexts = [
    {
      label: '体卦',
      text: `${r.tiTrigram}（${r.tiElement}）—— ${tiMeaning.nature}`,
      source: '《梅花易数》体用诀'
    },
    {
      label: '用卦',
      text: `${r.yongTrigram}（${r.yongElement}）—— ${yongMeaning.nature}`,
      source: '《梅花易数》体用诀'
    },
    {
      label: '体用关系',
      text: `${bodyUseMeaning.label}：${bodyUseMeaning.summary}`,
      source: '《梅花易数》五行生克'
    }
  ]

  const plainExplanation =
    `体卦为「${r.tiTrigram}」（${r.tiElement}），代表问卦主体：${tiMeaning.asBody}。` +
    `用卦为「${r.yongTrigram}」（${r.yongElement}），代表所问之事：${yongMeaning.asUse}。` +
    `二者五行关系为${bodyUseMeaning.label}——${bodyUseMeaning.summary}`

  const roleExplanation =
    `${role.classicalBasis} ${bodyUseMeaning.favorable} ` +
    `需注意：${bodyUseMeaning.caution}`

  return {
    role: 'body_use',
    title: role.title,
    classicTexts,
    plainExplanation,
    roleExplanation
  }
}
