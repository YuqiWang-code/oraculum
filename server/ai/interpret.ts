import { getOpenAI } from '../openaiClient.js'
import { getLlmConfig } from '../config/llm.js'
import { SYSTEM_PROMPT } from './prompt.js'
import { AiInterpretationSchema } from './schema.js'
import type { AiInterpretation } from './schema.js'
import type { AiChatMessage } from '../../src/types/ai'

export interface InterpretResult {
  result: AiInterpretation
  model: string
  usage?: { input_tokens?: number; output_tokens?: number }
}

/** 从模型输出中提取 JSON（兼容 ```json 包裹和直接输出） */
function extractJson(text: string): unknown {
  const trimmed = text.trim()
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  const raw = fence ? fence[1].trim() : trimmed
  return JSON.parse(raw)
}

/** 首次解读 */
export async function runInterpret(snapshot: Record<string, unknown>): Promise<InterpretResult> {
  const client = getOpenAI()
  const cfg = getLlmConfig()
  const res = await client.chat.completions.create({
    model: cfg.model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT + '\n\n请严格按 JSON 格式输出，不要输出其他内容。' },
      { role: 'user', content: JSON.stringify(snapshot) }
    ],
    max_tokens: cfg.maxOutputTokens
  }, { timeout: cfg.timeoutMs })
  const text = res.choices[0]?.message?.content || '{}'
  const result = AiInterpretationSchema.parse(extractJson(text))
  return {
    result,
    model: cfg.model,
    usage: res.usage ? {
      input_tokens: res.usage.prompt_tokens,
      output_tokens: res.usage.completion_tokens
    } : undefined
  }
}

/** 追问（messages 最后一条即用户问题） */
export async function runFollowUp(
  snapshot: Record<string, unknown>,
  messages: AiChatMessage[]
): Promise<InterpretResult> {
  const client = getOpenAI()
  const cfg = getLlmConfig()
  const all: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: SYSTEM_PROMPT + '\n\n请严格按 JSON 格式输出，不要输出其他内容。' },
    { role: 'user', content: '本次卦象快照：' + JSON.stringify(snapshot) },
    ...messages.map((m) => ({ role: m.role, content: m.content }))
  ]
  const res = await client.chat.completions.create({
    model: cfg.model,
    messages: all,
    max_tokens: cfg.maxOutputTokens
  }, { timeout: cfg.timeoutMs })
  const text = res.choices[0]?.message?.content || '{}'
  const result = AiInterpretationSchema.parse(extractJson(text))
  return {
    result,
    model: cfg.model,
    usage: res.usage ? {
      input_tokens: res.usage.prompt_tokens,
      output_tokens: res.usage.completion_tokens
    } : undefined
  }
}
