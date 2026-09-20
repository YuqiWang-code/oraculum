/**
 * 「一句话看懂 / 通俗解读」引擎入口
 * 纯本地、离线、确定性、可复现。只读已有术数结果，不重新起卦、不改评分。
 */

import type { QuestionCategory, Rating } from '../../types'
import type { MeihuaResult } from '../meihua/castByTime'
import type { LiuYaoResult } from '../liuyao/layout'
import type {
  ActionStance,
  PlainInterpretation,
  PlainQuestionIntent,
  PlainSemanticFrame,
  RealityGuardResult
} from './types'
import { classifyQuestionIntent } from './classifyQuestionIntent'
import { buildMeihuaFrame, buildLiuyaoFrame } from './buildSemanticFrame'
import { checkRealityGuard } from './realityGuard'
import { chooseActionStance } from './chooseActionStance'
import { composeOneSentence } from './composeOneSentence'
import { composePlainExplanation } from './composePlainExplanation'

export const PLAIN_DISCLAIMER =
  '传统文化研究与娱乐用途；重要现实决定请依据事实和专业意见。所有解读均来自本地经典数据与确定性规则引擎，不调用大模型。'

export type {
  ActionStance,
  PlainInterpretation,
  PlainQuestionIntent,
  PlainReason,
  PlainSemanticFrame,
  RatingTendency,
  RealityGuardResult
} from './types'

/** 跑完整白话流水线 */
function runPlain(
  question: string,
  category: QuestionCategory,
  frame: PlainSemanticFrame
): PlainInterpretation {
  const intent: PlainQuestionIntent = classifyQuestionIntent(question)
  frame.intent = intent

  const guard: RealityGuardResult = checkRealityGuard(question, category, intent)
  const stance: ActionStance = chooseActionStance(frame, guard)
  const oneLiner = composeOneSentence(frame, stance, guard)
  const { reasons, realityGuard } = composePlainExplanation(frame, guard)

  return {
    oneLiner,
    stance,
    reasons,
    realityGuard,
    disclaimer: PLAIN_DISCLAIMER
  }
}

/** 梅花白话解读 */
export function interpretMeihuaPlain(
  question: string,
  category: QuestionCategory,
  meihua: MeihuaResult,
  rating: Rating
): PlainInterpretation {
  const frame = buildMeihuaFrame(question, category, meihua, rating)
  return runPlain(question, category, frame)
}

/** 六爻白话解读（只读 analyzeLiuyao 事实输出，不重新算用神/旺衰） */
export function interpretLiuyaoPlain(
  question: string,
  category: QuestionCategory,
  liuyao: LiuYaoResult,
  rating: Rating,
  monthBranch: string,
  dayGanzhi: string
): PlainInterpretation {
  const frame = buildLiuyaoFrame(question, category, liuyao, rating, monthBranch, dayGanzhi)
  return runPlain(question, category, frame)
}
