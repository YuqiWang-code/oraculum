import 'dotenv/config'
import OpenAI from 'openai'

let client: OpenAI | null = null

export interface ProviderInfo {
  provider: string
  baseURL: string
  model: string
  apiMode: 'responses' | 'chat'
}

export function getApiKey(): string | undefined {
  const k = process.env.OPENAI_API_KEY
  if (!k || k === 'YOUR_NEW_KEY_HERE' || k === 'YOUR_ARK_API_KEY_HERE' || k === 'CHANGE_ME_TO_A_PRIVATE_TOKEN') return undefined
  return k
}

export function getModel(): string {
  return process.env.OPENAI_MODEL || 'doubao-seed-1-6-250615'
}

export function getBaseURL(): string {
  return process.env.OPENAI_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3'
}

/** 根据 baseURL 推断 provider */
export function getProviderInfo(): ProviderInfo {
  const baseURL = getBaseURL()
  const model = getModel()
  let provider = 'openai-compatible'
  if (baseURL.includes('openai.com')) provider = 'openai'
  else if (baseURL.includes('volces.com') || baseURL.includes('ark')) provider = 'volcengine-doubao'
  else if (baseURL.includes('xf-yun.com') || baseURL.includes('iflytek')) provider = 'iflytek-spark'
  else if (baseURL.includes('azure.com')) provider = 'azure-openai'
  return { provider, baseURL, model, apiMode: 'responses' }
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
