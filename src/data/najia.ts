import type { Element, TrigramName } from '../types'

/**
 * 纳甲表（资料 6.3）
 * 内卦：初→三爻；外卦：四→上爻。
 * 地支五行按资料 4.2。
 */
export interface NajiaInfo {
  name: TrigramName
  innerBranches: [string, string, string] // 初,二,三
  outerBranches: [string, string, string] // 四,五,上
  innerStem: string
  outerStem: string
}

export const NAJIA: Record<TrigramName, NajiaInfo> = {
  乾: { name: '乾', innerBranches: ['子', '寅', '辰'], outerBranches: ['午', '申', '戌'], innerStem: '甲', outerStem: '壬' },
  坤: { name: '坤', innerBranches: ['未', '巳', '卯'], outerBranches: ['丑', '亥', '酉'], innerStem: '乙', outerStem: '癸' },
  震: { name: '震', innerBranches: ['子', '寅', '辰'], outerBranches: ['午', '申', '戌'], innerStem: '庚', outerStem: '庚' },
  巽: { name: '巽', innerBranches: ['丑', '亥', '酉'], outerBranches: ['未', '巳', '卯'], innerStem: '辛', outerStem: '辛' },
  坎: { name: '坎', innerBranches: ['寅', '辰', '午'], outerBranches: ['申', '戌', '子'], innerStem: '戊', outerStem: '戊' },
  离: { name: '离', innerBranches: ['卯', '丑', '亥'], outerBranches: ['酉', '未', '巳'], innerStem: '己', outerStem: '己' },
  艮: { name: '艮', innerBranches: ['辰', '午', '申'], outerBranches: ['戌', '子', '寅'], innerStem: '丙', outerStem: '丙' },
  兑: { name: '兑', innerBranches: ['巳', '卯', '丑'], outerBranches: ['亥', '酉', '未'], innerStem: '丁', outerStem: '丁' }
}

/** 十二地支 */
export const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

/** 地支五行（资料 4.2） */
export const BRANCH_ELEMENT: Record<string, Element> = {
  寅: '木', 卯: '木',
  巳: '火', 午: '火',
  申: '金', 酉: '金',
  亥: '水', 子: '水',
  辰: '土', 戌: '土', 丑: '土', 未: '土'
}

/** 天干 */
export const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']

/** 天干五行 */
export const STEM_ELEMENT: Record<string, Element> = {
  甲: '木', 乙: '木',
  丙: '火', 丁: '火',
  戊: '土', 己: '土',
  庚: '金', 辛: '金',
  壬: '水', 癸: '水'
}

/**
 * 取某经卦某爻位（0=初 ... 5=上）的纳支与天干。
 * 0,1,2 为内卦；3,4,5 为外卦。
 */
export function najiaForTrigram(trigram: TrigramName, lineIndex0: 0 | 1 | 2 | 3 | 4 | 5): { branch: string; stem: string } {
  const n = NAJIA[trigram]
  if (lineIndex0 === 0 || lineIndex0 === 1 || lineIndex0 === 2) {
    return { branch: n.innerBranches[lineIndex0], stem: n.innerStem }
  }
  const outerIdx = (lineIndex0 - 3) as 0 | 1 | 2
  return { branch: n.outerBranches[outerIdx], stem: n.outerStem }
}
