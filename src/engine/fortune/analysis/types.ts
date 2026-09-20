/**
 * 运势解释引擎——类型（Phase 14）
 *
 * 所有现实解释都必须可回溯到 FortuneStructureEvidence。
 * 不预测吉凶、不给概率分数。
 */
import type { FortuneSourceLayer, DaYunEntry, LiuNianEntry } from '../types'

/** evidence 种类 */
export type EvidenceKind =
  | 'ten_god'          // 十神
  | 'branch_combine'   // 地支六合
  | 'branch_clash'     // 地支六冲
  | 'dayun_liunian'    // 大运/流年关系
  | 'natal_relation'   // 与原局关系

/** 一条结构证据 */
export interface FortuneStructureEvidence {
  id: string
  sourceLayer: Extract<FortuneSourceLayer, 'bazi-yun' | 'oraculum-normalization'>
  kind: EvidenceKind
  title: string
  detail: string
}

/** 一条解读 */
export interface FortuneReading {
  focus: string
  why: string
  howToAct: string
  watchOut: string
}

/** 单步大运分析 */
export interface DaYunAnalysis {
  entry: DaYunEntry
  /** 大运天干相对日干的十神 */
  stemTenGod?: string
  /** 大运地支相对日干的十神（地支主气） */
  branchTenGod?: string
  evidence: FortuneStructureEvidence[]
  reading: FortuneReading
}

/** 单流年分析 */
export interface LiuNianAnalysis {
  entry: LiuNianEntry
  /** 流年天干相对日干的十神 */
  stemTenGod?: string
  evidence: FortuneStructureEvidence[]
  reading: FortuneReading
}
