import type { SixSpirit } from '../types'

/**
 * 六神/六兽（资料 6.5）
 * 固定循环：青龙→朱雀→勾陈→螣蛇→白虎→玄武
 * 按日天干定初爻起点。
 */
export const SIX_SPIRITS_ORDER: SixSpirit[] = ['青龙', '朱雀', '勾陈', '螣蛇', '白虎', '玄武']

/** 日干 -> 初爻起始六神索引 */
const DAY_STEM_START: Record<string, number> = {
  甲: 0, 乙: 0, // 甲乙日 初爻青龙
  丙: 1, 丁: 1, // 丙丁日 初爻朱雀
  戊: 2, // 戊日 勾陈
  己: 3, // 己日 螣蛇
  庚: 4, 辛: 4, // 庚辛日 白虎
  壬: 5, 癸: 5 // 壬癸日 玄武
}

/**
 * 返回六爻（初→上）的六神数组，长度 6。
 * @param dayStem 日天干
 */
export function sixSpiritsForDay(dayStem: string): SixSpirit[] {
  const start = DAY_STEM_START[dayStem]
  if (start === undefined) throw new Error(`未知日干: ${dayStem}`)
  return [0, 1, 2, 3, 4, 5].map((i) => SIX_SPIRITS_ORDER[(start + i) % 6])
}

/** 六神传统象意（仅作风格象意，非吉凶判决） */
export const SIX_SPIRIT_MEANING: Record<SixSpirit, string> = {
  青龙: '喜庆、生发、文雅',
  朱雀: '口舌、文书、信息',
  勾陈: '迟滞、田土、稳重',
  螣蛇: '虚惊、怪异、缠绕',
  白虎: '刑伤、威严、果断',
  玄武: '暗昧、隐秘、智巧'
}
