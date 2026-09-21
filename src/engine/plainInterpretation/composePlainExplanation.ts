/**
 * 组合白话理由（3-5 条）——确定性。
 * 优先级：reality > base > moving > rating > mutual > changed > bodyUse，最多 5 条。
 */

import type { PlainReason, PlainSemanticFrame, RealityGuardResult, RatingTendency } from './types'

const TENDENCY_DESC: Record<RatingTendency, string> = {
  positive: '整体比较顺，有利条件多一些',
  slightly_positive: '稍微偏顺，有一点助力',
  neutral: '好坏不明显，关键看你接下来怎么处理',
  slightly_negative: '稍微有点吃力，要多留心',
  negative: '眼下阻力偏多，适合先稳住、慢慢来'
}

function lineLabel(lineIndex: number): string {
  return lineIndex > 0 ? `第${lineIndex}爻` : '静卦'
}

export function composePlainExplanation(
  frame: PlainSemanticFrame,
  guard: RealityGuardResult
): { reasons: PlainReason[]; realityGuard?: string } {
  const reasons: PlainReason[] = []

  // 1. 现实护栏（优先级最高）
  if (guard.active && guard.message) {
    reasons.push({
      id: 'reality',
      source: 'reality',
      label: '现实提醒',
      explanation: guard.message
    })
  }

  // 2. 本卦
  reasons.push({
    id: 'base',
    source: 'base_hexagram',
    label: frame.base.name,
    explanation: frame.base.plainMeaning
  })

  // 3. 动爻
  for (const m of frame.moving) {
    reasons.push({
      id: 'moving',
      source: 'moving_line',
      label: lineLabel(m.lineIndex),
      explanation: m.plainMeaning
    })
  }

  // 4. 评分（分数放括号里做参考，开头先说人话）
  reasons.push({
    id: 'rating',
    source: 'rating',
    label: '综合看',
    explanation: `${TENDENCY_DESC[frame.rating.tendency] ?? '好坏不明显，先看看再说'}（参考评分 ${frame.rating.score} 分）`
  })

  // 5. 互卦
  if (frame.mutual) {
    reasons.push({
      id: 'mutual',
      source: 'mutual_hexagram',
      label: frame.mutual.name,
      explanation: frame.mutual.plainMeaning
    })
  }

  // 6. 变卦
  if (frame.changed) {
    reasons.push({
      id: 'changed',
      source: 'changed_hexagram',
      label: frame.changed.name,
      explanation: frame.changed.plainMeaning
    })
  }

  // 7. 体用
  if (frame.bodyUse) {
    reasons.push({
      id: 'bodyUse',
      source: 'body_use',
      label: '体用',
      explanation: frame.bodyUse.plainMeaning
    })
  }

  // 最多 5 条：保留优先级最高的前 5 条
  const trimmed = reasons.slice(0, 5)

  return {
    reasons: trimmed,
    realityGuard: guard.active ? guard.message : undefined
  }
}
