/**
 * 梅花现实白话解读构建器
 * 只读已有结果（本卦/动爻/互卦/变卦/体用/Rating/QuestionCategory），
 * 不重新起卦、不改评分。
 *
 * 数据流：
 *   本卦 → 当前状态 / why.base
 *   动爻 → 转折 / why.moving
 *   互卦 → 中间过程 / why.mutual
 *   变卦 → 后续 / why.changed
 *   体用 → why.bodyUse
 *   Rating → why.rating
 *   QuestionCategory → howToAct
 *   RealityGuard → 现实提醒
 */
import type { QuestionCategory, Rating } from '../../types'
import type { MeihuaResult } from '../meihua/castByTime'
import { getHexagramKnowledge } from '../../local-data'
import { BODY_USE_MEANINGS } from '../../local-data/meihua/bodyUseMeanings'
import { getCategoryAdapter } from './categoryAdapters'
import { checkRealityGuard } from '../plainInterpretation/realityGuard'
import { classifyQuestionIntent } from '../plainInterpretation/classifyQuestionIntent'
import type { RealWorldPlainReading } from './types'

const REAL_WORLD_DISCLAIMER =
  '传统文化研究与参考；重要现实决定请依据事实和专业意见。所有解读均来自本地经典数据与确定性规则引擎，不调用大模型。'

/** 评分的现实白话解释 */
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
 * 构建梅花现实白话解读
 */
export function buildMeihuaRealWorldReading(
  question: string,
  category: QuestionCategory,
  meihua: MeihuaResult,
  rating: Rating
): RealWorldPlainReading {
  const baseKnowledge = getHexagramKnowledge(meihua.ben.kingWen)
  const mutualKnowledge = getHexagramKnowledge(meihua.hu.kingWen)
  const changedKnowledge = getHexagramKnowledge(meihua.bian.kingWen)

  const baseElder = baseKnowledge?.elderFriendly
  const mutualElder = mutualKnowledge?.elderFriendly
  const changedElder = changedKnowledge?.elderFriendly

  const movingLineIndex = meihua.movingLine
  const movingLineKnowledge = baseKnowledge?.lines[movingLineIndex - 1]
  const movingLineElder = movingLineKnowledge?.elderFriendly

  const adapter = getCategoryAdapter(category)
  const buMeaning = BODY_USE_MEANINGS[meihua.relation]

  // RealityGuard
  const intent = classifyQuestionIntent(question)
  const guard = checkRealityGuard(question, category, intent)

  // headline：结合卦名和评分倾向
  const baseName = meihua.ben.name
  const headline = composeHeadline(baseName, rating)

  // currentSituation：优先用长辈友好 realLifeNow，降级用 coreMeaning
  const currentSituation =
    baseElder?.realLifeNow ||
    baseKnowledge?.localMeaning.coreMeaning ||
    `当前是「${baseName}」的局面，需要结合具体情况判断。`

  // why.base
  const whyBase =
    baseElder?.elderFriendlySummary ||
    baseKnowledge?.localMeaning.coreMeaning ||
    `本卦「${baseName}」代表当前的基本格局。`

  // why.moving
  const whyMoving: string[] = []
  if (movingLineElder) {
    whyMoving.push(
      `第${movingLineIndex}爻（${movingLineKnowledge?.themeKeyword || '动爻'}）：${movingLineElder.elderFriendlyMeaning}`
    )
  } else if (movingLineKnowledge) {
    whyMoving.push(`第${movingLineIndex}爻：${movingLineKnowledge.coreMeaning || movingLineKnowledge.plainText}`)
  }

  // why.mutual
  const whyMutual = mutualElder?.realLifeProcess ||
    mutualKnowledge?.localMeaning.asMutualHexagram ||
    `互卦「${meihua.hu.name}」表示事情的中间过程。`

  // why.changed
  const whyChanged = changedElder?.realLifeLater ||
    changedKnowledge?.localMeaning.asChangedHexagram ||
    `变卦「${meihua.bian.name}」表示事情的后续趋向。`

  // why.bodyUse
  const whyBodyUse = buMeaning.summary

  // why.rating
  const whyRating = ratingPlain(rating)

  // howToAct：从类别模板中选 3-5 条，结合评分倾向调整
  const howToAct = selectActions(adapter.actionTemplates, rating, 5)

  // watchOutFor：类别注意 + 卦级注意 + realityGuard
  const watchOutFor: string[] = []
  watchOutFor.push(...adapter.watchOutTemplates.slice(0, 2))
  if (baseKnowledge?.localMeaning.cautions?.length) {
    watchOutFor.push(baseKnowledge.localMeaning.cautions[0])
  }
  if (guard.active && guard.message) {
    watchOutFor.push(guard.message)
  }

  // timeline
  const timeline = {
    now: baseElder?.realLifeNow || currentSituation,
    middle: mutualElder?.realLifeProcess,
    later: changedElder?.realLifeLater
  }

  return {
    headline,
    currentSituation,
    why: {
      base: whyBase,
      moving: whyMoving,
      mutual: whyMutual,
      changed: whyChanged,
      bodyUse: whyBodyUse,
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

  // 评分低时优先选谨慎类的建议，评分高时优先选推进类的建议
  // 这里简单按顺序选取，前几条通常是最通用的
  for (const t of templates) {
    if (result.length >= maxCount) break
    result.push(t)
  }

  // 如果评分偏低，追加一条谨慎提醒
  if (score < 40 && result.length < maxCount) {
    result.push('当前条件不够成熟，不要因为着急而勉强行动。')
  }

  return result
}
