/**
 * 六爻本地解读组合器
 * 使用：本卦经典、全部动爻经典、变卦经典、用神、元神/忌神、旺衰、RatingBreakdown
 * Phase 2：用神/元神/忌神从 analysis.roles 读取，不再自行推导。
 * 不输出"有利信号多于制约信号"这类空洞总结，而是列出具体的 breakdown 分类。
 */

import type { LiuYaoResult } from '../liuyao/layout'
import type { QuestionCategory, Rating, RatingBreakdown } from '../../types'
import type { LocalDetailedInterpretation, LocalInterpretationSection } from './types'
import { interpretBaseHexagram } from './interpretBaseHexagram'
import { interpretMovingLine } from './interpretMovingLines'
import { interpretChangedHexagram } from './interpretChangedHexagram'
import { selectHexagramKnowledge } from './selectKnowledge'
import { CATEGORY_USEFUL_GOD } from '../../data/sixRelations'
import { PALACE_POSITION_NAMES } from '../../data/palaces'
import { CATEGORY_HINTS } from '../../local-data/interpretation/categoryHints'
import { analyzeLiuyao, type LiuYaoAnalysis } from '../liuyao/analyze'

/** RatingBreakdown 分类中文名 */
const BREAKDOWN_LABELS: Record<keyof RatingBreakdown, string> = {
  usefulGod: '用神旺衰',
  sourceTaboo: '元神忌神',
  shiYing: '世应关系',
  monthDay: '月建日辰',
  movement: '动爻变化',
  conflictHarmony: '冲合关系',
  classicTheme: '卦象主题',
  auxiliary: '辅助神煞'
}

/**
 * 从评分 breakdown 提取分类明细文字
 */
function summarizeBreakdown(breakdown?: RatingBreakdown): string[] {
  if (!breakdown) return []
  const parts: string[] = []
  const entries = Object.entries(breakdown) as [keyof RatingBreakdown, number][]
  for (const [key, value] of entries) {
    if (value === 0) continue
    const label = BREAKDOWN_LABELS[key]
    const sign = value > 0 ? '+' : ''
    parts.push(`${label}：${sign}${value}`)
  }
  return parts
}

/**
 * 从 analysis.roles 提取用神/元神/忌神描述
 */
function analyzeUsefulGodFromRoles(
  r: LiuYaoResult,
  category: QuestionCategory,
  analysis: LiuYaoAnalysis
): {
  usefulGodReason: string
  usefulGodLines: string[]
  yuanShenLines: string[]
  jiShenLines: string[]
} {
  const ugConfig = CATEGORY_USEFUL_GOD[category] || { gods: ['世爻' as const], reason: '未明确类别，默认以世爻为自身参考' }
  const usefulGodReason = `类别「${category}」：${ugConfig.reason}`

  const usefulGodLines: string[] = []
  const yuanShenLines: string[] = []
  const jiShenLines: string[] = []

  for (const ra of analysis.roles) {
    const line = r.lines.find((l) => l.index === ra.lineIndex)
    if (!line) continue
    if (ra.role === 'useful') {
      usefulGodLines.push(
        `用神为第${line.index}爻（${line.sixSpirit}坐${line.branch}，${line.sixRelation}）`
      )
    } else if (ra.role === 'source') {
      yuanShenLines.push(`元神为第${line.index}爻（${line.branchElement}，${line.sixRelation}）`)
    } else if (ra.role === 'taboo') {
      jiShenLines.push(`忌神为第${line.index}爻（${line.branchElement}，${line.sixRelation}）`)
    }
  }

  // 如果没有找到用神爻（例如用神不上卦），用世爻兜底
  if (usefulGodLines.length === 0) {
    const shi = r.lines.find((l) => l.isShi)
    if (shi) {
      usefulGodLines.push(`以世爻为参考：第${shi.index}爻（${shi.sixSpirit}坐${shi.branch}，${shi.sixRelation}）`)
    }
  }

  return { usefulGodReason, usefulGodLines, yuanShenLines, jiShenLines }
}

/**
 * 组合六爻完整本地解读
 */
