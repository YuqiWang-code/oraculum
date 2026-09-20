/**
 * 现实护栏（RealityGuard）——纯本地、确定性。
 * 不替用户做决定，只提示"身体需求先处理"和"重要现实问题别全靠卦象"。
 */

import type { QuestionCategory } from '../../types'
import type { PlainQuestionIntent, RealityGuardResult } from './types'

const BODY_NEED_KEYWORDS = [
  '上厕所', '厕所', '方便', '尿急', '尿尿', '拉屎', '大便', '小便',
  '喝水', '口渴', '吃饭', '饿了', '休息', '睡觉', '困了'
]

/** 重要现实类别（本身即触发中优先级提示） */
const IMPORTANT_CATEGORIES: QuestionCategory[] = ['财务收益', '事业工作', '出行变动']

const MEDICAL_KEYWORDS = ['病', '医院', '医生', '药', '手术', '疼', '痛']
const BIG_MONEY_KEYWORDS = ['钱', '买', '卖', '投资', '金额', '万', '赔', '赚']
const LEGAL_KEYWORDS = ['法律', '官司', '合同', '律师', '起诉', '纠纷']

const HIGH_MESSAGE = '有明确身体需要就先处理；卦象只作为过程提示。'
const MEDIUM_MESSAGE = '卦象倾向仅供参考，现实决定仍应依据事实、专业意见和实际条件。'

function includesAny(text: string, keywords: string[]): boolean {
  return keywords.some((k) => text.includes(k))
}

export function checkRealityGuard(
  question: string,
  category: QuestionCategory,
  intent: PlainQuestionIntent
): RealityGuardResult {
  const q = question || ''

  // 1. 身体基本需求——高优先级
  if (intent === 'body_need' || includesAny(q, BODY_NEED_KEYWORDS)) {
    return { active: true, priority: 'high', message: HIGH_MESSAGE }
  }

  // 2. 重要现实问题——中优先级
  const importantByCategory = IMPORTANT_CATEGORIES.includes(category)
  const importantByKeyword =
    includesAny(q, MEDICAL_KEYWORDS) ||
    includesAny(q, BIG_MONEY_KEYWORDS) ||
    includesAny(q, LEGAL_KEYWORDS)

  if (importantByCategory || importantByKeyword) {
    return { active: true, priority: 'medium', message: MEDIUM_MESSAGE }
  }

  return { active: false, priority: 'low' }
}
