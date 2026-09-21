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
import { getPlainHexagram, mainHumanConstraint } from '../../local-data/plainInterpretation'
import { getCategoryAdapter } from './categoryAdapters'
import { checkRealityGuard } from '../plainInterpretation/realityGuard'
import { classifyQuestionIntent } from '../plainInterpretation/classifyQuestionIntent'
import type { RealWorldPlainReading } from './types'

const REAL_WORLD_DISCLAIMER =
  '传统文化研究与参考；重要现实决定请依据事实和专业意见。所有解读均来自本地经典数据与确定性规则引擎，不调用大模型。'

/** 评分的现实白话解释（说人话，少用宜/忌/凶/吉与四字句） */
function ratingPlain(rating: Rating): string {
  const score = rating.score
  if (score >= 80) {
    return `参考评分 ${score} 分，眼下条件比较齐、势头也不错，可以积极去做，但还是要踏实。`
  }
  if (score >= 60) {
    return `参考评分 ${score} 分，有顺手的地方，也有要留心的地方，一步步推进比较稳。`
  }
  if (score >= 40) {
    return `参考评分 ${score} 分，好坏都不突出，更像条件还没凑齐，先弄清楚再决定。`
  }
  if (score >= 20) {
    return `参考评分 ${score} 分，眼下阻力偏多，更适合先稳住、把基础理顺，不急着做重大决定。`
  }
  return `参考评分 ${score} 分，眼下困难比较明显，先放慢、多做准备，等条件好转再行动。`
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

  const plainBase = getPlainHexagram(liuyao.hexagram.kingWen)

  // headline
  const baseName = liuyao.hexagram.name
  const headline = composeHeadline(baseName, rating)

  // currentSituation：长辈友好 → 普通用户白话 → 专业释义
  const currentSituation =
    baseElder?.realLifeNow ||
    plainBase?.simple ||
    baseKnowledge?.localMeaning.coreMeaning ||
    `当前是「${baseName}」的局面，需要结合具体情况判断。`

  // why.base
  const whyBase =
    baseElder?.elderFriendlySummary ||
    plainBase?.simple ||
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

  // watchOutFor：简单模式只放普通人看得懂的提醒
  const watchOutFor: string[] = []
  watchOutFor.push(...adapter.watchOutTemplates.slice(0, 2))
  const humanConstraint = mainHumanConstraint(rating.evidence)
  if (humanConstraint) {
    watchOutFor.push(`需要留心：${humanConstraint}。`)
  }
  if (guard.active && guard.message) {
    watchOutFor.push(guard.message)
  }

  // professionalNotes：含术语的原始证据/用神/卦级注意，仅研究模式折叠展示
  const professionalNotes: string[] = []
  const strongConstraints = rating.evidence
    .filter((e) => e.delta <= -3)
    .sort((a, b) => a.delta - b.delta)
    .slice(0, 2)
  for (const sc of strongConstraints) {
    professionalNotes.push(`${sc.title}：${sc.reason}`)
  }
  // 用神选择理由（只读 analyzeLiuyao 事实输出，不重新计算）
  if (analysis.usefulGod.reason) {
    professionalNotes.push(`六爻用神：${analysis.usefulGod.reason}`)
  }
  if (baseKnowledge?.localMeaning.cautions?.length) {
    professionalNotes.push(...baseKnowledge.localMeaning.cautions.slice(0, 2))
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
    professionalNotes,
    timeline,
    realityGuard: guard.active ? guard.message : undefined,
    disclaimer: REAL_WORLD_DISCLAIMER
  }
}

/** 组合 headline（说人话，不堆四字句） */
function composeHeadline(baseName: string, rating: Rating): string {
  const score = rating.score
  let tendency: string
  if (score >= 80) tendency = '眼下势头不错，可以积极去做'
  else if (score >= 60) tendency = '条件还算顺手，稳步推进'
  else if (score >= 40) tendency = '好坏参半，先弄清楚再决定'
  else if (score >= 20) tendency = '眼下阻力偏多，先稳住慢慢来'
  else tendency = '眼下困难较明显，先放慢多准备'

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