export function composeLiuyaoInterpretation(
  r: LiuYaoResult,
  rating: Rating,
  category: QuestionCategory,
  monthBranch?: string,
  dayGanzhi?: string
): LocalDetailedInterpretation {
  // 本卦
  const base = interpretBaseHexagram(r.hexagram)

  // 全部动爻
  const movingLines: LocalInterpretationSection[] = []
  for (const line of r.lines) {
    if (line.moving) {
      movingLines.push(interpretMovingLine(r.hexagram, line.index))
    }
  }

  // 变卦
  let changed: LocalInterpretationSection | undefined
  if (r.changedHexagram) {
    changed = interpretChangedHexagram(r.changedHexagram)
  }

  // 用神分析：从单一事实源读取
  // 若提供了月建/日辰，则完整分析；否则仅用 roles 部分
  const analysis = monthBranch && dayGanzhi
    ? analyzeLiuyao(r, monthBranch, dayGanzhi, category)
    : analyzeLiuyao(r, '', '甲子', category) // fallback: 空月日仅取 roles

  const { usefulGodReason, usefulGodLines, yuanShenLines, jiShenLines } =
    analyzeUsefulGodFromRoles(r, category, analysis)

  // 概览
  const overview =
    `本卦「${r.hexagram.name}」，属${r.palace}宫（${r.palaceElement}），` +
    `世在第${r.shiLine}爻、应在第${r.yingLine}爻。` +
    (movingLines.length > 0 ? `动爻${movingLines.length}个。` : '')

  // 有利信号 & 制约
  const favorable: string[] = []
  const constraints: string[] = []

  // 从评分证据
  for (const ev of rating.evidence) {
    if (ev.delta > 0) {
      favorable.push(`${ev.title}：${ev.reason}`)
    } else if (ev.delta < 0) {
      constraints.push(`${ev.title}：${ev.reason}`)
    }
  }

  // 用神状态
  for (const ug of usefulGodLines) {
    favorable.push(ug)
  }
  for (const yuan of yuanShenLines) {
    favorable.push(yuan)
  }
  for (const ji of jiShenLines) {
    constraints.push(ji)
  }

  // 神煞
  if (r.shensha.length > 0) {
    favorable.push(`神煞：${r.shensha.map((s) => `${s.name}${s.branch}`).join('、')}（低权重象意，不单独定吉凶）。`)
  }

  // 综合段落
  const synthesisParts: string[] = []

  const baseKnowledge = selectHexagramKnowledge(r.hexagram.kingWen)
  if (baseKnowledge) {
    synthesisParts.push(
      `本卦「${r.hexagram.name}」：${baseKnowledge.localMeaning.asBaseHexagram}`
    )
  } else {
    synthesisParts.push(
      `本卦「${r.hexagram.name}」，属${r.palace}宫，八宫位置为${PALACE_POSITION_NAMES[r.hexagram.palacePosition]}。`
    )
  }

  synthesisParts.push(`用神分析：${usefulGodReason}。`)
  if (usefulGodLines.length > 0) {
    synthesisParts.push(usefulGodLines.join('；') + '。')
  }
  if (yuanShenLines.length > 0) {
    synthesisParts.push(yuanShenLines.join('；') + '。')
  }
  if (jiShenLines.length > 0) {
    synthesisParts.push(jiShenLines.join('；') + '。')
  }

  // 世应
  const shiLine = r.lines.find((l) => l.isShi)
  const yingLine = r.lines.find((l) => l.isYing)
  if (shiLine && yingLine) {
    synthesisParts.push(
      `世爻为第${shiLine.index}爻（${shiLine.sixRelation}），应爻为第${yingLine.index}爻（${yingLine.sixRelation}）。`
    )
  }

  // 动爻
  if (movingLines.length > 0) {
    synthesisParts.push(`本次有${movingLines.length}个动爻，为关键变化点。`)
  }

  // 变卦
  if (changed && r.changedHexagram) {
    const changedKnowledge = selectHexagramKnowledge(r.changedHexagram.kingWen)
    if (changedKnowledge) {
      synthesisParts.push(
        `变卦「${r.changedHexagram.name}」说明后段趋向：${changedKnowledge.localMeaning.asChangedHexagram}`
      )
    } else {
      synthesisParts.push(`变卦「${r.changedHexagram.name}」代表后续发展方向。`)
    }
  }

  // RatingBreakdown 明细（不空洞总结）
  const breakdownParts = summarizeBreakdown(rating.breakdown)
  if (breakdownParts.length > 0) {
    synthesisParts.push(`评分分类明细：${breakdownParts.join('；')}。`)
  }

  const synthesis = synthesisParts.join('')

  // 行动提示
  const hint = CATEGORY_HINTS[category]
  const actionTips: string[] = []
  if (hint) actionTips.push(hint.hint)
  actionTips.push('请结合客观事实与专业意见做现实决定。')
  if (rating.score < 40) {
    actionTips.push('当前偏弱，宜守不宜急。')
  } else if (rating.score > 60) {
    actionTips.push('当前偏顺，可稳步推进。')
  } else {
    actionTips.push('信号中性，按部就班。')
  }

  return {
    overview,
    base,
    movingLines,
    changed,
    synthesis,
    favorable,
    constraints,
    actionTips,
    usefulGodReason
  }
}
