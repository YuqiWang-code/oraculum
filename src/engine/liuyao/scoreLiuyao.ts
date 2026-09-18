import type { Rating, ScoreEvidence, QuestionCategory } from '../../types'
import type { LiuYaoResult } from './layout'
import { buildRating } from '../scoring/rating'
import { aggregateRatingBreakdown } from '../scoring/breakdown'
import { BRANCH_ELEMENT } from '../../data/najia'
import { selectUsefulGod } from './selectUsefulGod'
import { deriveLineRoles } from './roles'
import { evaluateLineStrength } from './strength'
import { evaluateDayClash, dayClashEvidence } from './dayRelations'
import { evaluateCombine, combineEvidence } from './combine'
import { evaluateTransforms, transformEvidence } from './transforms'
import { evaluateSanHe } from './sanhe'
import { evaluateKong, kongEvidence } from './kongState'
import { evaluateAdvanceRetreat, advanceRetreatEvidence } from './advanceRetreat'
import { evaluateHiddenSpirit, hiddenEvidence } from './hiddenSpiritStrength'
import { xunKongFromDay } from '../../data/solarTerms'

/**
 * 六爻评分 v3.4：编排式
 * 不再在 scoreLiuyao 中硬算所有关系，而是调用独立纯函数模块。
 */
