// 前端与服务端共享的 AI 解读类型（与 server/ai/schema.ts 的 Zod schema 等价）

export type TimingConfidence = 'low' | 'medium' | 'not_applicable'
export type RealityFeasibility =
  | 'low'
  | 'somewhat_low'
  | 'uncertain'
  | 'somewhat_high'
  | 'high'
  | 'insufficient_information'
  | 'not_applicable'

export interface AiTraditionalReading {
  summary: string
  favorable: string[]
  constraints: string[]
  trend: string
  evidenceIds: string[]
}

export interface AiTiming {
  applicable: boolean
  window: string | null
  confidence: TimingConfidence
  basis: string[]
}

export interface AiLikelihood {
  applicable: boolean
  realityFeasibility: RealityFeasibility
  explanation: string
}

export interface AiInterpretation {
  answer: string
  traditionalReading: AiTraditionalReading
  timing: AiTiming
  likelihood: AiLikelihood
  realityCheck: string
  actionSuggestions: string[]
  uncertainties: string[]
  disclaimer: string
}

export interface AiInterpretationResult {
  result: AiInterpretation
  model: string
  usage?: { input_tokens?: number; output_tokens?: number }
}

export interface AiChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AiHealth {
  enabled: boolean
  model?: string
}
