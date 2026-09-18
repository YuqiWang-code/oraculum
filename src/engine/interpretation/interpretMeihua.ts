/**
 * 梅花易数解读——对外接口
 * 内部使用本地确定性解读引擎（src/engine/localInterpretation/）。
 * 保持现有 Interpretation 接口向后兼容（DivinationRecord 使用）。
 * 运行时不联网、不调用大模型。
 */

import type { Interpretation, QuestionCategory, Rating } from '../../types'
import type { MeihuaResult } from '../meihua/castByTime'
import { composeMeihuaInterpretation } from '../localInterpretation/composeMeihuaInterpretation'
import type { LocalDetailedInterpretation } from '../localInterpretation/types'

/**
 * 标准解读接口（供 DivinationRecord 使用）
 */
export function interpretMeihua(
  r: MeihuaResult,
  rating: Rating,
  category: QuestionCategory
): Interpretation {
  const detailed = composeMeihuaInterpretation(r, rating, category)
  return {
    summary: detailed.overview,
    favorable: detailed.favorable,
    constraints: detailed.constraints,
    trend: detailed.synthesis,
    actionTips: detailed.actionTips
  }
}

/**
 * 详细解读接口（供 ResultView 展示完整解读区块）
 */
export function interpretMeihuaDetailed(
  r: MeihuaResult,
  rating: Rating,
  category: QuestionCategory
): LocalDetailedInterpretation {
  return composeMeihuaInterpretation(r, rating, category)
}
