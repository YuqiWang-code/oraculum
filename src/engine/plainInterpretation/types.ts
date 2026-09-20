/**
 * 「一句话看懂 / 通俗解读」引擎——输出类型
 * 纯本地、离线、确定性、可复现。本层只翻译已有术数结果，不重新起卦、不改评分。
 */

export type PlainQuestionIntent =
  | 'should_do'
  | 'when'
  | 'will_happen'
  | 'how_to'
  | 'person_relation'
  | 'body_need'
  | 'lost_item'
  | 'generic'

export type ActionStance =
  | 'do'
  | 'do_cautiously'
  | 'small_step'
  | 'wait'
  | 'avoid'
  | 'neutral'

export type RatingTendency =
  | 'positive'
  | 'slightly_positive'
  | 'neutral'
  | 'slightly_negative'
  | 'negative'

export interface PlainSemanticFrame {
  question: string
  category: import('../../types').QuestionCategory
  intent: PlainQuestionIntent
  rating: {
    score: number
    label: string
    tendency: RatingTendency
  }
  base: {
    name: string
    theme: string
    plainMeaning: string
  }
  moving: {
    lineIndex: number
    theme: string
    plainMeaning: string
  }[]
  mutual?: {
    name: string
    theme: string
    plainMeaning: string
  }
  changed?: {
    name: string
    theme: string
    plainMeaning: string
  }
  bodyUse?: {
    favorable: boolean
    plainMeaning: string
  }
  evidence: string[]
  /** 内部信号：是否存在 delta <= -5 的强制约证据（不改公开契约，仅用于选 stance） */
  hasStrongCaution?: boolean
}

export interface PlainReason {
  id: string
  source:
    | 'base_hexagram'
    | 'moving_line'
    | 'mutual_hexagram'
    | 'changed_hexagram'
    | 'body_use'
    | 'rating'
    | 'reality'
  label: string
  explanation: string
}

export interface RealityGuardResult {
  active: boolean
  priority: 'low' | 'medium' | 'high'
  message?: string
}

export interface PlainInterpretation {
  oneLiner: string
  stance: ActionStance
  reasons: PlainReason[]
  realityGuard?: string
  disclaimer: string
}
