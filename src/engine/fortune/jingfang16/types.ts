/**
 * 京房八宫 / 《易隐》十六变——类型定义
 * v4.3 新增。严格区分来源层：京房八宫核心 vs 《易隐》后世扩展。
 */
import type { FortuneSourceLayer } from '../types'

/** 翻爻序列（1=初爻，自下而上）。16 次变化，最终回到本宫。 */
export const FLIP_SEQUENCE = [1, 2, 3, 4, 5, 4, 3, 2, 1, 2, 3, 4, 5, 4, 3, 2] as const

/** 十六变阶段定义（0=本宫初始，1-16=16次变化，16=还原） */
export interface SixteenStage {
  /** 阶段序号 0-16 */
  index: number
  /** 阶段名 */
  name: string
  /** 来源层 */
  sourceLayer: FortuneSourceLayer
  /** 现代中性说明（不预测死亡/疾病） */
  modernNote: string
}

/** 单次变换结果 */
export interface TransformStep {
  stage: SixteenStage
  /** 变换后的六爻（自下而上 [初,二,三,四,五,上]，1=阳 0=阴） */
  lines: [0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1]
  /** 卦名（简体） */
  hexagramName: string
  /** 周文王序号 */
  kingWen: number
  /** 本次翻动的爻位（1-6），初始本宫为 0 */
  flippedLine: number
}

/** 十六变完整结果 */
export interface SixteenTransformResult {
  /** 初始本宫卦名 */
  baseName: string
  /** 初始本宫六爻 */
  baseLines: [0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1]
  /** 17 个状态（初始 + 16 次变化） */
  steps: TransformStep[]
  /** 最终是否回到本宫 */
  returnsToBase: boolean
}
