import type { Rating, ScoreEvidence } from '../../types'
import type { MeihuaResult } from '../meihua/castByTime'
import { relationOfElement, TRIGRAMS } from '../../data/trigrams'
import { BRANCH_ELEMENT } from '../../data/najia'
import { buildRating } from './rating'

/**
 * 梅花评分（资料 11.3 v1）
 * 基准 50：体用±16 / 变卦对体±12 / 互卦±6 / 本卦主题±8 / 节气±2。
 * 所有加减分都生成 evidence，可解释。
 */
export function scoreMeihua(r: MeihuaResult, monthBranch: string): Rating {
  const ev: ScoreEvidence[] = []

  // A. 体用关系 ±16
  const bodyUseMap: Record<string, { d: number; note: string }> = {
    generatesB: { d: 14, note: '用卦生体卦，外在有助力' },
    controlsA: { d: 10, note: '体卦克用卦，自身较能掌控' },
    same: { d: 8, note: '体用比和，局面协调' },
    generatesA: { d: -8, note: '体卦生用卦，自身付出泄耗' },
    controlsB: { d: -14, note: '用卦克体卦，外在压力较大' }
  }
  const bu = bodyUseMap[r.relation]
  ev.push({
    id: 'meihua_body_use',
    title: '体用五行关系',
    delta: bu.d,
    reason: bu.note,
    sourceRule: 'meihua_bodyUse_v1'
  })

  // B. 变卦对体 ±12
  const bianRel = relationOfElement(r.tiElement, r.bianYongElement)
  const bianMap: Record<string, number> = {
    generatesB: 10,
    controlsA: 7,
    same: 5,
    generatesA: -5,
    controlsB: -10
  }
  ev.push({
    id: 'meihua_bian_ti',
    title: '变卦对体卦关系',
    delta: bianMap[bianRel],
    reason: `变后用卦为${r.bianYongElement}，对体卦${r.tiElement}为${bianRelLabel(bianRel)}`,
    sourceRule: 'meihua_bianRelation_v1'
  })

  // C. 互卦过程 ±6
  const mutualUpperEl = TRIGRAMS[r.hu.upper].element
  const muRel = relationOfElement(r.tiElement, mutualUpperEl)
  const muDelta = muRel === 'generatesB' || muRel === 'same' ? 4 : muRel === 'controlsB' ? -4 : 1
  ev.push({
    id: 'meihua_mutual',
    title: '互卦（过程状态）',
    delta: muDelta,
    reason: `互卦上卦${r.hu.upper}（${mutualUpperEl}）对体卦${r.tiElement}`,
    sourceRule: 'meihua_mutual_v1'
  })

  // D. 本卦主题 ±8（按编辑关键词启发式）
  const kw = r.ben.editorialKeywords.join(',')
  let kwDelta = 0
  if (/险|阻|困|剥|否|蹇|明夷|遁|坎/.test(kw)) kwDelta = -4
  else if (/泰|晋|丰|大有|谦|既济|通|升|益/.test(kw)) kwDelta = 4
  ev.push({
    id: 'meihua_ben_theme',
    title: '本卦总体主题',
    delta: kwDelta,
    reason: `本卦「${r.ben.name}」主题：${kw}`,
    sourceRule: 'meihua_theme_v1'
  })

  // E. 节气/月令 ±2
  const monthEl = BRANCH_ELEMENT[monthBranch]
  let monthDelta = 0
  if (monthEl && monthEl === r.tiElement) monthDelta = 2
  else if (monthEl && relationOfElement(r.tiElement, monthEl) === 'controlsB') monthDelta = -1
  ev.push({
    id: 'meihua_season',
    title: '月令与体卦',
    delta: monthDelta,
    reason: `月建${monthBranch}（${monthEl}）对体卦${r.tiElement}`,
    sourceRule: 'meihua_season_v1'
  })

  return buildRating(ev)
}

function bianRelLabel(rel: string): string {
  return {
    same: '比和',
    generatesA: '体生变用',
    generatesB: '变用生体',
    controlsA: '体克变用',
    controlsB: '变用克体'
  }[rel] || rel
}
