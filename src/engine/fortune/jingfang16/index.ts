/**
 * 京房八宫 / 《易隐》十六变——模块入口
 */
export { FLIP_SEQUENCE } from './types'
export type {
  SixteenStage,
  TransformStep,
  SixteenTransformResult
} from './types'

export { SIXTEEN_STAGES, HISTORICAL_TERM_DISCLAIMER, HISTORICAL_TERMS } from './stages'
export { transformSixteen, getPalaceBaseLines } from './transform'
export { SOURCE_LAYER_NOTES, SIXTEEN_TRANSFORM_SOURCE_NOTE, NO_AGE_MAPPING_NOTE } from './sourceNotes'
export { buildStepReadings, type JingFangStepReading } from './buildStepReading'
