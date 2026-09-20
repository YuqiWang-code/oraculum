/**
 * 地支关系：六合与六冲（Phase 14）
 *
 * 只实现：
 * - 六合：子丑、寅亥、卯戌、辰酉、巳申、午未
 * - 六冲：子午、丑未、寅申、卯酉、辰戌、巳亥
 *
 * 分析大运支 / 流年支与原局四支、以及流年支与大运支的关系。
 * 生成可回溯 evidence，不预测吉凶。
 */

/** 六合对（无序） */
const LIU_HE: [string, string][] = [
  ['子', '丑'], ['寅', '亥'], ['卯', '戌'],
  ['辰', '酉'], ['巳', '申'], ['午', '未']
]

/** 六冲对（无序） */
const LIU_CHONG: [string, string][] = [
  ['子', '午'], ['丑', '未'], ['寅', '申'],
  ['卯', '酉'], ['辰', '戌'], ['巳', '亥']
]

function pairContains(pair: [string, string], a: string, b: string): boolean {
  return (pair[0] === a && pair[1] === b) || (pair[0] === b && pair[1] === a)
}

/** 判断两个地支是否六合 */
export function isLiuHe(a: string, b: string): boolean {
  return LIU_HE.some((p) => pairContains(p, a, b))
}

/** 判断两个地支是否六冲 */
export function isLiuChong(a: string, b: string): boolean {
  return LIU_CHONG.some((p) => pairContains(p, a, b))
}

/** 关系类型 */
export type BranchRelationKind = '六合' | '六冲'

export interface BranchRelation {
  kind: BranchRelationKind
  /** 参与关系的两个地支 */
  a: string
  b: string
  /** 关系描述，如"午与子形成六冲" */
  description: string
}

/**
 * 分析一个外来地支（大运支或流年支）与原局四支的关系。
 * @param foreignBranch 外来地支
 * @param natalBranches 原局四支（年/月/日/时地支）
 * @param foreignLabel 外来地支的标签（如"大运支""流年支"）
 */
export function relationsWithNatal(
  foreignBranch: string,
  natalBranches: string[],
  foreignLabel: string
): BranchRelation[] {
  const out: BranchRelation[] = []
  for (const nb of natalBranches) {
    if (!nb) continue
    if (isLiuChong(foreignBranch, nb)) {
      out.push({
        kind: '六冲',
        a: foreignBranch,
        b: nb,
        description: `${foreignLabel}${foreignBranch}与原局${nb}形成六冲（${foreignBranch}${nb}冲）。`
      })
    } else if (isLiuHe(foreignBranch, nb)) {
      out.push({
        kind: '六合',
        a: foreignBranch,
        b: nb,
        description: `${foreignLabel}${foreignBranch}与原局${nb}形成六合（${foreignBranch}${nb}合）。`
      })
    }
  }
  return out
}

/**
 * 分析流年支与大运支之间的关系。
 */
export function relationBetween(
  liuNianBranch: string,
  daYunBranch: string
): BranchRelation | null {
  if (!liuNianBranch || !daYunBranch) return null
  if (isLiuChong(liuNianBranch, daYunBranch)) {
    return {
      kind: '六冲',
      a: liuNianBranch,
      b: daYunBranch,
      description: `流年支${liuNianBranch}与大运支${daYunBranch}形成六冲（${liuNianBranch}${daYunBranch}冲）。`
    }
  }
  if (isLiuHe(liuNianBranch, daYunBranch)) {
    return {
      kind: '六合',
      a: liuNianBranch,
      b: daYunBranch,
      description: `流年支${liuNianBranch}与大运支${daYunBranch}形成六合（${liuNianBranch}${daYunBranch}合）。`
    }
  }
  return null
}
