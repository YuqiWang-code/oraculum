import type { Interpretation, QuestionCategory, Rating } from '../../types'
import type { MeihuaResult } from '../meihua/castByTime'
import { bodyUseText } from '../meihua/bodyUse'

/**
 * 梅花现代解读（本地模板，不调云端 AI）
 * 从结构化证据生成，不使用绝对化/恐吓表达。
 */
export function interpretMeihua(r: MeihuaResult, rating: Rating, category: QuestionCategory): Interpretation {
  const favorable: string[] = []
  const constraints: string[] = []

  const bu = r.relation
  if (bu === 'generatesB' || bu === 'same' || bu === 'controlsA') {
    favorable.push(bodyUseText(bu))
  } else {
    constraints.push(bodyUseText(bu))
  }

  const kw = r.ben.editorialKeywords.join('、')
  const summary = `按梅花易数时间起卦规则（meihua_time_v1），本卦为「${r.ben.name}」，动在第${r.movingLine}爻，变卦「${r.bian.name}」。`

  const trend = `本卦「${r.ben.name}」指向${kw}；互卦「${r.hu.name}」提示过程中的状态；动爻使本卦变为「${r.bian.name}」，代表此事的发展趋向。`

  favorable.push(`变卦「${r.bian.name}」：${r.bian.editorialKeywords.join('、')}`)

  const actionTips: string[] = [
    `结合"${category}"这一主题，先用现实信息核对关键前提，再决定下一步。`,
    '把本次结果作为自我反思的提示，而非现实决定的唯一依据。',
    rating.score < 40
      ? '当前制约信号偏多，宜稳守、延后重大决定。'
      : rating.score > 60
        ? '当前有利信号偏多，可顺势推进，但仍需落实客观条件。'
        : '信号相对中性，建议按部就班、观察变化。'
  ]

  if (['财务收益', '感情关系', '事业工作', '出行变动'].includes(category)) {
    actionTips.push('涉及钱财、关系、职业或出行安全等重要事项，请依据事实与专业意见。')
  }

  return {
    summary,
    favorable,
    constraints,
    trend,
    actionTips
  }
}
