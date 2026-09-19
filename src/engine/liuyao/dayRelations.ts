import type { LineStrengthState } from './strength'
import { isClash, isCombine } from './strength'

export type DayClashState = 'none' | 'hidden_movement' | 'day_break' | 'clash_empty' | 'break_combine' | 'moving_clashed'

export function evaluateDayClash(
  strength: LineStrengthState,
  dayBranch: string,
  hasCombine: boolean
): DayClashState {
  if (!isClash(strength.branch, dayBranch)) return 'none'
  if (strength.isKong) return 'clash_empty'
  if (hasCombine) return 'break_combine'
  if (strength.moving) return 'moving_clashed'
  if (strength.strengthLevel === 'weak') return 'day_break'
  if (strength.strengthLevel === 'strong' || strength.strengthLevel === 'balanced') return 'hidden_movement'
  return 'none'
}

export function dayClashEvidence(state: DayClashState, lineIndex: number, branch: string) {
  switch (state) {
    case 'hidden_movement':
      return { id: `ly_hidden_move_${lineIndex}`, title: `暗动（${branch}）`, delta: 2, reason: `旺相静爻${branch}被日辰冲，为暗动`, sourceRule: 'ly_day_clash_v2' }
    case 'day_break':
      return { id: `ly_day_break_${lineIndex}`, title: `日破（${branch}）`, delta: -3, reason: `休囚静爻${branch}被日辰冲，为日破`, sourceRule: 'ly_day_clash_v2' }
    case 'clash_empty':
      return { id: `ly_clash_empty_${lineIndex}`, title: `冲空（${branch}）`, delta: 1, reason: `空爻${branch}被日辰冲，为冲空（待出旬/填实应期）`, sourceRule: 'ly_day_clash_v2' }
    case 'break_combine':
      return { id: `ly_break_combine_${lineIndex}`, title: `冲开合（${branch}）`, delta: -1, reason: `合绊之爻${branch}被日辰冲，合被冲开`, sourceRule: 'ly_day_clash_v2' }
    case 'moving_clashed':
      return { id: `ly_moving_clashed_${lineIndex}`, title: `动而逢冲（${branch}）`, delta: 0, reason: `动爻${branch}被日辰冲，为动而逢冲（不称暗动）`, sourceRule: 'ly_day_clash_v2' }
    default:
      return null
  }
}
