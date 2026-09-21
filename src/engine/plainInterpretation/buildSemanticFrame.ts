/**
 * 构建白话语义帧（PlainSemanticFrame）——只读已有结果，不重新算卦。
 * 梅花：从本地知识取本卦/动爻/互卦/变卦/体用。
 * 六爻：只读 analyzeLiuyao() 的事实输出，不重新算用神/旺衰。
 */

import type { QuestionCategory, Rating } from '../../types'
import type { MeihuaResult } from '../meihua/castByTime'
import type { LiuYaoResult } from '../liuyao/layout'
import { selectHexagramKnowledge, selectLineKnowledge } from '../localInterpretation/selectKnowledge'
import {
  getPlainHexagram,
  getBodyUsePlain,
  plainEvidenceNote,
  mainHumanConstraint,
  mainHumanSupport
} from '../../local-data/plainInterpretation'
import type { PlainSemanticFrame, RatingTendency } from './types'

/** 由分数推导整体倾向（与五档标签对齐，但独立成档供白话使用） */
export function tendencyForScore(score: number): RatingTendency {
  if (score >= 80) return 'positive'
  if (score >= 60) return 'slightly_positive'
  if (score >= 40) return 'neutral'
  if (score >= 20) return 'slightly_negative'
  return 'negative'
}

function basePlain(kingWen: number, fallbackName: string): { theme: string; plainMeaning: string } {
  // 表达层优先用「普通用户解释」的生活化白话；专业 coreMeaning 留给研究模式。
  const plain = getPlainHexagram(kingWen)
  const k = selectHexagramKnowledge(kingWen)
  if (plain) {
    return {
      theme: k?.localMeaning.keyThemes[0] ?? plain.name,
      plainMeaning: plain.simple
    }
  }
  if (k) {
    return {
      theme: k.localMeaning.keyThemes[0] ?? k.name,
      plainMeaning: k.localMeaning.coreMeaning || `${fallbackName}卦，现代释义尚在整理中。`
    }
  }
  return { theme: fallbackName, plainMeaning: `${fallbackName}卦，现代释义尚在整理中。` }
}

/** 本卦作为过程（互卦）的白话 */
function mutualPlain(kingWen: number, fallbackName: string): { theme: string; plainMeaning: string } {
  const k = selectHexagramKnowledge(kingWen)
  if (k) {
    return {
      theme: k.localMeaning.keyThemes[0] ?? k.name,
      plainMeaning: k.localMeaning.asMutualHexagram || k.localMeaning.coreMeaning
    }
  }
  return { theme: fallbackName, plainMeaning: `互卦「${fallbackName}」表示事情的中间过程。` }
}

/** 本卦作为后续趋向（变卦）的白话 */
function changedPlain(kingWen: number, fallbackName: string): { theme: string; plainMeaning: string } {
  const k = selectHexagramKnowledge(kingWen)
  if (k) {
    return {
      theme: k.localMeaning.keyThemes[0] ?? k.name,
      plainMeaning: k.localMeaning.asChangedHexagram || k.localMeaning.coreMeaning
    }
  }
  return { theme: fallbackName, plainMeaning: `变卦「${fallbackName}」表示事情的后续趋向。` }
}

function linePlain(kingWen: number, lineIndex: 1 | 2 | 3 | 4 | 5 | 6): { theme: string; plainMeaning: string } {
  const l = selectLineKnowledge(kingWen, lineIndex)
  if (l) {
    return { theme: l.themeKeyword, plainMeaning: l.coreMeaning || l.plainText }
  }
  return { theme: `第${lineIndex}爻`, plainMeaning: `第${lineIndex}爻为本次变化点，具体释义尚在整理中。` }
}

/**
 * 从 rating.evidence 提取「人话」说法（最多 n 条），并检测是否有强制约（delta <= -5）。
 * 注意：这是表达层，证据原文里的术语在此统一翻译成生活说法，不改评分本身。
 */
