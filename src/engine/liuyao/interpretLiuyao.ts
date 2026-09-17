import type { Interpretation, QuestionCategory, Rating } from '../../types'
import type { LiuYaoResult } from './layout'
import { CATEGORY_USEFUL_GOD } from '../../data/sixRelations'
import { PALACE_POSITION_NAMES } from '../../data/palaces'

/**
 * 六爻现代解读（本地模板）。
 */
export function interpretLiuyao(r: LiuYaoResult, rating: Rating, category: QuestionCategory): { interpretation: Interpretation; usefulGodReason: string } {
  const favorable: string[] = []
  const constraints: string[] = []

  const ug = CATEGORY_USEFUL_GOD[category] || { gods: ['世爻'], reason: '默认以世爻为参考' }
  const usefulGodReason = `类别「${category}」：${ug.reason}（v1 排盘以世爻旺衰为主展示）`

  const shi = r.lines.find((l) => l.isShi)
  if (shi) {
    favorable.push(`世爻为${shi.sixSpirit}坐${shi.branch}（${shi.sixRelation}），为问卦主体参考。`)
  }
  if (r.shensha.length > 0) {
    favorable.push(`神煞：${r.shensha.map((s) => `${s.name}${s.branch}`).join('、')}（低权重象意，不单独定吉凶）。`)
  }

  const kw = r.hexagram.editorialKeywords.join('、')
  const summary = `本卦「${r.hexagram.name}」，属${r.palace}宫（${r.palaceElement}），世在第${r.shiLine}爻、应在第${r.yingLine}爻。`

  const trend = `卦「${r.hexagram.name}」指向${kw}；八宫位置为${PALACE_POSITION_NAMES[r.hexagram.palacePosition]}。`

  if (rating.constraintCount > rating.favorableCount) {
    constraints.push('制约信号多于有利信号，宜审慎。')
  } else {
    favorable.push('有利信号多于制约信号。')
  }

  const actionTips = [
    '请结合客观事实与专业意见做现实决定。',
    rating.score < 40 ? '当前偏弱，宜守不宜急。' : rating.score > 60 ? '当前偏顺，可稳步推进。' : '信号中性，按部就班。'
  ]

  return {
    interpretation: { summary, favorable, constraints, trend, actionTips, usefulGodReason },
    usefulGodReason
  }
}
