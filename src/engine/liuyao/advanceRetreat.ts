import type { LiuYaoLine } from '../../types'

const ADVANCES: Record<string, string> = {
  亥: '子', 寅: '卯', 巳: '午', 申: '酉',
  丑: '辰', 辰: '未', 未: '戌'
}

const RETREATS: Record<string, string> = {
  子: '亥', 卯: '寅', 午: '巳', 酉: '申',
  辰: '丑', 未: '辰', 戌: '未'
}

export type AdvanceRetreatType = 'advance' | 'retreat' | 'none'

export interface AdvanceRetreatResult {
  lineIndex: number
  type: AdvanceRetreatType
  originalBranch: string
  changedBranch: string
}

export function evaluateAdvanceRetreat(lines: LiuYaoLine[]): AdvanceRetreatResult[] {
  const results: AdvanceRetreatResult[] = []
  for (const line of lines) {
    if (!line.moving || !line.changedBranch) continue
    if (ADVANCES[line.branch] === line.changedBranch) {
      results.push({ lineIndex: line.index, type: 'advance', originalBranch: line.branch, changedBranch: line.changedBranch })
    } else if (RETREATS[line.branch] === line.changedBranch) {
      results.push({ lineIndex: line.index, type: 'retreat', originalBranch: line.branch, changedBranch: line.changedBranch })
    }
  }
  return results
}

export function advanceRetreatEvidence(r: AdvanceRetreatResult, lineRole?: string) {
  const isUseful = lineRole === 'useful' || lineRole === 'source'
  const isTaboo = lineRole === 'taboo'
  switch (r.type) {
    case 'advance':
      return {
        id: `ly_advance_${r.lineIndex}`,
        title: `进神（${r.originalBranch}→${r.changedBranch}）`,
        delta: isUseful ? 3 : isTaboo ? -3 : 1,
        reason: `${r.originalBranch}化${r.changedBranch}为进神${isUseful ? '（用神/元神进，向好）' : isTaboo ? '（忌神进，向坏）' : ''}`,
        sourceRule: 'ly_advance_retreat_v2'
      }
    case 'retreat':
      return {
        id: `ly_retreat_${r.lineIndex}`,
        title: `退神（${r.originalBranch}→${r.changedBranch}）`,
        delta: isUseful ? -3 : isTaboo ? 3 : -1,
        reason: `${r.originalBranch}化${r.changedBranch}为退神${isUseful ? '（用神退，向弱）' : isTaboo ? '（忌神退，缓解）' : ''}`,
        sourceRule: 'ly_advance_retreat_v2'
      }
    default:
      return null
  }
}
