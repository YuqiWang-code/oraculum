import type { LiuYaoResult } from './layout'
import type { LiuYaoLine } from '../../types'

export type LineRole = 'useful' | 'source' | 'taboo' | 'enemy' | 'shi' | 'ying' | 'neutral'

export interface LineRoleAssignment {
  lineIndex: number
  role: LineRole
  reason: string
}

const GENERATES: Record<string, string> = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' }
const CONTROLS: Record<string, string> = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' }

export function generates(a: string, b: string): boolean { return GENERATES[a] === b }
export function controls(a: string, b: string): boolean { return CONTROLS[a] === b }

/**
 * v3.4: 以用神五行为中心推导元神/忌神/仇神
 */
export function deriveLineRoles(
  r: LiuYaoResult,
  usefulLineIndexes: number[]
): LineRoleAssignment[] {
  const result: LineRoleAssignment[] = []
  const usefulEl = usefulLineIndexes.length > 0
    ? r.lines[usefulLineIndexes[0] - 1]?.branchElement
    : undefined

  for (const line of r.lines) {
    let role: LineRole = 'neutral'
    let reason = '普通爻'

    if (line.isShi) { role = 'shi'; reason = '世爻' }
    if (line.isYing) { role = 'ying'; reason = '应爻' }

    if (usefulEl) {
      const el = line.branchElement
      if (usefulLineIndexes.includes(line.index)) {
        role = 'useful'
        reason = '用神'
      } else if (generates(el, usefulEl)) {
        role = 'source'
        reason = `元神（生用神${usefulEl}）`
      } else if (controls(el, usefulEl)) {
        role = 'taboo'
        reason = `忌神（克用神${usefulEl}）`
      } else if (controls(usefulEl, el)) {
        role = 'enemy'
        reason = `仇神（克元神）`
      }
    }

    result.push({ lineIndex: line.index, role, reason })
  }

  return result
}
