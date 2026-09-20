/**
 * 问题意图分类——纯函数、确定性。
 * 仅用简单 includes 匹配，不用正则过度匹配。
 * 匹配顺序：body_need 优先于其他（尤其是 should_do）。
 */

import type { PlainQuestionIntent } from './types'

const BODY_NEED_KEYWORDS = [
  '上厕所', '厕所', '方便', '尿急', '尿尿', '拉屎', '大便', '小便',
  '喝水', '口渴', '吃饭', '饿了', '休息', '睡觉', '困了'
]

const SHOULD_DO_KEYWORDS = [
  '该不该', '要不要', '可以不可以', '能不能去', '是否应该'
]

const WHEN_KEYWORDS = [
  '什么时候', '何时', '多久', '哪天', '几时'
]

const WILL_HAPPEN_KEYWORDS = [
  '会不会', '能不能成功', '能否', '是否会'
]

const HOW_TO_KEYWORDS = [
  '怎么办', '怎么做', '怎么才能', '怎么解决', '怎么处理', '如何'
]

const LOST_ITEM_KEYWORDS = [
  '丢了', '找不到', '遗失', '丢失', '掉了'
]

const PERSON_RELATION_KEYWORDS = [
  '感情', '恋爱', '对象', '分手', '复合', '喜欢', '追'
]

function includesAny(question: string, keywords: string[]): boolean {
  return keywords.some((k) => question.includes(k))
}

/**
 * 把用户问题分类成白话引擎可用的意图。
 * body_need 始终优先，避免"我该不该去上厕所"被误判为 should_do。
 */
export function classifyQuestionIntent(question: string): PlainQuestionIntent {
  const q = question || ''

  // 1. 身体基本需求——最高优先级
  if (includesAny(q, BODY_NEED_KEYWORDS)) {
    return 'body_need'
  }

  // 2. 该不该 / 要不要
  if (includesAny(q, SHOULD_DO_KEYWORDS)) {
    return 'should_do'
  }

  // 3. 时间
  if (includesAny(q, WHEN_KEYWORDS)) {
    return 'when'
  }

  // 4. 会不会 / 能否成功
  if (includesAny(q, WILL_HAPPEN_KEYWORDS)) {
    return 'will_happen'
  }

  // 5. 怎么办（"怎么样"是状态询问，归 generic，不算 how_to）
  const realHowTo = includesAny(q, HOW_TO_KEYWORDS)
  const vagueHow =
    (q.includes('怎么') || q.includes('怎样')) && !q.includes('怎么样')
  if (realHowTo || vagueHow) {
    return 'how_to'
  }

  // 6. 失物
  if (includesAny(q, LOST_ITEM_KEYWORDS)) {
    return 'lost_item'
  }

  // 7. 感情关系
  if (includesAny(q, PERSON_RELATION_KEYWORDS)) {
    return 'person_relation'
  }

  return 'generic'
}