function collectEvidence(rating: Rating, max = 5): { reasons: string[]; hasStrongCaution: boolean } {
  const reasons: string[] = []
  let hasStrongCaution = false
  const seen = new Set<string>()
  for (const ev of rating.evidence) {
    if (ev.delta <= -5) hasStrongCaution = true
    const note = plainEvidenceNote(ev)
    if (reasons.length < max && ev.reason && !seen.has(note)) {
      seen.add(note)
      reasons.push(note)
    }
  }
  return { reasons, hasStrongCaution }
}

/**
 * 梅花白话帧
 */
export function buildMeihuaFrame(
  question: string,
  category: QuestionCategory,
  meihua: MeihuaResult,
  rating: Rating
): PlainSemanticFrame {
  const base = basePlain(meihua.ben.kingWen, meihua.ben.name)
  const movingLine = meihua.movingLine
  const moving = [linePlain(meihua.ben.kingWen, movingLine)]
  const mutual = mutualPlain(meihua.hu.kingWen, meihua.hu.name)
  const changed = changedPlain(meihua.bian.kingWen, meihua.bian.name)

  const favorable =
    meihua.relation === 'generatesB' ||
    meihua.relation === 'same' ||
    meihua.relation === 'controlsA'
  const buPlain = getBodyUsePlain(meihua.relation)

  const { reasons, hasStrongCaution } = collectEvidence(rating)

  return {
    question,
    category,
    intent: 'generic', // 由外层 classify 覆盖
    rating: { score: rating.score, label: rating.label, tendency: tendencyForScore(rating.score) },
    base: { name: meihua.ben.name, theme: base.theme, plainMeaning: base.plainMeaning },
    moving: moving.map((m) => ({ lineIndex: movingLine, theme: m.theme, plainMeaning: m.plainMeaning })),
    mutual: { name: meihua.hu.name, theme: mutual.theme, plainMeaning: mutual.plainMeaning },
    changed: { name: meihua.bian.name, theme: changed.theme, plainMeaning: changed.plainMeaning },
    bodyUse: { favorable, plainMeaning: buPlain.simple },
    evidence: reasons,
    hasStrongCaution,
    constraintPlain: mainHumanConstraint(rating.evidence),
    supportPlain: mainHumanSupport(rating.evidence)
  }
}

/**
 * 六爻白话帧（只读 analyzeLiuyao() 事实输出，不重新算）
 */
export function buildLiuyaoFrame(
  question: string,
  category: QuestionCategory,
  liuyao: LiuYaoResult,
  rating: Rating,
  _monthBranch: string,
  _dayGanzhi: string
): PlainSemanticFrame {
  const base = basePlain(liuyao.hexagram.kingWen, liuyao.hexagram.name)

  const moving: PlainSemanticFrame['moving'] = liuyao.lines
    .filter((l) => l.moving)
    .map((l) => {
      const m = linePlain(liuyao.hexagram.kingWen, l.index)
      return { lineIndex: l.index, theme: m.theme, plainMeaning: m.plainMeaning }
    })
  // 六爻若无动爻，给一个占位动爻说明
  if (moving.length === 0) {
    moving.push({ lineIndex: 0, theme: '静卦', plainMeaning: '本卦安静，没有动爻变化，看当前整体格局即可。' })
  }

  const changed = liuyao.changedHexagram
    ? changedPlain(liuyao.changedHexagram.kingWen, liuyao.changedHexagram.name)
    : undefined

  const { reasons, hasStrongCaution } = collectEvidence(rating)

  // 六爻用神理由含专业术语，仅在「研究模式」的专业解读里展示；
  // 普通用户解释层不放原始术语，避免老人看到「用神临月建」这类话术。

  return {
    question,
    category,
    intent: 'generic',
    rating: { score: rating.score, label: rating.label, tendency: tendencyForScore(rating.score) },
    base: { name: liuyao.hexagram.name, theme: base.theme, plainMeaning: base.plainMeaning },
    moving,
    changed: changed
      ? {
          name: liuyao.changedHexagram!.name,
          theme: changed.theme,
          plainMeaning: changed.plainMeaning
        }
      : undefined,
    evidence: reasons,
    hasStrongCaution,
    constraintPlain: mainHumanConstraint(rating.evidence),
    supportPlain: mainHumanSupport(rating.evidence)
  }
}
