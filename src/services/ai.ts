import type { DivinationRecord } from '../engine/orchestrator'
import type { AiHealth, AiInterpretation, AiChatMessage } from '../types/ai'

const TOKEN_KEY = 'oraculum-ai-token'

export function getAiToken(): string {
  return localStorage.getItem(TOKEN_KEY) || ''
}
export function setAiToken(t: string) {
  if (t) localStorage.setItem(TOKEN_KEY, t)
  else localStorage.removeItem(TOKEN_KEY)
}

async function req(path: string, body?: unknown): Promise<any> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = getAiToken()
  if (token) headers['X-Oraculum-Token'] = token
  const res = await fetch(path, {
    method: 'POST',
    headers,
    body: body ? JSON.stringify(body) : undefined
  })
  return res.json()
}

export async function checkAiHealth(): Promise<AiHealth> {
  try {
    const res = await fetch('/api/ai/health')
    return await res.json()
  } catch {
    return { enabled: false }
  }
}

export async function requestAiInterpretation(record: DivinationRecord): Promise<AiInterpretation> {
  const r = await req('/api/ai/interpret', { record })
  if (!r.ok) throw new Error(r.message || 'AI 解读失败')
  return r.result as AiInterpretation
}

export async function askAiFollowUp(
  record: DivinationRecord,
  messages: AiChatMessage[],
  question: string
): Promise<{ result: AiInterpretation; safetyBlocked?: boolean }> {
  const r = await req('/api/ai/follow-up', { record, messages, question })
  if (r.code === 'CONTENT_SAFETY') return { result: null as unknown as AiInterpretation, safetyBlocked: true }
  if (!r.ok) throw new Error(r.message || 'AI 追问失败')
  return { result: r.result as AiInterpretation }
}
