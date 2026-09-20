/**
 * 现实白话解读引擎——输出类型
 * v4.3 新增：让完全不懂《易经》的老人也能直接看懂。
 * 纯本地、离线、确定性。只读已有术数结果，不重新起卦、不改评分。
 */

export interface RealWorldPlainReading {
  /** 大字标题：一句话点题 */
  headline: string
  /** 现在是什么情况（长辈能直接懂） */
  currentSituation: string
  /** 为什么这么看——逐条来源 */
  why: {
    /** 本卦说明什么 */
    base: string
    /** 动爻说明什么（可能多条） */
    moving: string[]
    /** 互卦说明什么（梅花用） */
    mutual?: string
    /** 变卦说明什么 */
    changed?: string
    /** 体用说明什么（梅花用） */
    bodyUse?: string
    /** 评分说明什么 */
    rating?: string
  }
  /** 接下来怎么做——具体行动列表 */
  howToAct: string[]
  /** 最需要注意什么 */
  watchOutFor: string[]
  /** 时间线（可选） */
  timeline?: {
    now: string
    turningPoint?: string
    middle?: string
    later?: string
  }
  /** 现实提醒（RealityGuard 触发时） */
  realityGuard?: string
  /** 免责声明 */
  disclaimer: string
}

/** 现代释义禁词列表——validate-data 和 wordingGuard 共用 */
export const FORBIDDEN_WORDS = [
  '一定',
  '必然',
  '百分之百',
  '百分百',
  '命中注定',
  '必死',
  '会死亡',
  '某年重病',
  '你会死亡',
  '某年去世',
  '某年必患重病',
  '寿命到这里'
] as const
