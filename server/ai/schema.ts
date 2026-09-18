import { z } from 'zod'

// Structured Output schema（服务端 Zod，前端类型见 src/types/ai.ts）
// v3.1: likelihood 删除 traditionalScore/traditionalLabel — AI 不得篡改本地传统评分。
export const AiInterpretationSchema = z.object({
  answer: z.string(),
  traditionalReading: z.object({
    summary: z.string(),
    favorable: z.array(z.string()),
    constraints: z.array(z.string()),
    trend: z.string(),
    evidenceIds: z.array(z.string())
  }),
  timing: z.object({
    applicable: z.boolean(),
    window: z.string().nullable(),
    confidence: z.enum(['low', 'medium', 'not_applicable']),
    basis: z.array(z.string())
  }),
  likelihood: z.object({
    applicable: z.boolean(),
    realityFeasibility: z.enum([
      'low', 'somewhat_low', 'uncertain', 'somewhat_high', 'high',
      'insufficient_information', 'not_applicable'
    ]),
    explanation: z.string()
  }),
  realityCheck: z.string(),
  actionSuggestions: z.array(z.string()),
  uncertainties: z.array(z.string()),
  disclaimer: z.string()
})

export type AiInterpretation = z.infer<typeof AiInterpretationSchema>

// v3.1: API 请求 Zod 校验
export const AiChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(4000)
})

export const InterpretRequestSchema = z.object({
  record: z.unknown()
})

export const FollowUpRequestSchema = z.object({
  record: z.unknown(),
  messages: z.array(AiChatMessageSchema).max(6),
  question: z.string().trim().min(1).max(2000)
})
