import { z } from 'zod'

// Structured Output schema（服务端 Zod，前端类型见 src/types/ai.ts）
export const AiInterpretationSchema = z.object({
  answer: z.string(),
  traditionalReading: z.object({
    summary: z.string(),
    favorable: z.array(z.string()),
    constraints: z.array(z.string()),
    trend: z.string(),
    evidenceUsed: z.array(z.string())
  }),
  timing: z.object({
    applicable: z.boolean(),
    window: z.string().nullable(),
    confidence: z.enum(['low', 'medium', 'not_applicable']),
    basis: z.array(z.string())
  }),
  likelihood: z.object({
    applicable: z.boolean(),
    traditionalScore: z.number().min(0).max(100).nullable(),
    traditionalLabel: z.string().nullable(),
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
