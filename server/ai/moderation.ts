import { getOpenAI } from '../openaiClient'

export interface ModerationResult {
  ok: boolean
  categories?: string[]
}

const BLOCKED = ['sexual', 'violence', 'self-harm', 'hate']

/** 用 omni-moderation-latest 对文本做安全检查；失败时默认放行（不阻断本地功能） */
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
    // moderation 不可用时不阻断主流程
    return { ok: true }
  }
}
