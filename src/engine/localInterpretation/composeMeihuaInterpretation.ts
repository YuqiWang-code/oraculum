/**
 * 梅花易数本地解读组合器
 * 按顺序组合：本卦 → 动爻 → 互卦 → 变卦 → 体用 → 综合
 * 所有内容来自本地数据 + 确定性模板，不硬编码综合段落。
 */

import type { MeihuaResult } from '../meihua/castByTime'
import type { QuestionCategory, Rating } from '../../types'
import type { LocalDetailedInterpretation, LocalInterpretationSection } from './types'
import { interpretBaseHexagram } from './interpretBaseHexagram'
import { interpretMovingLine } from './interpretMovingLines'
import { interpretMutualHexagram } from './interpretMutualHexagram'
import { interpretChangedHexagram } from './interpretChangedHexagram'
import { interpretBodyUse } from './interpretBodyUse'
import { selectHexagramKnowledge } from './selectKnowledge'
import { BODY_USE_MEANINGS } from '../../local-data/meihua/bodyUseMeanings'
import { CATEGORY_HINTS } from '../../local-data/interpretation/categoryHints'

/**
 * 从卦象知识中提取简短主题词（用于综合收尾的"顺势—取舍—渐进—沟通"式短语）
 * 优先取 keyThemes 的第一个；降级时用 editorialKeywords 的第一个。
 */
function extractThemeWord(
  kingWen: number,
  fallbackKeywords: string[]
): string {
  const knowledge = selectHexagramKnowledge(kingWen)
  if (knowledge && knowledge.localMeaning.keyThemes.length > 0) {
    return knowledge.localMeaning.keyThemes[0]
  }
  if (fallbackKeywords.length > 0) {
    return fallbackKeywords[0]
  }
  return '变化'
}

/**
 * 构建行动提示
 */
function buildActionTips(
  rating: Rating,
  category: QuestionCategory,
  bodyUseFavorable: boolean
): string[] {
  const tips: string[] = []
  const hint = CATEGORY_HINTS[category]
  if (hint) {
    tips.push(hint.hint)
  }

  if (rating.score < 40) {
    tips.push('当前制约信号偏多，宜稳守、延后重大决定。')
  } else if (rating.score > 60) {
    tips.push(bodyUseFavorable
      ? '当前有利信号偏多，可顺势推进，但仍需落实客观条件。'
      : '评分虽高，但体用关系显示需谨慎，建议核对前提后再行动。')
  } else {
    tips.push('信号相对中性，建议按部就班、观察变化。')
  }

  tips.push('把本次结果作为自我反思的提示，而非现实决定的唯一依据。')

  if (['财务收益', '感情关系', '事业工作', '出行变动'].includes(category)) {
    tips.push('涉及钱财、关系、职业或出行安全等重要事项，请依据事实与专业意见。')
  }

  return tips
}

/**
 * 组合梅花易数完整本地解读
 */
export function composeMeihuaInterpretation(
  r: MeihuaResult,
  rating: Rating,
  category: QuestionCategory
): LocalDetailedInterpretation {
  // 1. 本卦
  const base = interpretBaseHexagram(r.ben)

  // 2. 动爻
  const movingLineSection = interpretMovingLine(r.ben, r.movingLine)
  const movingLines = [movingLineSection]

  // 3. 互卦
  const mutual = interpretMutualHexagram(r.hu)

  // 4. 变卦
  const changed = interpretChangedHexagram(r.bian)

  // 5. 体用
  const bodyUse = interpretBodyUse(r)

  // 概览
  const overview =
    `本卦为「${r.ben.name}」，动在第${r.movingLine}爻，` +
    `互卦「${r.hu.name}」，变卦「${r.bian.name}」。`

  // 有利信号 & 制约
  const favorable: string[] = []
  const constraints: string[] = []

  const buMeaning = BODY_USE_MEANINGS[r.relation]
  const bodyUseFavorable =
    r.relation === 'generatesB' || r.relation === 'same' || r.relation === 'controlsA'

  if (bodyUseFavorable) {
    favorable.push(`体用：${buMeaning.favorable}`)
  } else {
    constraints.push(`体用：${buMeaning.caution}`)
  }

  // 从评分证据中提取有利/制约
  for (const ev of rating.evidence) {
    if (ev.delta > 0) {
      favorable.push(`${ev.title}：${ev.reason}`)
    } else if (ev.delta < 0) {
      constraints.push(`${ev.title}：${ev.reason}`)
    }
  }

  // 从本地知识提取注意事项
  const baseKnowledge = selectHexagramKnowledge(r.ben.kingWen)
  if (baseKnowledge) {
    for (const caution of baseKnowledge.localMeaning.cautions) {
      constraints.push(caution)
    }
  }

  // 综合段落——由数据+模板组合，不硬编码
  const synthesisParts: string[] = []

  // 本卦主旨
  if (baseKnowledge) {
    synthesisParts.push(
      `本卦「${r.ben.name}」：${baseKnowledge.localMeaning.asBaseHexagram}`
    )
  } else {
    synthesisParts.push(
      `本卦「${r.ben.name}」代表当前事情的主旨方向。`
    )
  }

  // 动爻关键
  const lineKnowledge = baseKnowledge?.lines[r.movingLine - 1]
  if (lineKnowledge) {
    synthesisParts.push(
      `第${r.movingLine}爻动提醒：${lineKnowledge.coreMeaning}`
    )
  } else {
    synthesisParts.push(
      `第${r.movingLine}爻为本次变化点，指示事情正在发生的转折。`
    )
  }

  // 互卦过程
  const mutualKnowledge = selectHexagramKnowledge(r.hu.kingWen)
  if (mutualKnowledge) {
    synthesisParts.push(
      `互卦「${r.hu.name}」说明事情中段：${mutualKnowledge.localMeaning.asMutualHexagram}`
    )
  } else {
    synthesisParts.push(
      `互卦「${r.hu.name}」代表事情的中间过程。`
    )
  }

  // 变卦趋向
  const changedKnowledge = selectHexagramKnowledge(r.bian.kingWen)
  if (changedKnowledge) {
    synthesisParts.push(
      `变卦「${r.bian.name}」说明后段趋向：${changedKnowledge.localMeaning.asChangedHexagram}`
    )
  } else {
    synthesisParts.push(
      `变卦「${r.bian.name}」代表事情的后续发展方向。`
    )
  }

  // 收尾短语：从各卦 keyThemes 提取主题词
  const themeWords = [
    extractThemeWord(r.ben.kingWen, r.ben.editorialKeywords),
    lineKnowledge?.coreMeaning ? '取舍' : '变化',
    extractThemeWord(r.hu.kingWen, r.hu.editorialKeywords),
    extractThemeWord(r.bian.kingWen, r.bian.editorialKeywords)
  ]
  // 如果动爻有明确的 favorable/caution 含义，用更贴切的词
  if (lineKnowledge?.cautionMeaning) {
    themeWords[1] = '取舍'
  } else if (lineKnowledge?.favorableMeaning) {
    themeWords[1] = '顺势'
  }

  synthesisParts.push(
    `因此本次卦象可以概括为：「${themeWords.join('—')}」。`
  )

  const synthesis = synthesisParts.join('')

  // 行动提示
  const actionTips = buildActionTips(rating, category, bodyUseFavorable)

  return {
    overview,
    base,
    movingLines,
    mutual,
    changed,
    bodyUse,
    synthesis,
    favorable,
    constraints,
    actionTips
  }
}
