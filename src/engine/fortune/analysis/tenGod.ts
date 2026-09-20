/**
 * 十神计算（Phase 14）
 *
 * 日干为日主。以"五行生克 + 阴阳异同"显式推导：
 * - 同五行同阴阳 = 比肩；同五行异阴阳 = 劫财
 * - 我生同阴阳 = 食神；我生异阴阳 = 伤官
 * - 我克同阴阳 = 偏财；我克异阴阳 = 正财
 * - 克我同阴阳 = 七杀；克我异阴阳 = 正官
 * - 生我同阴阳 = 偏印；生我异阴阳 = 正印
 *
 * 中性标签，不自动断吉凶。
 */
import { GAN_ELEMENT, GAN_YIN_YANG, SHENG, KE, type Element5 } from './elements'

export type TenGod =
  | '比肩' | '劫财'
  | '食神' | '伤官'
  | '偏财' | '正财'
  | '七杀' | '正官'
  | '偏印' | '正印'

/**
 * 计算 otherGan 相对 dayGan 的十神。
 * 入参为天干单字（如 '甲'、'癸'）。
 */
export function tenGod(dayGan: string, otherGan: string): TenGod | null {
  const dayEl = GAN_ELEMENT[dayGan]
  const otherEl = GAN_ELEMENT[otherGan]
  if (!dayEl || !otherEl) return null

  const dayYy = GAN_YIN_YANG[dayGan]
  const otherYy = GAN_YIN_YANG[otherGan]
  if (!dayYy || !otherYy) return null

  const sameYy = dayYy === otherYy

  if (dayEl === otherEl) {
    return sameYy ? '比肩' : '劫财'
  }
  // 我生
  if (SHENG[dayEl] === otherEl) {
    return sameYy ? '食神' : '伤官'
  }
  // 我克
  if (KE[dayEl] === otherEl) {
    return sameYy ? '偏财' : '正财'
  }
  // 克我
  if (KE[otherEl] === dayEl) {
    return sameYy ? '七杀' : '正官'
  }
  // 生我
  if (SHENG[otherEl] === dayEl) {
    return sameYy ? '偏印' : '正印'
  }
  return null
}

/**
 * 判断某五行是否生日主五行（用于 evidence 描述）。
 */
export function elementGenerates(generator: Element5, target: Element5): boolean {
  return SHENG[generator] === target
}

/**
 * 判断某五行是否克日主五行。
 */
export function elementControls(controller: Element5, target: Element5): boolean {
  return KE[controller] === target
}
