/**
 * 轻量卦象索引（v4.4 性能优化）
 *
 * 仅保留首屏列表 / 搜索 / 一句话所需的小字段：
 *   kingWen, name, core, theme, themes, asMutual, asChanged, 每爻 themeKeyword+core。
 *
 * 完整古文（卦辞/彖/象）、完整现代白话、384爻详解、长辈友好白话仍在 heavy bundles
 * （hexagramMeanings*.json 静态缓存 + elderFriendly_*.json 动态分批）。
 *
 * 本模块故意保持极小且静态 import，供 KnowledgeView 首屏与起卦一句话路径使用。
 */

import LIGHT_JSON from './light.json'

/** 单卦轻量条目 */
export interface LightHexagramEntry {
  kingWen: number
  name: string
  /** 核心含义（一句话） */
  core: string
  /** 主主题词 */
  theme: string
  /** 全部主题词（搜索标签） */
  themes: string[]
  /** 作为互卦（中间过程）的一句话 */
  asMutual: string
  /** 作为变卦（后续趋向）的一句话 */
  asChanged: string
  /** 六爻轻量条目 */
  lines: {
    index: number
    themeKeyword: string
    core: string
  }[]
}

/** 轻量索引表（kingWen -> entry）。只读冻结，避免 Vue 深响应开销。 */
export const LIGHT_HEXAGRAMS = Object.freeze(
  LIGHT_JSON as unknown as Record<number, LightHexagramEntry>
)

/** 按 kingWen 同步读取轻量条目（未收录返回 undefined） */
export function getLightHexagram(kingWen: number): LightHexagramEntry | undefined {
  return LIGHT_HEXAGRAMS[kingWen]
}

/**
 * 在轻量索引中搜索：匹配卦名 / 主主题 / 全部主题词 / 每爻主题词。
 * 用于首屏搜索，避免构造全部 64 个 heavy 对象。
 */
export function searchLightHexagrams(query: string): LightHexagramEntry[] {
  const q = query.trim()
  if (!q) return Object.values(LIGHT_HEXAGRAMS)
  return Object.values(LIGHT_HEXAGRAMS).filter((h) => {
    if (h.name.includes(q)) return true
    if (h.theme.includes(q)) return true
    if (h.themes.some((t) => t.includes(q))) return true
    if (h.lines.some((l) => l.themeKeyword.includes(q) || l.core.includes(q))) return true
    if (h.core.includes(q)) return true
    return false
  })
}
