import type { LiuYaoLine } from '../../types'
import { BRANCH_ELEMENT } from '../../data/najia'
import { generates, controls } from './roles'
import { isClash, isCombine } from './strength'

export type TransformRelation =
  | 'back_generate' | 'back_control' | 'back_combine' | 'back_clash' | 'same' | 'neutral'

export interface TransformResult {
  lineIndex: number
  originalBranch: string
  changedBranch: string
  relation: TransformRelation
}

export function evaluateTransforms(lines: LiuYaoLine[]): TransformResult[] {
  const results: TransformResult[] = []
  for (const line of lines) {
    if (!line.moving || !line.changedBranch) continue
    const origEl = line.branchElement
    const changedEl = BRANCH_ELEMENT[line.changedBranch]
    let relation: TransformRelation = 'neutral'
    if (generates(changedEl, origEl)) relation = 'back_generate'
    else if (controls(changedEl, origEl)) relation = 'back_control'
    else if (isCombine(line.changedBranch, line.branch)) relation = 'back_combine'
    else if (isClash(line.changedBranch, line.branch)) relation = 'back_clash'
    else if (changedEl === origEl) relation = 'same'
    results.push({
      lineIndex: line.index,
      originalBranch: line.branch,
      changedBranch: line.changedBranch,
      relation
    })
  }
  return results
}

export function transformEvidence(r: TransformResult, lineRole?: string) {
  const weight = (lineRole === 'useful' || lineRole === 'shi') ? 1.5 : 1
  switch (r.relation) {
    case 'back_generate':
      return { id: `ly_back_gen_${r.lineIndex}`, title: `回头生（${r.originalBranch}→${r.changedBranch}）`, delta: Math.round(4 * weight), reason: `变爻${r.changedBranch}生本位动爻${r.originalBranch}`, sourceRule: 'ly_transform_v2' }
    case 'back_control':
      return { id: `ly_back_ctrl_${r.lineIndex}`, title: `回头克（${r.originalBranch}→${r.changedBranch}）`, delta: Math.round(-4 * weight), reason: `变爻${r.changedBranch}克本位动爻${r.originalBranch}`, sourceRule: 'ly_transform_v2' }
    case 'back_combine':
      return { id: `ly_back_combine_${r.lineIndex}`, title: `回头合（${r.originalBranch}→${r.changedBranch}）`, delta: 1, reason: `变爻${r.changedBranch}合本位动爻${r.originalBranch}`, sourceRule: 'ly_transform_v2' }
    case 'back_clash':
      return { id: `ly_back_clash_${r.lineIndex}`, title: `回头冲（${r.originalBranch}→${r.changedBranch}）`, delta: -1, reason: `变爻${r.changedBranch}冲本位动爻${r.originalBranch}`, sourceRule: 'ly_transform_v2' }
    default:
      return null
  }
}
