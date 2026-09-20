/**
 * 运势模块——入口
 * v4.4：八字大运流年 + 京房八宫 / 《易隐》十六变研究层 + 运势解释引擎。
 */
export type {
  BirthProfile,
  BirthPrecision,
  FortuneSourceLayer,
  FortunePlainReading,
  BaziPillars,
  BaziOverview,
  DaYunEntry,
  LiuNianEntry,
  QiYunInfo
} from './types'

export { FORTUNE_RULESET_VERSION, FORTUNE_DATASET_VERSION } from './types'

// 出生历法 normalize / 校验
export { normalizeBirthProfile, type NormalizedBirth } from './birth/normalizeBirthProfile'
export { validateBirthProfile, type ValidationResult } from './birth/validateBirthProfile'

// 八字 / 大运 / 流年
export { computeBaziOverview, computeDaYun, computeLiuNian, getLunarVersion } from './bazi'

// 京房八宫 / 《易隐》十六变
export {
  FLIP_SEQUENCE,
  SIXTEEN_STAGES,
  HISTORICAL_TERM_DISCLAIMER,
  HISTORICAL_TERMS,
  transformSixteen,
  getPalaceBaseLines,
  SOURCE_LAYER_NOTES,
  SIXTEEN_TRANSFORM_SOURCE_NOTE,
  NO_AGE_MAPPING_NOTE,
  buildStepReadings
} from './jingfang16'

export type {
  SixteenStage,
  TransformStep,
  SixteenTransformResult,
  JingFangStepReading
} from './jingfang16'

// 运势解释引擎
export {
  GAN_ELEMENT,
  ZHI_ELEMENT,
  GAN_YIN_YANG,
  countElements,
  tenGod,
  isLiuHe,
  isLiuChong,
  relationsWithNatal,
  relationBetween,
  computeNatalFrame,
  splitGanZhi,
  composeReading,
  analyzeDaYun,
  analyzeLiuNian,
  type TenGod,
  type BranchRelation,
  type NatalFrame,
  type FortuneStructureEvidence,
  type FortuneReading,
  type DaYunAnalysis,
  type LiuNianAnalysis
} from './analysis'
