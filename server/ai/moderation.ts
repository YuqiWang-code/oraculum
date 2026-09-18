import { getOpenAI } from '../openaiClient.js'

export interface ModerationResult {
  ok: boolean
  categories?: string[]
}

const BLOCKED = ['sexual', 'violence', 'self-harm', 'hate']

/** 用 omni-moderation-latest 对文本做安全检查；失败时返回 error（不 fail-open） */
export async function moderate(text: string): Promise<ModerationResult> {
  try {
    const res = await getOpenAI().moderations.create({
      model: 'omni-moderation-latest',
      input: text
    })
    const r = res.results?.[0]
    if (!r) return { ok: true }
    const cats = r.categories as unknown as Record<string, boolean>
    const hit = BLOCKED.filter((c) => cats[c])
    return { ok: hit.length === 0, categories: hit }
  } catch {
    // v3.1: moderation 故障不 fail-open，返回不可用
    return { ok: false, categories: ['moderation_unavailable'] }
  }
}
