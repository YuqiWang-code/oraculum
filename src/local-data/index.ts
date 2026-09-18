/**
 * 本地知识数据统一导出
 */

export type {
  LocalHexagramKnowledge,
  LocalLineKnowledge,
  LocalKnowledgeLookup
} from './types'

export { HEXAGRAM_MEANINGS } from './interpretation/hexagramMeanings'
export { HEXAGRAM_MEANINGS_PART2 } from './interpretation/hexagramMeaningsPart2'
export { LINE_POSITION_MEANINGS } from './interpretation/lineMeanings'
export { TRIGRAM_MEANINGS } from './interpretation/trigramMeanings'
export { CATEGORY_HINTS } from './interpretation/categoryHints'

export { MEIHUA_ROLES } from './meihua/roles'
export type { MeihuaRole, RoleDescription } from './meihua/roles'
export { BODY_USE_MEANINGS } from './meihua/bodyUseMeanings'
export type { BodyUseRelation, BodyUseMeaning } from './meihua/bodyUseMeanings'

export { SOURCE_REFS, WIKISOURCE_ZHOUYI } from './classics/sources'

import type { LocalHexagramKnowledge } from './types'
import { HEXAGRAM_MEANINGS } from './interpretation/hexagramMeanings'
import { HEXAGRAM_MEANINGS_PART2 } from './interpretation/hexagramMeaningsPart2'

/** 合并全部卦象知识（Part1 + Part2） */
const ALL_MEANINGS: Record<number, LocalHexagramKnowledge> = {
  ...HEXAGRAM_MEANINGS,
  ...HEXAGRAM_MEANINGS_PART2
}

/**
 * 按 kingWen 查找本地卦象知识
 * 未收录时返回 undefined（引擎会降级为基础模板）
 */
export function getHexagramKnowledge(kingWen: number): LocalHexagramKnowledge | undefined {
  return ALL_MEANINGS[kingWen]
}
