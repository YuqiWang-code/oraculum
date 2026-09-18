import type { LiuYaoLine } from '../../types'
import type { Element } from '../../types'

const SANHE_GROUPS: Record<string, { branches: string[]; element: Element }> = {
  water: { branches: ['申', '子', '辰'], element: '水' },
  metal: { branches: ['巳', '酉', '丑'], element: '金' },
  fire: { branches: ['寅', '午', '戌'], element: '火' },
  wood: { branches: ['亥', '卯', '未'], element: '木' }
}

export interface SanHeGroup {
  branches: [string, string, string]
  element: Element
  participantLineIndexes: number[]
  includesDay: boolean
  includesMonth: boolean
  containsUseful: boolean
  containsSource: boolean
  containsTaboo: boolean
  experimental: boolean
}

export function evaluateSanHe(
  lines: LiuYaoLine[],
  dayBranch: string,
  monthBranch: string,
  usefulIndexes: number[]
): SanHeGroup[] {
  const result: SanHeGroup[] = []
  const allBranches = new Set(lines.map((l) => l.branch))
  allBranches.add(dayBranch)
  allBranches.add(monthBranch)

  for (const [, group] of Object.entries(SANHE_GROUPS)) {
    const [b1, b2, b3] = group.branches
    if (!allBranches.has(b1) || !allBranches.has(b2) || !allBranches.has(b3)) continue
    const participantLineIndexes = lines.filter((l) => group.branches.includes(l.branch)).map((l) => l.index)
    const complete = group.branches.every((b) => lines.some((l) => l.branch === b) || b === dayBranch || b === monthBranch)
    result.push({
      branches: group.branches as [string, string, string],
      element: group.element,
      participantLineIndexes,
      includesDay: group.branches.includes(dayBranch),
      includesMonth: group.branches.includes(monthBranch),
      containsUseful: participantLineIndexes.some((i) => usefulIndexes.includes(i)),
      containsSource: false,
      containsTaboo: false,
      experimental: !complete
    })
  }
  return result
}
