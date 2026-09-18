/**
 * v3.4 Phase A: 统一 LLM 配置
 * 优先级: LLM_* > OPENAI_*
 * iflytek-spark 的 apiMode 固定为 chat-completions（由 adapter 决定）
 */

export interface LlmConfig {
  provider: string
  apiKey?: string
  baseURL: string
  model: string
  apiMode: 'chat-completions'
  maxOutputTokens: number
  timeoutMs: number
}

export function getLlmConfig(): LlmConfig {
  const baseURL = process.env.LLM_BASE_URL || process.env.OPENAI_BASE_URL || 'https://maas-api.cn-huabei-1.xf-yun.com/v2'
  const model = process.env.LLM_MODEL || process.env.OPENAI_MODEL || 'spark-x2.5-4b'

  let provider = 'openai-compatible'
  if (baseURL.includes('openai.com')) provider = 'openai'
  else if (baseURL.includes('volces.com') || baseURL.includes('ark')) provider = 'volcengine-doubao'
  else if (baseURL.includes('xf-yun.com') || baseURL.includes('iflytek')) provider = 'iflytek-spark'
  else if (baseURL.includes('azure.com')) provider = 'azure-openai'

  // apiMode 由实际 adapter 决定，不允许 LLM_API_MODE=responses 欺骗 health
  const apiMode: 'chat-completions' = 'chat-completions'

  const maxOutputTokens = Number(process.env.LLM_MAX_OUTPUT_TOKENS || process.env.OPENAI_MAX_OUTPUT_TOKENS || 2500)
  const timeoutMs = Number(process.env.LLM_TIMEOUT_MS || process.env.OPENAI_TIMEOUT_MS || 45000)

  return {
    provider,
    baseURL,
    model,
    apiMode,
    maxOutputTokens,
    timeoutMs
  }
}
