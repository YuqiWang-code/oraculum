/**
 * 组合白话理由（3-5 条）——确定性。
 * 优先级：reality > base > moving > rating > mutual > changed > bodyUse，最多 5 条。
 */

import type { PlainReason, PlainSemanticFrame, RealityGuardResult, RatingTendency } from './types'

const TENDENCY_DESC: Record<RatingTendency, string> = {
  positive: '整体偏顺、条件有利',
  slightly_positive: '略偏顺、小有助力',
  neutral: '整体中性、不偏不倚',
  slightly_negative: '略偏制约、需谨慎',
  negative: '整体偏不利、宜守不宜进'
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

  // 4. 评分
  reasons.push({
    id: 'rating',
    source: 'rating',
    label: '评分',
    explanation: `${frame.rating.score}·${frame.rating.label}：整体倾向${TENDENCY_DESC[frame.rating.tendency] ?? '中性'}`
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
