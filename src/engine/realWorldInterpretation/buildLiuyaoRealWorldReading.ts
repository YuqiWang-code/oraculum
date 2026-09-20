/**
 * 六爻现实白话解读构建器
 * 只读已有结果（本卦/全部动爻/变卦/LiuYaoAnalysis/Rating），
 * 不重新起卦、不重新算用神/旺衰。
 *
 * 数据流：
 *   本卦 → 当前状态 / why.base
 *   全部动爻 → why.moving（多条）
 *   变卦 → why.changed
 *   LiuYaoAnalysis 最强有利 evidence → 有利参考
 *   最强制约 evidence → watchOutFor
 *   Rating → why.rating
 */
import type { QuestionCategory, Rating } from '../../types'
import type { LiuYaoResult } from '../liuyao/layout'
import { analyzeLiuyao } from '../liuyao/analyze'
import { getHexagramKnowledge } from '../../local-data'
import { getCategoryAdapter } from './categoryAdapters'
import { checkRealityGuard } from '../plainInterpretation/realityGuard'
import { classifyQuestionIntent } from '../plainInterpretation/classifyQuestionIntent'
import type { RealWorldPlainReading } from './types'

const REAL_WORLD_DISCLAIMER =
  '传统文化研究与参考；重要现实决定请依据事实和专业意见。所有解读均来自本地经典数据与确定性规则引擎，不调用大模型。'

/** 评分的现实白话解释（与梅花版共用逻辑） */
function ratingPlain(rating: Rating): string {
  const score = rating.score
  const label = rating.label
  if (score >= 80) {
    return `评分 ${score} 分（${label}），整体条件比较有利，但仍需踏实推进，不能掉以轻心。`
  }
  if (score >= 60) {
    return `评分 ${score} 分（${label}），有有利条件，也有需要注意的地方，稳步推进比较合适。`
  }
  if (score >= 40) {
    return `评分 ${score} 分（${label}），不是明显的好或坏，更像信息还不够完整或条件参半，先核实清楚再决定。`
  }
  if (score >= 20) {
    return `评分 ${score} 分（${label}），制约因素较多，宜谨慎、稳守，不宜仓促做重大决定。`
  }
  return `评分 ${score} 分（${label}），当前困难较大，宜暂缓、多准备，等条件改善再行动。`
}

/**
 * 构建六爻现实白话解读
 */
export function buildLiuyaoRealWorldReading(
  question: string,
  category: QuestionCategory,
  liuyao: LiuYaoResult,
  rating: Rating,
  monthBranch: string,
  dayGanzhi: string
): RealWorldPlainReading {
  const baseKnowledge = getHexagramKnowledge(liuyao.hexagram.kingWen)
  const changedKnowledge = liuyao.changedHexagram
    ? getHexagramKnowledge(liuyao.changedHexagram.kingWen)
    : undefined

  const baseElder = baseKnowledge?.elderFriendly
  const changedElder = changedKnowledge?.elderFriendly

  const adapter = getCategoryAdapter(category)

  // RealityGuard
  const intent = classifyQuestionIntent(question)
  const guard = checkRealityGuard(question, category, intent)

  // 只读 analyzeLiuyao 事实输出
  const analysis = analyzeLiuyao(liuyao, monthBranch, dayGanzhi, category)

  // headline
  const baseName = liuyao.hexagram.name
  const headline = composeHeadline(baseName, rating)

  // currentSituation
  const currentSituation =
    baseElder?.realLifeNow ||
    baseKnowledge?.localMeaning.coreMeaning ||
    `当前是「${baseName}」的局面，需要结合具体情况判断。`

  // why.base
  const whyBase =
    baseElder?.elderFriendlySummary ||
    baseKnowledge?.localMeaning.coreMeaning ||
    `本卦「${baseName}」代表当前的基本格局。`

  // why.moving：全部动爻
  const whyMoving: string[] = []
  const movingLines = liuyao.lines.filter((l) => l.moving)
  if (movingLines.length === 0) {
    whyMoving.push('本卦安静，没有动爻变化，看当前整体格局即可。')
  } else {
    for (const ml of movingLines) {
      const lineKnowledge = baseKnowledge?.lines[ml.index - 1]
      const lineElder = lineKnowledge?.elderFriendly
      if (lineElder) {
        whyMoving.push(
          `第${ml.index}爻（${lineKnowledge?.themeKeyword || '动爻'}）：${lineElder.elderFriendlyMeaning}`
        )
      } else if (lineKnowledge) {
        whyMoving.push(`第${ml.index}爻：${lineKnowledge.coreMeaning || lineKnowledge.plainText}`)
      } else {
        whyMoving.push(`第${ml.index}爻动，代表变化点。`)
      }
    }
  }

  // why.changed
  let whyChanged: string | undefined
  if (changedKnowledge) {
    whyChanged =
      changedElder?.realLifeLater ||
      changedKnowledge.localMeaning.asChangedHexagram ||
      `变卦「${liuyao.changedHexagram!.name}」表示事情的后续趋向。`
  }

  // why.rating
  const whyRating = ratingPlain(rating)

  // howToAct
  const howToAct = selectActions(adapter.actionTemplates, rating, 5)

  // watchOutFor：类别注意 + 最强制约证据 + 卦级注意 + realityGuard
  const watchOutFor: string[] = []
  watchOutFor.push(...adapter.watchOutTemplates.slice(0, 2))

  // 从评分证据中取最强制约（delta <= -3）
  const strongConstraints = rating.evidence
    .filter((e) => e.delta <= -3)
    .sort((a, b) => a.delta - b.delta)
    .slice(0, 2)
  for (const sc of strongConstraints) {
    watchOutFor.push(`需要注意：${sc.reason}`)
  }

  // 用神选择理由（只读 analyzeLiuyao 事实输出，不重新计算）
  if (analysis.usefulGod.reason) {
    watchOutFor.push(`六爻用神：${analysis.usefulGod.reason}`)
  }

  if (baseKnowledge?.localMeaning.cautions?.length) {
    watchOutFor.push(baseKnowledge.localMeaning.cautions[0])
  }
  if (guard.active && guard.message) {
    watchOutFor.push(guard.message)
  }

  // timeline
  const timeline = {
    now: baseElder?.realLifeNow || currentSituation,
    later: changedElder?.realLifeLater
  }

  return {
    headline,
    currentSituation,
    why: {
      base: whyBase,
      moving: whyMoving,
      changed: whyChanged,
      rating: whyRating
    },
    howToAct,
    watchOutFor,
    timeline,
    realityGuard: guard.active ? guard.message : undefined,
    disclaimer: REAL_WORLD_DISCLAIMER
  }
}

/** 组合 headline */
function composeHeadline(baseName: string, rating: Rating): string {
  const score = rating.score
  let tendency: string
  if (score >= 80) tendency = '整体有利，可以积极推进'
  else if (score >= 60) tendency = '有有利条件，稳步推进'
  else if (score >= 40) tendency = '条件参半，先核实再决定'
  else if (score >= 20) tendency = '制约较多，宜谨慎稳守'
  else tendency = '困难较大，宜暂缓多准备'

  return `「${baseName}」· ${tendency}`
}

/** 根据评分倾向选择行动建议 */
function selectActions(templates: string[], rating: Rating, maxCount: number): string[] {
  const score = rating.score
  const result: string[] = []

  for (const t of templates) {
    if (result.length >= maxCount) break
    result.push(t)
  }

  if (score < 40 && result.length < maxCount) {
    result.push('当前条件不够成熟，不要因为着急而勉强行动。')
  }

  return result
}
