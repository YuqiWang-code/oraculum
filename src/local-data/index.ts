/**
 * 本地知识数据统一导出
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

import type { LocalHexagramKnowledge, ElderFriendlyHexagramMeaning } from './types'
import HEXAGRAM_MEANINGS_JSON from './interpretation/hexagramMeanings.json'
import HEXAGRAM_MEANINGS_PART2_JSON from './interpretation/hexagramMeaningsPart2.json'

// v4.3 长辈友好数据（分 8 批，每批 8 卦，并行生成后合并）
import ELDER_01_08 from './interpretation/elderFriendly_01_08.json'
import ELDER_09_16 from './interpretation/elderFriendly_09_16.json'
import ELDER_17_24 from './interpretation/elderFriendly_17_24.json'
import ELDER_25_32 from './interpretation/elderFriendly_25_32.json'
import ELDER_33_40 from './interpretation/elderFriendly_33_40.json'
import ELDER_41_48 from './interpretation/elderFriendly_41_48.json'
import ELDER_49_56 from './interpretation/elderFriendly_49_56.json'
import ELDER_57_64 from './interpretation/elderFriendly_57_64.json'

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

const ELDER_BATCHES: Record<number, ElderFriendlyEntry>[] = [
  ELDER_01_08 as unknown as Record<number, ElderFriendlyEntry>,
  ELDER_09_16 as unknown as Record<number, ElderFriendlyEntry>,
  ELDER_17_24 as unknown as Record<number, ElderFriendlyEntry>,
  ELDER_25_32 as unknown as Record<number, ElderFriendlyEntry>,
  ELDER_33_40 as unknown as Record<number, ElderFriendlyEntry>,
  ELDER_41_48 as unknown as Record<number, ElderFriendlyEntry>,
  ELDER_49_56 as unknown as Record<number, ElderFriendlyEntry>,
  ELDER_57_64 as unknown as Record<number, ElderFriendlyEntry>
]

/** 合并全部长辈友好数据 */
const ALL_ELDER: Record<number, ElderFriendlyEntry> = {}
for (const batch of ELDER_BATCHES) {
  Object.assign(ALL_ELDER, batch)
}

/** 合并全部卦象知识（Part1 + Part2 + 长辈友好注入） */
const ALL_MEANINGS: Record<number, LocalHexagramKnowledge> = {
  ...HEXAGRAM_MEANINGS,
  ...HEXAGRAM_MEANINGS_PART2
}

// 将长辈友好数据注入到对应卦象知识中
for (const kwStr of Object.keys(ALL_ELDER)) {
  const kw = Number(kwStr)
  const target = ALL_MEANINGS[kw]
  const elder = ALL_ELDER[kw]
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

/**
 * 按 kingWen 查找本地卦象知识
 * 未收录时返回 undefined（引擎会降级为基础模板）
 */
export function getHexagramKnowledge(kingWen: number): LocalHexagramKnowledge | undefined {
  return ALL_MEANINGS[kingWen]
}

/** 查找长辈友好卦级释义 */
export function getElderFriendlyHexagram(kingWen: number): ElderFriendlyHexagramMeaning | undefined {
  return ALL_MEANINGS[kingWen]?.elderFriendly
}
