import { zodTextFormat } from 'openai/helpers/zod'
import { getOpenAI, getModel } from '../openaiClient'
import { SYSTEM_PROMPT } from './prompt'
import { AiInterpretationSchema } from './schema'
import type { AiInterpretation } from './schema'
import type { AiChatMessage } from '../../src/types/ai'

/** 首次结构化解读 */
export async function runInterpret(snapshot: Record<string, unknown>): Promise<AiInterpretation> {
  const client = getOpenAI()
  const response = await client.responses.parse({
    model: getModel(),
    store: false,
    input: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: JSON.stringify(snapshot) }
    ],
    text: { format: zodTextFormat(AiInterpretationSchema, 'oraculum_ai_interpretation') }
  })
  return response.output_parsed as AiInterpretation
}

/** 追问：把 snapshot + 最近消息 + 当前问题一起发给模型 */
export async function runFollowUp(
  snapshot: Record<string, unknown>,
  messages: AiChatMessage[],
  question: string
): Promise<AiInterpretation> {
  const client = getOpenAI()
  const input: any[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: '本次卦象快照：' + JSON.stringify(snapshot) },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: '继续追问：' + question }
  ]
  const response = await client.responses.parse({
    model: getModel(),
    store: false,
    input,
    text: { format: zodTextFormat(AiInterpretationSchema, 'oraculum_ai_interpretation') }
  })
  return response.output_parsed as AiInterpretation
}
