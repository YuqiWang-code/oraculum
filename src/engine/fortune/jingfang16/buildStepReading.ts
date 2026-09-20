/**
 * 京房十六变——单步解读构建（Phase 21-23）
 *
 * 把 TransformStep 转成长辈友好的可读解读：
 * - transition：上一卦 → 当前卦
 * - flippedLine：本次翻动爻位（由 FLIP_SEQUENCE 动态给出，不手写）
 * - structuralChange："第X爻由阳转阴/阴转阳"
 * - stageMeaning：阶段中性说明
 * - hexagramMeaning：当前卦的长辈友好解释（来自 local-data）
 *
 * 不预测死亡/疾病，不给吉凶分数。
 */
import type { SixteenTransformResult, TransformStep } from './types'
import { SIXTEEN_STAGES } from './stages'
import { getElderFriendlyHexagram } from '../../../local-data'

/** 长辈友好单步解读 */
export interface JingFangStepReading {
  /** 步骤序号 0-16 */
  index: number
  /** 上一卦 → 当前卦，如"乾 → 天风姤"；本宫步为"初始基准：乾" */
  transition: string
  /** 本次翻动爻位（1-6），本宫为 0 */
  flippedLine: number
  /** 结构性变化描述，如"第1爻由阳转阴"；本宫为"无翻动" */
  structuralChange: string
  /** 阶段中性说明 */
  stageMeaning: string
  /** 当前卦长辈友好解释（若无本地数据则降级为卦名+阶段说明） */
  hexagramMeaning: string
  /** 来源层说明 */
  sourceNote: string
}

/** 爻位中文名（1=初...6=上） */
const LINE_NAMES = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻']

function lineName(pos: number): string {
  if (pos < 1 || pos > 6) return `第${pos}爻`
  return LINE_NAMES[pos - 1]
}

/** 从六爻编码生成长辈友好卦释义 */
function describeHexagramMeaning(step: TransformStep): string {
  const elder = getElderFriendlyHexagram(step.kingWen)
  if (elder && elder.elderFriendlySummary) {
    // 组合长辈友好三层含义
    const parts: string[] = [elder.elderFriendlySummary]
    if (elder.realLifeNow) parts.push(`当下：${elder.realLifeNow}`)
    if (elder.realLifeProcess) parts.push(`过程：${elder.realLifeProcess}`)
    if (elder.realLifeLater) parts.push(`后续：${elder.realLifeLater}`)
    return parts.join(' ')
  }
  // 降级：卦名 + 阶段说明
  return `${step.hexagramName}卦。${step.stage.modernNote}`
}

/**
 * 为十六变结果的每一步构建解读。
 */
export function buildStepReadings(result: SixteenTransformResult): JingFangStepReading[] {
  return result.steps.map((step, i) => {
    const prev = i > 0 ? result.steps[i - 1] : null
    const isBase = step.flippedLine === 0

    const transition = isBase
      ? `初始基准：${step.hexagramName}`
      : `${prev!.hexagramName} → ${step.hexagramName}`

    let structuralChange = '无翻动（初始基准卦）'
    if (!isBase && prev) {
      const pos = step.flippedLine
      const prevVal = prev.lines[pos - 1]
      const currVal = step.lines[pos - 1]
      const from = prevVal === 1 ? '阳' : '阴'
      const to = currVal === 1 ? '阳' : '阴'
      structuralChange = `第${pos}爻（${lineName(pos)}）由${from}转${to}`
    }

    const stageMeaning = step.stage.modernNote
    const hexagramMeaning = describeHexagramMeaning(step)
    const sourceNote = step.stage.sourceLayer

    return {
      index: i,
      transition,
      flippedLine: step.flippedLine,
      structuralChange,
      stageMeaning,
      hexagramMeaning,
      sourceNote
    }
  })
}

/** 重新导出供 UI 使用 */
export { SIXTEEN_STAGES }
