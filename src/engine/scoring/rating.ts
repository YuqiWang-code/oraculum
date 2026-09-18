import type { Rating, RatingBreakdown, RatingLabel, ScoreEvidence } from '../../types'
import { RULESET_VERSION } from '../../types'

export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

export function labelForScore(score: number): RatingLabel {
  if (score <= 19) return '大凶'
  if (score <= 39) return '凶'
  if (score <= 59) return '平'
  if (score <= 79) return '吉'
  return '大吉'
}

/**
 * 由证据项汇总评分。
 * score = clamp(0,100, 50 + sum(delta))
 * 证据一致性：基于正负证据权重的方向一致度（0-1）。
 * 全正或全负 = 1（方向完全一致）；正负完全平衡 ≈ 0。
 */
export function buildRating(evidence: ScoreEvidence[], breakdown?: RatingBreakdown): Rating {
  const totalDelta = evidence.reduce((s, e) => s + e.delta, 0)
  const score = clamp(50 + totalDelta, 0, 100)
  const favorable = evidence.filter((e) => e.delta > 0)
  const constraint = evidence.filter((e) => e.delta < 0)

  // v2.1.0: 基于 delta 权重的方向一致度
  const positiveWeight = evidence.reduce((s, e) => s + (e.delta > 0 ? e.delta : 0), 0)
  const negativeWeight = evidence.reduce((s, e) => s + (e.delta < 0 ? Math.abs(e.delta) : 0), 0)
  const totalWeight = positiveWeight + negativeWeight
  const consistency = totalWeight === 0 ? 0.5 : clamp(Math.abs(positiveWeight - negativeWeight) / totalWeight, 0, 1)

  return {
    score,
    label: labelForScore(score),
    consistency: Math.round(consistency * 100) / 100,
    favorableCount: favorable.length,
    constraintCount: constraint.length,
    evidence,
    breakdown,
    ruleVersion: RULESET_VERSION
  }
}
