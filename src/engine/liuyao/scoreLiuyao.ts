import type { Rating, ScoreEvidence, QuestionCategory } from '../../types'
import type { LiuYaoResult } from './layout'
import { buildRating } from '../scoring/rating'
import { BRANCH_ELEMENT } from '../../data/najia'
import { selectUsefulGod } from './selectUsefulGod'
import { evaluateBranchRelation, branchRelationEvidence } from './relations'
import { xunKongFromDay } from '../../data/solarTerms'

/**
 * 六爻评分（v3.1）
 * v1：以世爻为核心。
 * v3.1：按问题类别选用神，加入旬空/月破/六冲/六合基础证据。
 * 基准50：用神强弱±18 / 世用关系±10 / 动变趋势±12 / 卦象±6 / 六神神煞≤±4。
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

  // v3.1: 按类别选用神
  const ug = selectUsefulGod(category, r)
  const usefulLines = ug.matchedLines.map((i) => r.lines[i - 1]).filter(Boolean)

  // A. 用神旺衰：月日生扶
  for (const line of usefulLines.slice(0, 2)) {
    if (!line) continue
    const el = line.branchElement
    if (monthEl === el) ev.push({ id: `ly_useful_month_${line.index}`, title: `用神${line.branch}得月建`, delta: 6, reason: `用神${line.branch}（${el}）临月建${monthBranch}`, sourceRule: 'ly_strength_v2' })
    else if (generates(monthEl, el)) ev.push({ id: `ly_useful_month_sheng_${line.index}`, title: `用神得月建生`, delta: 5, reason: `月建${monthBranch}生用神${line.branch}`, sourceRule: 'ly_strength_v2' })
    else if (controls(monthEl, el)) ev.push({ id: `ly_useful_month_ctrl_${line.index}`, title: `用神受月建克`, delta: -5, reason: `月建${monthBranch}克用神${line.branch}`, sourceRule: 'ly_strength_v2' })

    if (dayEl === el) ev.push({ id: `ly_useful_day_${line.index}`, title: `用神临日辰`, delta: 5, reason: `日辰${dayBranch}与用神同五行`, sourceRule: 'ly_strength_v2' })
    else if (generates(dayEl, el)) ev.push({ id: `ly_useful_day_sheng_${line.index}`, title: `用神得日辰生`, delta: 4, reason: `日辰${dayBranch}生用神`, sourceRule: 'ly_strength_v2' })
    else if (controls(dayEl, el)) ev.push({ id: `ly_useful_day_ctrl_${line.index}`, title: `用神受日辰克`, delta: -4, reason: `日辰${dayBranch}克用神`, sourceRule: 'ly_strength_v2' })
  }

  // B. 世爻基础（仍保留）
  const shi = r.lines.find((l) => l.isShi)
  if (shi) {
    if (monthEl === shi.branchElement) ev.push({ id: 'ly_month_same', title: '世爻得月建', delta: 3, reason: `世爻${shi.branch}临月建`, sourceRule: 'ly_strength_v1' })
    else if (generates(monthEl, shi.branchElement)) ev.push({ id: 'ly_month_sheng', title: '世爻得月建生', delta: 2, reason: `月建生世爻`, sourceRule: 'ly_strength_v1' })
    else if (controls(monthEl, shi.branchElement)) ev.push({ id: 'ly_month_ctrl', title: '世爻受月建克', delta: -2, reason: `月建克世爻`, sourceRule: 'ly_strength_v1' })
  }

  // v3.1: 基础冲合空破（对用神爻）
  for (const line of usefulLines.slice(0, 2)) {
    if (!line) continue
    const rel = evaluateBranchRelation(line.branch, dayBranch, monthBranch, xunkong)
    ev.push(...branchRelationEvidence(line.index, line.branch, rel))
  }

  // C. 动变趋势
  const movingCount = r.lines.filter((l) => l.moving).length
  if (movingCount === 0) {
    ev.push({ id: 'ly_no_move', title: '六爻安静', delta: 2, reason: '无动爻，事态相对稳定', sourceRule: 'ly_move_v1' })
  } else {
    ev.push({ id: 'ly_moving', title: `有${movingCount}个动爻`, delta: movingCount > 2 ? -2 : 1, reason: movingCount > 2 ? '动爻较多，变化多端' : '有动爻，事情处于变化中', sourceRule: 'ly_move_v1' })
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
