/**
 * 六爻单一事实源分析器
 * Phase 2：集中所有关系推导，供 scorer 和 interpretation 共用。
 */

import type { LiuYaoResult } from './layout'
import type { QuestionCategory } from '../../types'
import { selectUsefulGod } from './selectUsefulGod'
import { deriveLineRoles, type LineRoleAssignment } from './roles'
import { evaluateLineStrength, type LineStrengthState } from './strength'
import { evaluateCombine, type CombineState } from './combine'
import { evaluateDayClash, type DayClashState } from './dayRelations'
import { evaluateTransforms, type TransformResult as TransformAssessment } from './transforms'
import { evaluateSanHe, type SanHeGroup } from './sanhe'
import { evaluateKong, type KongState } from './kongState'
import { evaluateAdvanceRetreat, type AdvanceRetreatResult as AdvanceRetreatAssessment } from './advanceRetreat'
import { evaluateHiddenSpirit, type HiddenSpiritAssessment } from './hiddenSpiritStrength'
import { xunKongFromDay } from '../../data/solarTerms'

export type KongStateAssessment = { lineIndex: number; state: KongState }

export interface LiuYaoAnalysis {
  usefulGod: { matchedLines: number[]; reason: string }
  roles: LineRoleAssignment[]
  strengths: LineStrengthState[]
  dayRelations: { lineIndex: number; state: DayClashState }[]
  combines: { lineIndex: number; state: CombineState }[]
  transforms: TransformAssessment[]
  sanhe: SanHeGroup[]
  kongStates: KongStateAssessment[]
  advanceRetreat: AdvanceRetreatAssessment[]
  hiddenAssessments: HiddenSpiritAssessment[]
}

export function analyzeLiuyao(
  r: LiuYaoResult,
  monthBranch: string,
  dayGanzhi: string,
  category: QuestionCategory
): LiuYaoAnalysis {
  const dayBranch = dayGanzhi[1]
  const xunkong = xunKongFromDay(dayGanzhi)

  // 1. 用神选择
  const ug = selectUsefulGod(category, r)

  // 2. 角色推导
  const roles = deriveLineRoles(r, ug.matchedLines)

  // 3. 旺衰评估
  const strengths = r.lines.map((l) => evaluateLineStrength(l, monthBranch, dayBranch, xunkong))

  // 4. 合状态（先于日冲计算，供 break_combine 判断）
  const combines = r.lines.map((l) => ({
    lineIndex: l.index,
    state: evaluateCombine(l, dayBranch, monthBranch)
  }))

  // 5. 日冲状态（依赖 combine 结果）
  const dayRelations = strengths.map((s) => {
    const hasCombine = (combines.find((c) => c.lineIndex === s.lineIndex)?.state ?? 'none') !== 'none'
    return {
      lineIndex: s.lineIndex,
      state: evaluateDayClash(s, dayBranch, hasCombine)
    }
  })

  // 6. 变爻关系
  const transforms = evaluateTransforms(r.lines)

  // 7. 三合
  const sanhe = evaluateSanHe(r.lines, dayBranch, monthBranch, ug.matchedLines)

  // 8. 旬空状态
  const kongStates: KongStateAssessment[] = r.lines.map((l) => {
    const s = strengths.find((x) => x.lineIndex === l.index)!
    return {
      lineIndex: l.index,
      state: evaluateKong(l, s, xunkong, dayBranch, monthBranch)
    }
  })

  // 9. 进神退神
  const advanceRetreat = evaluateAdvanceRetreat(r.lines)

  // 10. 飞伏
  const hiddenAssessments = r.lines
    .map((l) => evaluateHiddenSpirit(l, monthBranch, dayBranch, xunkong))
    .filter((h): h is HiddenSpiritAssessment => h !== null)

  return {
    usefulGod: { matchedLines: ug.matchedLines, reason: ug.reason },
    roles,
    strengths,
    dayRelations,
    combines,
    transforms,
    sanhe,
    kongStates,
    advanceRetreat,
    hiddenAssessments
  }
}
