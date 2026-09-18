/**
 * 六爻解读——对外接口
 * 内部使用本地确定性解读引擎（src/engine/localInterpretation/）。
 * 保持现有返回结构向后兼容（DivinationRecord 使用）。
 * 运行时不联网、不调用大模型。
 */

import type { Interpretation, QuestionCategory, Rating } from '../../types'
import type { LiuYaoResult } from './layout'
import { composeLiuyaoInterpretation } from '../localInterpretation/composeLiuyaoInterpretation'
import type { LocalDetailedInterpretation } from '../localInterpretation/types'

/**
 * 标准解读接口（供 DivinationRecord 使用）
 * 返回 interpretation 和 usefulGodReason
 */
export function interpretLiuyao(
  r: LiuYaoResult,
  rating: Rating,
  category: QuestionCategory
): { interpretation: Interpretation; usefulGodReason: string } {
  const detailed = composeLiuyaoInterpretation(r, rating, category)
  return {
    interpretation: {
      summary: detailed.overview,
      favorable: detailed.favorable,
      constraints: detailed.constraints,
      trend: detailed.synthesis,
      actionTips: detailed.actionTips,
      usefulGodReason: detailed.usefulGodReason
    },
    usefulGodReason: detailed.usefulGodReason ?? ''
  }
}

/**
 * 详细解读接口（供 ResultView 展示完整解读区块）
 */
export function interpretLiuyaoDetailed(
  r: LiuYaoResult,
  rating: Rating,
  category: QuestionCategory
): LocalDetailedInterpretation {
  return composeLiuyaoInterpretation(r, rating, category)
}