export function scoreLiuyao(
  r: LiuYaoResult,
  monthBranch: string,
  dayGanzhi: string,
  useShensha: boolean,
  category: QuestionCategory
): Rating {
  const ev: ScoreEvidence[] = []
  const monthEl = BRANCH_ELEMENT[monthBranch]
  const dayBranch = dayGanzhi[1]
  const dayEl = BRANCH_ELEMENT[dayBranch]
  const xunkong = xunKongFromDay(dayGanzhi)

  // 1. 用神选择
  const ug = selectUsefulGod(category, r)
  const usefulLines = ug.matchedLines.map((i) => r.lines[i - 1]).filter(Boolean)

  // 2. 角色推导
  const roles = deriveLineRoles(r, ug.matchedLines)
  const roleOf = (idx: number) => roles.find((x) => x.lineIndex === idx)?.role

  // 3. 旺衰评估
  const strengths = r.lines.map((l) => evaluateLineStrength(l, monthBranch, dayBranch, xunkong))
  const strengthOf = (idx: number) => strengths.find((s) => s.lineIndex === idx)!

  // 4. 对用神爻生成证据
  for (const line of usefulLines.slice(0, 2)) {
    if (!line) continue
    const s = strengthOf(line.index)

    // 用神月日旺衰
    if (s.monthState === 'month_value') ev.push({ id: `ly_useful_month_${line.index}`, title: `用神${line.branch}临月建`, delta: 6, reason: `用神${line.branch}临月建`, sourceRule: 'ly_strength_v3', bucket: 'usefulGod' })
    if (s.monthState === 'month_generated') ev.push({ id: `ly_useful_month_sheng_${line.index}`, title: `用神得月建生`, delta: 5, reason: `月建生用神${line.branch}`, sourceRule: 'ly_strength_v3', bucket: 'usefulGod' })
    if (s.monthState === 'month_controlled') ev.push({ id: `ly_useful_month_ctrl_${line.index}`, title: `用神受月建克`, delta: -5, reason: `月建克用神${line.branch}`, sourceRule: 'ly_strength_v3', bucket: 'usefulGod' })
    if (s.dayState === 'day_value') ev.push({ id: `ly_useful_day_${line.index}`, title: `用神临日辰`, delta: 5, reason: `日辰与用神同五行`, sourceRule: 'ly_strength_v3', bucket: 'usefulGod' })
    if (s.dayState === 'day_generated') ev.push({ id: `ly_useful_day_sheng_${line.index}`, title: `用神得日辰生`, delta: 4, reason: `日辰生用神`, sourceRule: 'ly_strength_v3', bucket: 'usefulGod' })
    if (s.dayState === 'day_controlled') ev.push({ id: `ly_useful_day_ctrl_${line.index}`, title: `用神受日辰克`, delta: -4, reason: `日辰克用神`, sourceRule: 'ly_strength_v3', bucket: 'usefulGod' })

    // 日冲状态
    const dc = evaluateDayClash(s, dayBranch, false)
    const dcEv = dayClashEvidence(dc, line.index, line.branch)
    if (dcEv) ev.push({ ...dcEv, bucket: 'conflictHarmony' })

    // 合状态
    const cState = evaluateCombine(line, dayBranch, monthBranch)
    const cEv = combineEvidence(cState, line.index, line.branch)
    if (cEv) ev.push({ ...cEv, bucket: 'conflictHarmony' })

    // 旬空状态
    const kState = evaluateKong(line, s, xunkong, dayBranch, monthBranch)
    const kEv = kongEvidence(kState, line.index, line.branch)
    if (kEv) ev.push({ ...kEv, bucket: 'conflictHarmony' })
  }

  // 5. 世爻基础
  const shi = r.lines.find((l) => l.isShi)
  if (shi) {
    if (monthEl === shi.branchElement) ev.push({ id: 'ly_month_same', title: '世爻得月建', delta: 3, reason: `世爻${shi.branch}临月建`, sourceRule: 'ly_strength_v1', bucket: 'shiYing' })
    else if (BRANCH_ELEMENT[monthBranch] === shi.branchElement) ev.push({ id: 'ly_month_same2', title: '世爻得月建', delta: 3, reason: `世爻${shi.branch}临月建`, sourceRule: 'ly_strength_v1', bucket: 'shiYing' })
  }

  // 6. 回头生克冲合
  const transforms = evaluateTransforms(r.lines)
  for (const t of transforms) {
    const ev_item = transformEvidence(t, roleOf(t.lineIndex))
    if (ev_item) ev.push({ ...ev_item, bucket: 'movement' })
  }

  // 7. 进神退神
  const ar = evaluateAdvanceRetreat(r.lines)
  for (const a of ar) {
    const ev_item = advanceRetreatEvidence(a, roleOf(a.lineIndex))
    if (ev_item) ev.push({ ...ev_item, bucket: 'movement' })
  }

  // 8. 三合
  const sanhe = evaluateSanHe(r.lines, dayBranch, monthBranch, ug.matchedLines)
  for (const sg of sanhe) {
    if (sg.experimental) continue // 半合不正式加分
    if (sg.containsUseful) {
      ev.push({ id: `ly_sanhe_${sg.branches.join('')}`, title: `三合局（${sg.branches.join('')}${sg.element}）`, delta: 3, reason: `用神参与${sg.element}局`, sourceRule: 'ly_sanhe_v2', bucket: 'conflictHarmony' })
    }
  }

  // 9. 飞伏
  for (const line of r.lines) {
    const h = evaluateHiddenSpirit(line, monthBranch, dayBranch, xunkong)
    if (h) {
      for (const e of hiddenEvidence(h)) {
        ev.push({ ...e, bucket: 'conflictHarmony' })
      }
    }
  }

  // 10. 动变趋势
  const movingCount = r.lines.filter((l) => l.moving).length
  if (movingCount === 0) {
    ev.push({ id: 'ly_no_move', title: '六爻安静', delta: 2, reason: '无动爻，事态相对稳定', sourceRule: 'ly_move_v1', bucket: 'movement' })
  } else {
    ev.push({ id: 'ly_moving', title: `有${movingCount}个动爻`, delta: movingCount > 2 ? -2 : 1, reason: movingCount > 2 ? '动爻较多，变化多端' : '有动爻，事情处于变化中', sourceRule: 'ly_move_v1', bucket: 'movement' })
  }

  // 11. 卦象主题
  const kw = r.hexagram.editorialKeywords.join(',')
  let kwDelta = 0
  if (/险|阻|困|剥|否|蹇|坎|明夷/.test(kw)) kwDelta = -3
  else if (/泰|晋|丰|大有|谦|既济|通|升|益|悦/.test(kw)) kwDelta = 3
  ev.push({ id: 'ly_theme', title: '卦象总体', delta: kwDelta, reason: `「${r.hexagram.name}」：${kw}`, sourceRule: 'ly_theme_v1', bucket: 'classicTheme' })

  // 12. 神煞
  if (useShensha && r.shensha.length > 0) {
    const favor = r.shensha.filter((s) => s.name === '天乙贵人' || s.name === '驿马').length
    const delta = Math.min(4, favor * 2)
    ev.push({ id: 'ly_shensha', title: '神煞辅助', delta, reason: `见${r.shensha.map((s) => s.name).join('、')}（低权重象意）`, sourceRule: 'shensha_v1', bucket: 'auxiliary' })
  }

  const breakdown = aggregateRatingBreakdown(ev)
  return buildRating(ev, breakdown)
}
