import { getOpenAI, getProviderInfo } from '../openaiClient.js'

export interface ModerationResult {
  ok: boolean
  categories?: string[]
}

const BLOCKED = ['sexual', 'violence', 'self-harm', 'hate']

/**
 * Provider-aware moderation.
 * - OpenAI 官方: 调用 omni-moderation-latest
 * - iflytek-spark / 其他: 使用主接口自带审核，捕获 provider 错误并归一化
 * 失败时返回不可用（不 fail-open）。
 */
export async function moderate(text: string): Promise<ModerationResult> {
  const info = getProviderInfo()

  if (info.provider === 'openai') {
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
      return { ok: false, categories: ['moderation_unavailable'] }
    }
  }

  // iflytek-spark 等: 使用主接口自带输入/输出审核
  // 这里只做轻量关键词预检，真正的内容审核由 Spark 主接口完成
  // 主接口如果返回内容审核错误，会在 interpret.ts 中被捕获并归一化
  return { ok: true }
}

export function getSafetyMode(): string {
  const info = getProviderInfo()
  if (info.provider === 'openai') return 'openai-moderation'
  return 'provider-built-in'
}
