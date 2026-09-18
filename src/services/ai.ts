import type { DivinationRecord } from '../engine/orchestrator'
import type { AiHealth, AiInterpretation, AiInterpretationResult, AiChatMessage } from '../types/ai'

const TOKEN_KEY = 'oraculum-ai-token'

export function getAiToken(): string {
  return localStorage.getItem(TOKEN_KEY) || ''
}
export function setAiToken(t: string) {
  if (t) localStorage.setItem(TOKEN_KEY, t)
  else localStorage.removeItem(TOKEN_KEY)
}

async function req(path: string, body?: unknown): Promise<Record<string, unknown>> {
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

export async function checkAiAuth(): Promise<{ ok: boolean; message?: string }> {
  try {
    const headers: Record<string, string> = {}
    const token = getAiToken()
    if (token) headers['X-Oraculum-Token'] = token
    const res = await fetch('/api/ai/auth-check', { headers })
    return await res.json()
  } catch {
    return { ok: false, message: '无法连接后端' }
  }
}

export async function requestAiInterpretation(record: DivinationRecord): Promise<AiInterpretationResult> {
  const r = await req('/api/ai/interpret', { record })
  if (!r.ok) throw new Error(String(r.message || 'AI 解读失败'))
  return r as unknown as AiInterpretationResult
}

export async function askAiFollowUp(
  record: DivinationRecord,
  messages: AiChatMessage[]
): Promise<{ result: AiInterpretationResult; safetyBlocked?: boolean }> {
  // v3.1: 不再单独传 question，messages 最后一条即用户问题
  const r = await req('/api/ai/follow-up', { record, messages })
  if (r.code === 'CONTENT_SAFETY') return { result: null as unknown as AiInterpretationResult, safetyBlocked: true }
  if (!r.ok) throw new Error(String(r.message || 'AI 追问失败'))
  return { result: r as unknown as AiInterpretationResult }
}
