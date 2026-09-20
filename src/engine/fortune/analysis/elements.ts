/**
 * 天干 / 地支五行与阴阳映射（Phase 11 / Phase 14）
 *
 * 显式映射，不调用 ec.getWuXing()（该方法在 EightChar 上不存在）。
 */

export type Element5 = '木' | '火' | '土' | '金' | '水'
export type YinYang = '阳' | '阴'

/** 天干五行：甲乙木，丙丁火，戊己土，庚辛金，壬癸水 */
export const GAN_ELEMENT: Record<string, Element5> = {
  甲: '木', 乙: '木',
  丙: '火', 丁: '火',
  戊: '土', 己: '土',
  庚: '金', 辛: '金',
  壬: '水', 癸: '水'
}

/** 天干阴阳：甲丙戊庚壬为阳，乙丁己辛癸为阴 */
export const GAN_YIN_YANG: Record<string, YinYang> = {
  甲: '阳', 丙: '阳', 戊: '阳', 庚: '阳', 壬: '阳',
  乙: '阴', 丁: '阴', 己: '阴', 辛: '阴', 癸: '阴'
}

/** 地支五行：寅卯木，巳午火，辰戌丑未土，申酉金，亥子水 */
export const ZHI_ELEMENT: Record<string, Element5> = {
  寅: '木', 卯: '木',
  巳: '火', 午: '火',
  辰: '土', 戌: '土', 丑: '土', 未: '土',
  申: '金', 酉: '金',
  亥: '水', 子: '水'
}

/** 五行相生：我生者为食伤 */
export const SHENG: Record<Element5, Element5> = {
  木: '火', 火: '土', 土: '金', 金: '水', 水: '木'
}

/** 五行相克：我克者为财 */
export const KE: Record<Element5, Element5> = {
  木: '土', 土: '水', 水: '火', 火: '金', 金: '木'
}

/** 统计一组干支（表层八字）的五行数量 */
export function countElements(
  stems: string[],
  branches: string[]
): Record<Element5, number> {
  const result: Record<Element5, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 }
  for (const s of stems) {
    const e = GAN_ELEMENT[s]
    if (e) result[e]++
  }
  for (const b of branches) {
    const e = ZHI_ELEMENT[b]
    if (e) result[e]++
  }
  return result
}
