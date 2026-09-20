/**
 * 现实白话解读引擎——入口
 * v4.3 新增：让完全不懂《易经》的老人也能直接看懂。
 * 纯本地、离线、确定性。只读已有术数结果，不重新起卦、不改评分。
 */
import type { QuestionCategory, Rating } from '../../types'
import type { MeihuaResult } from '../meihua/castByTime'
import type { LiuYaoResult } from '../liuyao/layout'
import { buildMeihuaRealWorldReading } from './buildMeihuaRealWorldReading'
import { buildLiuyaoRealWorldReading } from './buildLiuyaoRealWorldReading'
import type { RealWorldPlainReading } from './types'

export type { RealWorldPlainReading } from './types'
export { FORBIDDEN_WORDS } from './types'
export { guardWording, checkForbiddenWords } from './wordingGuard'
export { getCategoryAdapter } from './categoryAdapters'
export type { CategoryActionTemplate } from './categoryAdapters'

/**
 * 梅花现实白话解读
 */
export function interpretMeihuaRealWorld(
  question: string,
  category: QuestionCategory,
  meihua: MeihuaResult,
  rating: Rating
): RealWorldPlainReading {
  return buildMeihuaRealWorldReading(question, category, meihua, rating)
}

/**
 * 六爻现实白话解读
 */
export function interpretLiuyaoRealWorld(
  question: string,
  category: QuestionCategory,
  liuyao: LiuYaoResult,
  rating: Rating,
  monthBranch: string,
  dayGanzhi: string
): RealWorldPlainReading {
  return buildLiuyaoRealWorldReading(question, category, liuyao, rating, monthBranch, dayGanzhi)
}
