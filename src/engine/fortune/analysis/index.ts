/**
 * 运势解释引擎——统一导出（Phase 14-20）
 */
export {
  GAN_ELEMENT,
  ZHI_ELEMENT,
  GAN_YIN_YANG,
  SHENG,
  KE,
  countElements,
  type Element5,
  type YinYang
} from './elements'

export { tenGod, type TenGod } from './tenGod'

export {
  isLiuHe,
  isLiuChong,
  relationsWithNatal,
  relationBetween,
  type BranchRelation,
  type BranchRelationKind
} from './branchRelations'

export {
  computeNatalFrame,
  splitGanZhi,
  type NatalFrame
} from './natalFrame'

export { composeReading } from './composeFortunePlainReading'

export { analyzeDaYun } from './analyzeDaYun'
export { analyzeLiuNian } from './analyzeLiuNian'

export type {
  FortuneStructureEvidence,
  FortuneReading,
  DaYunAnalysis,
  LiuNianAnalysis,
  EvidenceKind
} from './types'
