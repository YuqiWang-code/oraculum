import 'dotenv/config'
import OpenAI from 'openai'

let client: OpenAI | null = null

export interface ProviderInfo {
  provider: string
  baseURL: string
  model: string
  apiMode: 'chat-completions' | 'responses'
  structuredOutputMode: 'json-prompt-zod' | 'json-mode-zod' | 'responses-zod'
}

export function isPlaceholderSecret(v?: string): boolean {
  if (!v) return true
  const s = v.trim()
  if (!s) return true
  if (s.startsWith('YOUR_')) return true
  if (s.startsWith('CHANGE_ME')) return true
  if (s.startsWith('REPLACE_ME')) return true
  if (/^<.*>$/.test(s)) return true
  return false
}

export function getApiKey(): string | undefined {
  // v3.3: LLM_* > OPENAI_*
  const k = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY
  if (isPlaceholderSecret(k)) return undefined
  return k
}

export function getModel(): string {
  return process.env.LLM_MODEL || process.env.OPENAI_MODEL || 'doubao-seed-1-6-250615'
}

export function getBaseURL(): string {
  return process.env.LLM_BASE_URL || process.env.OPENAI_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3'
}

export function getApiMode(): 'chat-completions' | 'responses' {
  return (process.env.LLM_API_MODE as 'chat-completions' | 'responses') || 'chat-completions'
}

export function getProviderInfo(): ProviderInfo {
  const baseURL = getBaseURL()
  const model = getModel()
  const apiMode = getApiMode()
  let provider = 'openai-compatible'
  if (baseURL.includes('openai.com')) provider = 'openai'
  else if (baseURL.includes('volces.com') || baseURL.includes('ark')) provider = 'volcengine-doubao'
  else if (baseURL.includes('xf-yun.com') || baseURL.includes('iflytek')) provider = 'iflytek-spark'
  else if (baseURL.includes('azure.com')) provider = 'azure-openai'
  const structuredOutputMode: ProviderInfo['structuredOutputMode'] =
    apiMode === 'responses' ? 'responses-zod' : 'json-prompt-zod'
  return { provider, baseURL, model, apiMode, structuredOutputMode }
}

export function isConfigured(): boolean {
  return !!getApiKey()
}

export function getOpenAI(): OpenAI {
  if (!client) {
    const opts: ConstructorParameters<typeof OpenAI>[0] = { apiKey: getApiKey() }
    opts.baseURL = getBaseURL()
    client = new OpenAI(opts)
  }
  return client
}
