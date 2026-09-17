import 'dotenv/config'
import OpenAI from 'openai'

let client: OpenAI | null = null

export function getApiKey(): string | undefined {
  return process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'YOUR_NEW_KEY_HERE'
    ? process.env.OPENAI_API_KEY
    : undefined
}

export function getModel(): string {
  return process.env.OPENAI_MODEL || 'gpt-5.6-terra'
}

export function isConfigured(): boolean {
  return !!getApiKey()
}

export function getOpenAI(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: getApiKey() })
  }
  return client
}
