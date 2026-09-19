import type { LiuYaoLine } from '../../types'
import { BRANCH_ELEMENT } from '../../data/najia'
import { generates, controls } from './roles'

export type MonthState =
  | 'month_value' | 'month_same_element' | 'month_generated'
  | 'month_controlled' | 'month_combined' | 'month_broken' | 'neutral'

export type DayState =
  | 'day_value' | 'day_same_element' | 'day_generated'
  | 'day_controlled' | 'day_combined' | 'day_clashed' | 'neutral'

export interface LineStrengthState {
  lineIndex: number
  branch: string
  monthState: MonthState
  dayState: DayState
  isKong: boolean
  moving: boolean
  strengthScore: number
  strengthLevel: 'weak' | 'balanced' | 'strong'
}

const CLASHES: Record<string, string> = {
  子: '午', 午: '子', 丑: '未', 未: '丑', 寅: '申', 申: '寅',
  卯: '酉', 酉: '卯', 辰: '戌', 戌: '辰', 巳: '亥', 亥: '巳'
}

const COMBINES: Record<string, string> = {
  子: '丑', 丑: '子', 寅: '亥', 亥: '寅', 卯: '戌', 戌: '卯',
  辰: '酉', 酉: '辰', 巳: '申', 申: '巳', 午: '未', 未: '午'
}

export function isClash(a: string, b: string): boolean { return CLASHES[a] === b }
export function isCombine(a: string, b: string): boolean { return COMBINES[a] === b }

export function evaluateLineStrength(
  line: LiuYaoLine,
  monthBranch: string,
  dayBranch: string,
  xunkong: string[]
): LineStrengthState {
  const el = line.branchElement
  const monthEl = BRANCH_ELEMENT[monthBranch]
  const dayEl = BRANCH_ELEMENT[dayBranch]
  const isKong = xunkong.includes(line.branch)

  let monthState: MonthState = 'neutral'
  if (monthBranch === line.branch) monthState = 'month_value'
  else if (isClash(monthBranch, line.branch)) monthState = 'month_broken'
  else if (isCombine(monthBranch, line.branch)) monthState = 'month_combined'
  else if (monthEl === el) monthState = 'month_same_element'
  else if (generates(monthEl, el)) monthState = 'month_generated'
  else if (controls(monthEl, el)) monthState = 'month_controlled'

  let dayState: DayState = 'neutral'
  if (dayBranch === line.branch) dayState = 'day_value'
  else if (isClash(dayBranch, line.branch)) dayState = 'day_clashed'
  else if (isCombine(dayBranch, line.branch)) dayState = 'day_combined'
  else if (dayEl === el) dayState = 'day_same_element'
  else if (generates(dayEl, el)) dayState = 'day_generated'
  else if (controls(dayEl, el)) dayState = 'day_controlled'

  // strengthScore: 本项目现代权重
  let score = 0
  if (monthState === 'month_value') score += 3
  if (monthState === 'month_same_element') score += 1
  if (monthState === 'month_generated') score += 2
  if (monthState === 'month_controlled') score -= 2
  if (monthState === 'month_broken') score -= 3
  if (dayState === 'day_value') score += 3
  if (dayState === 'day_same_element') score += 1
  if (dayState === 'day_generated') score += 2
  if (dayState === 'day_controlled') score -= 2
  if (dayState === 'day_clashed') score -= 1
  if (isKong) score -= 2
  if (line.moving) score += 1

  const level: 'weak' | 'balanced' | 'strong' =
    score >= 3 ? 'strong' : score <= -2 ? 'weak' : 'balanced'

  return {
    lineIndex: line.index,
    branch: line.branch,
    monthState,
    dayState,
    isKong,
    moving: line.moving,
    strengthScore: score,
    strengthLevel: level
  }
}
