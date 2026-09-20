/**
 * 本地知识数据统一导出
 *
 * 分层策略（v4.4 性能优化）：
 *  - 卦象完整知识（hexagramMeanings*.json）：静态 import，保持同步可用（fortune/起卦核心依赖同步读取）。
 *  - 长辈友好白话（elderFriendly_*.json，8 批）：真实 dynamic import，按 kingWen 分批懒加载。
 *    同步 getter 从运行时缓存读取；批次未加载时返回 undefined（调用方降级）。
 */

export type {
  LocalHexagramKnowledge,
  LocalLineKnowledge,
  LocalKnowledgeLookup,
  ElderFriendlyHexagramMeaning,
  ElderFriendlyLineMeaning
} from './types'

export { LINE_POSITION_MEANINGS } from './interpretation/lineMeanings'
export { TRIGRAM_MEANINGS } from './interpretation/trigramMeanings'
export { CATEGORY_HINTS } from './interpretation/categoryHints'

export { MEIHUA_ROLES } from './meihua/roles'
export type { MeihuaRole, RoleDescription } from './meihua/roles'
export { BODY_USE_MEANINGS } from './meihua/bodyUseMeanings'
export type { BodyUseRelation, BodyUseMeaning } from './meihua/bodyUseMeanings'

export { SOURCE_REFS, WIKISOURCE_ZHOUYI } from './classics/sources'

import type { LocalHexagramKnowledge, ElderFriendlyHexagramMeaning, ElderFriendlyLineMeaning } from './types'
import HEXAGRAM_MEANINGS_JSON from './interpretation/hexagramMeanings.json'
import HEXAGRAM_MEANINGS_PART2_JSON from './interpretation/hexagramMeaningsPart2.json'

const HEXAGRAM_MEANINGS = HEXAGRAM_MEANINGS_JSON as unknown as Record<number, LocalHexagramKnowledge>
const HEXAGRAM_MEANINGS_PART2 = HEXAGRAM_MEANINGS_PART2_JSON as unknown as Record<number, LocalHexagramKnowledge>

export { HEXAGRAM_MEANINGS, HEXAGRAM_MEANINGS_PART2 }

/** 长辈友好数据条目（JSON 中的结构） */
interface ElderFriendlyEntry extends ElderFriendlyHexagramMeaning {
  lines: {
    elderFriendlyMeaning: string
    realLifeAction: string
    realLifeCaution?: string
  }[]
}

/** 合并全部卦象知识（Part1 + Part2） */
const ALL_MEANINGS: Record<number, LocalHexagramKnowledge> = {
  ...HEXAGRAM_MEANINGS,
  ...HEXAGRAM_MEANINGS_PART2
}

/* ===================== 长辈友好数据：真实动态分批加载 ===================== */

/**
 * 8 个批次的动态加载器。
 * batch0 = 1-8, batch1 = 9-16, ..., batch7 = 57-64。
 * 每个批次独立成 chunk，仅在需要时下载。
 */
const ELDER_BATCH_LOADERS: (() => Promise<{ default: unknown }>)[] = [
  () => import('./interpretation/elderBatch_01_08.ts'),
  () => import('./interpretation/elderBatch_09_16.ts'),
  () => import('./interpretation/elderBatch_17_24.ts'),
  () => import('./interpretation/elderBatch_25_32.ts'),
  () => import('./interpretation/elderBatch_33_40.ts'),
  () => import('./interpretation/elderBatch_41_48.ts'),
  () => import('./interpretation/elderBatch_49_56.ts'),
  () => import('./interpretation/elderBatch_57_64.ts')
]

/** 批次缓存：同批只加载一次（存 Promise，避免并发重复请求） */
const ELDER_BATCH_CACHE = new Map<number, Promise<void>>()

/** 由 kingWen（1-64）计算批次 id（0-7） */
function elderBatchId(kingWen: number): number {
  return Math.min(7, Math.max(0, Math.floor((kingWen - 1) / 8)))
}

