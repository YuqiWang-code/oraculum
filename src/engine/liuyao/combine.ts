import type { LiuYaoLine } from '../../types'
import { isCombine } from './strength'

export type CombineState =
  | 'none' | 'static_activated' | 'moving_bound'
  | 'line_mutual_support' | 'transformed_support'

export function evaluateCombine(
  line: LiuYaoLine,
  dayBranch: string,
  monthBranch: string
): CombineState {
  if (isCombine(line.branch, dayBranch) || isCombine(line.branch, monthBranch)) {
    return line.moving ? 'moving_bound' : 'static_activated'
  }
  return 'none'
}

export function combineEvidence(state: CombineState, lineIndex: number, branch: string) {
  switch (state) {
    case 'static_activated':
      return { id: `ly_combine_static_${lineIndex}`, title: `合起（${branch}）`, delta: 2, reason: `静爻${branch}逢日/月合，为合起`, sourceRule: 'ly_combine_v2' }
    case 'moving_bound':
      return { id: `ly_combine_bound_${lineIndex}`, title: `合绊（${branch}）`, delta: -2, reason: `动爻${branch}逢合，为合绊（待冲开）`, sourceRule: 'ly_combine_v2' }
    default:
      return null
  }
}
