import type { LiuYaoLine } from '../../types'
import type { LineStrengthState } from './strength'
import { isClash } from './strength'

export type KongState =
  | 'none' | 'static_weak_empty' | 'moving_empty'
  | 'supported_empty' | 'clashed_empty' | 'broken_empty'

export function evaluateKong(
  line: LiuYaoLine,
  strength: LineStrengthState,
  xunkong: string[],
  dayBranch: string,
  monthBranch: string
): KongState {
  if (!xunkong.includes(line.branch)) return 'none'
  if (isClash(line.branch, dayBranch)) return 'clashed_empty'
  if (strength.monthState === 'month_broken') return 'broken_empty'
  if (strength.monthState === 'month_value' || strength.monthState === 'month_generated' ||
      strength.dayState === 'day_value' || strength.dayState === 'day_generated') return 'supported_empty'
  if (line.moving) return 'moving_empty'
  return 'static_weak_empty'
}

export function kongEvidence(state: KongState, lineIndex: number, branch: string) {
  switch (state) {
    case 'static_weak_empty':
      return { id: `ly_kong_static_${lineIndex}`, title: `静空（${branch}）`, delta: -3, reason: `静爻${branch}逢空，力量减弱`, sourceRule: 'ly_kong_v2' }
    case 'moving_empty':
      return { id: `ly_kong_moving_${lineIndex}`, title: `动空（${branch}）`, delta: -1, reason: `动爻${branch}逢空，待出旬/填实`, sourceRule: 'ly_kong_v2' }
    case 'supported_empty':
      return { id: `ly_kong_supported_${lineIndex}`, title: `旺空（${branch}）`, delta: 0, reason: `${branch}逢空但得月日生扶，不为真空`, sourceRule: 'ly_kong_v2' }
    case 'clashed_empty':
      return { id: `ly_kong_clashed_${lineIndex}`, title: `冲空（${branch}）`, delta: 1, reason: `${branch}逢空又被日冲，待冲空/填实`, sourceRule: 'ly_kong_v2' }
    case 'broken_empty':
      return { id: `ly_kong_broken_${lineIndex}`, title: `破空（${branch}）`, delta: -4, reason: `${branch}逢空又月破，为真空`, sourceRule: 'ly_kong_v2' }
    default:
      return null
  }
}