/**
 * 将一个长辈友好批次注入到对应卦象知识中（卦级 + 爻级）。
 * 注入是幂等的：重复加载同一批次不会重复追加。
 */
function injectElderBatch(batch: Record<number, ElderFriendlyEntry>): void {
  for (const kwStr of Object.keys(batch)) {
    const kw = Number(kwStr)
    const target = ALL_MEANINGS[kw]
    const elder = batch[kw]
    if (target && elder) {
      target.elderFriendly = {
        elderFriendlySummary: elder.elderFriendlySummary,
        realLifeNow: elder.realLifeNow,
        realLifeProcess: elder.realLifeProcess,
        realLifeLater: elder.realLifeLater,
        commonMisunderstanding: elder.commonMisunderstanding
      }
      if (Array.isArray(elder.lines)) {
        for (let i = 0; i < 6 && i < elder.lines.length; i++) {
          if (target.lines[i]) {
            target.lines[i].elderFriendly = elder.lines[i]
          }
        }
      }
    }
  }
}

/**
 * 异步加载某卦所属的长辈友好批次到缓存。
 * 同批次并发调用只会触发一次实际加载。
 * 调用方（ResultView/KnowledgeView）应先 await 本函数，再调用同步 getter。
 */
export function loadElderFriendlyBatch(kingWen: number): Promise<void> {
  const id = elderBatchId(kingWen)
  const cached = ELDER_BATCH_CACHE.get(id)
  if (cached) return cached
  const loader = ELDER_BATCH_LOADERS[id]
  if (!loader) return Promise.resolve()
  const p = loader()
    .then((mod) => {
      injectElderBatch(mod.default as unknown as Record<number, ElderFriendlyEntry>)
    })
    .catch(() => {
      // 加载失败：清除缓存以便后续重试；同步 getter 会返回 undefined 降级
      ELDER_BATCH_CACHE.delete(id)
    })
  ELDER_BATCH_CACHE.set(id, p)
  return p
}

/**
 * 预加载多个 kingWen 所需的批次（自动去重）。
 * 返回 Promise.all，全部就绪后 resolve。
 */
export function loadElderFriendlyBatches(kingWens: number[]): Promise<void[]> {
  const ids = new Set<number>()
  for (const kw of kingWens) {
    if (Number.isFinite(kw) && kw >= 1 && kw <= 64) ids.add(elderBatchId(kw))
  }
  return Promise.all([...ids].map((id) => {
    const cached = ELDER_BATCH_CACHE.get(id)
    if (cached) return cached
    const loader = ELDER_BATCH_LOADERS[id]
    if (!loader) return Promise.resolve()
    const p = loader()
      .then((mod) => {
        injectElderBatch(mod.default as unknown as Record<number, ElderFriendlyEntry>)
      })
      .catch(() => {
        ELDER_BATCH_CACHE.delete(id)
      })
    ELDER_BATCH_CACHE.set(id, p)
    return p
  }))
}

/**
 * 按 kingWen 查找本地卦象知识（同步）。
 * 未收录时返回 undefined（引擎会降级为基础模板）。
 * 注意：elderFriendly 字段仅在对应批次已加载后才存在。
 */
export function getHexagramKnowledge(kingWen: number): LocalHexagramKnowledge | undefined {
  return ALL_MEANINGS[kingWen]
}

/**
 * 同步查找长辈友好卦级释义。
 * 对应批次未加载时返回 undefined（调用方应降级到 localMeaning.coreMeaning 等）。
 */
export function getElderFriendlyHexagram(kingWen: number): ElderFriendlyHexagramMeaning | undefined {
  return ALL_MEANINGS[kingWen]?.elderFriendly
}

/**
 * 同步查找长辈友好爻级释义。
 * 对应批次未加载时返回 undefined。
 */
export function getElderFriendlyLine(
  kingWen: number,
  lineIndex: 1 | 2 | 3 | 4 | 5 | 6
): ElderFriendlyLineMeaning | undefined {
  return ALL_MEANINGS[kingWen]?.lines[lineIndex - 1]?.elderFriendly
}
