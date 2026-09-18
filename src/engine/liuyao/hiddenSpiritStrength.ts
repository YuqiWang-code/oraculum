import type { LiuYaoLine } from '../../types'
import { BRANCH_ELEMENT } from '../../data/najia'
import { generates, controls } from './roles'
import { isClash } from './strength'

export interface HiddenSpiritAssessment {
  lineIndex: number
  hiddenBranch: string
  flyingBranch: string
  flyingGeneratesHidden: boolean
  flyingControlsHidden: boolean
  hiddenGeneratedByMonth: boolean
  hiddenGeneratedByDay: boolean
  flyingIsKong: boolean
  flyingIsYuepo: boolean
}

export function evaluateHiddenSpirit(
  line: LiuYaoLine,
  monthBranch: string,
  dayBranch: string,
  xunkong: string[]
): HiddenSpiritAssessment | null {
  if (!line.hidden || !line.hidden.branch) return null
  const hiddenEl = BRANCH_ELEMENT[line.hidden.branch]
  const flyingEl = line.branchElement
  const monthEl = BRANCH_ELEMENT[monthBranch]
  const dayEl = BRANCH_ELEMENT[dayBranch]

  return {
    lineIndex: line.index,
    hiddenBranch: line.hidden.branch,
    flyingBranch: line.branch,
    flyingGeneratesHidden: generates(flyingEl, hiddenEl),
    flyingControlsHidden: controls(flyingEl, hiddenEl),
    hiddenGeneratedByMonth: generates(monthEl, hiddenEl),
    hiddenGeneratedByDay: generates(dayEl, hiddenEl),
    flyingIsKong: xunkong.includes(line.branch),
    flyingIsYuepo: isClash(monthBranch, line.branch)
  }
}

export function hiddenEvidence(a: HiddenSpiritAssessment) {
  const ev = []
  if (a.flyingGeneratesHidden) {
    ev.push({ id: `ly_flying_gen_hidden_${a.lineIndex}`, title: `飞生伏（${a.flyingBranch}生${a.hiddenBranch}）`, delta: 2, reason: `飞神${a.flyingBranch}生伏神${a.hiddenBranch}`, sourceRule: 'ly_hidden_v2' })
  }
  if (a.flyingControlsHidden) {
    ev.push({ id: `ly_flying_ctrl_hidden_${a.lineIndex}`, title: `飞克伏（${a.flyingBranch}克${a.hiddenBranch}）`, delta: -2, reason: `飞神${a.flyingBranch}克伏神${a.hiddenBranch}`, sourceRule: 'ly_hidden_v2' })
  }
  if (a.hiddenGeneratedByMonth) {
    ev.push({ id: `ly_hidden_month_gen_${a.lineIndex}`, title: `伏神得月生`, delta: 1, reason: `伏神${a.hiddenBranch}得月建生`, sourceRule: 'ly_hidden_v2' })
  }
  if (a.flyingIsKong) {
    ev.push({ id: `ly_flying_kong_${a.lineIndex}`, title: `飞神空`, delta: 1, reason: `飞神${a.flyingBranch}逢空，伏神易出`, sourceRule: 'ly_hidden_v2' })
  }
  if (a.flyingIsYuepo) {
    ev.push({ id: `ly_flying_yuepo_${a.lineIndex}`, title: `飞神月破`, delta: -1, reason: `飞神${a.flyingBranch}月破，伏神难出`, sourceRule: 'ly_hidden_v2' })
  }
  return ev
}
