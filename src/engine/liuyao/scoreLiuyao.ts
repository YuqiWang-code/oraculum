import type { Rating, ScoreEvidence } from '../../types'
import type { LiuYaoResult } from './layout'
import { buildRating } from '../scoring/rating'
import { BRANCH_ELEMENT } from '../../data/najia'

/**
 * 六爻评分（资料 11.2 v1）
 * 基准50：用神强弱±18 / 世用关系±10 / 动变趋势±12 / 卦象±6 / 六神神煞≤±4。
 * v1 做简化可解释版，不做复杂旺衰黑箱。
 */
export function scoreLiuyao(r: LiuYaoResult, monthBranch: string, dayBranch: string, useShensha: boolean): Rating {
  const ev: ScoreEvidence[] = []
  const monthEl = BRANCH_ELEMENT[monthBranch]
  const dayEl = BRANCH_ELEMENT[dayBranch]

  // 用神取世爻所在爻（v1 简化：以世爻为核心评分对象，实际用神在解释层说明）
  const shi = r.lines.find((l) => l.isShi)
  if (shi) {
    // A. 世爻旺衰：月日生扶
    if (monthEl === shi.branchElement) ev.push({ id: 'ly_month_same', title: '世爻得月建', delta: 6, reason: `世爻${shi.branch}（${shi.branchElement}）临月建${monthBranch}`, sourceRule: 'ly_strength_v1' })
    else if (BRANCH_ELEMENT[monthBranch] && generates(monthEl, shi.branchElement)) ev.push({ id: 'ly_month_sheng', title: '世爻得月建生', delta: 5, reason: `月建${monthBranch}生世爻`, sourceRule: 'ly_strength_v1' })
    else if (controls(monthEl, shi.branchElement)) ev.push({ id: 'ly_month_ctrl', title: '世爻受月建克', delta: -5, reason: `月建${monthBranch}克世爻`, sourceRule: 'ly_strength_v1' })

    if (dayEl === shi.branchElement) ev.push({ id: 'ly_day_same', title: '世爻临日辰', delta: 5, reason: `日辰${dayBranch}与世爻同五行`, sourceRule: 'ly_strength_v1' })
    else if (generates(dayEl, shi.branchElement)) ev.push({ id: 'ly_day_sheng', title: '世爻得日辰生', delta: 4, reason: `日辰${dayBranch}生世爻`, sourceRule: 'ly_strength_v1' })
    else if (controls(dayEl, shi.branchElement)) ev.push({ id: 'ly_day_ctrl', title: '世爻受日辰克', delta: -4, reason: `日辰${dayBranch}克世爻`, sourceRule: 'ly_strength_v1' })
  }

  // C. 动变趋势
  const movingCount = r.lines.filter((l) => l.moving).length
  if (movingCount === 0) {
    ev.push({ id: 'ly_no_move', title: '六爻安静', delta: 2, reason: '无动爻，事态相对稳定', sourceRule: 'ly_move_v1' })
  } else {
    ev.push({ id: 'ly_moving', title: `有${movingCount}个动爻`, delta: movingCount > 2 ? -2 : 1, reason: movingCount > 2 ? '动爻较多，变化多端、证据一致性较低' : '有动爻，事情处于变化中', sourceRule: 'ly_move_v1' })
  }

  // D. 卦象主题 ±6
  const kw = r.hexagram.editorialKeywords.join(',')
  let kwDelta = 0
  if (/险|阻|困|剥|否|蹇|坎|明夷/.test(kw)) kwDelta = -3
  else if (/泰|晋|丰|大有|谦|既济|通|升|益|悦/.test(kw)) kwDelta = 3
  ev.push({ id: 'ly_theme', title: '卦象总体', delta: kwDelta, reason: `「${r.hexagram.name}」：${kw}`, sourceRule: 'ly_theme_v1' })

  // E. 神煞（≤±4，可关闭）
  if (useShensha && r.shensha.length > 0) {
    const favor = r.shensha.filter((s) => s.name === '天乙贵人' || s.name === '驿马').length
    const delta = Math.min(4, favor * 2)
    ev.push({ id: 'ly_shensha', title: '神煞辅助', delta, reason: `见${r.shensha.map((s) => s.name).join('、')}（低权重象意）`, sourceRule: 'shensha_v1' })
  }

  return buildRating(ev)
}

function generates(a: string, b: string): boolean {
  const map: Record<string, string> = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' }
  return map[a] === b
}
function controls(a: string, b: string): boolean {
  const map: Record<string, string> = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' }
  return map[a] === b
}
