/**
 * 运势模块——入口
 * v4.3 新增：八字大运流年 + 京房八宫 / 《易隐》十六变研究层。
 */
export type {
  BirthProfile,
  BirthPrecision,
  FortuneSourceLayer,
  FortunePlainReading,
  BaziPillars,
  BaziOverview,
  DaYunEntry,
  LiuNianEntry
} from './types'

export { FORTUNE_RULESET_VERSION, FORTUNE_DATASET_VERSION } from './types'

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
  NO_AGE_MAPPING_NOTE
} from './jingfang16'

export type {
  SixteenStage,
  TransformStep,
  SixteenTransformResult
} from './jingfang16'
