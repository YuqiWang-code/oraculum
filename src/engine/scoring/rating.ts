import type { Rating, RatingLabel, ScoreEvidence } from '../../types'
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
 * 证据一致性：正、负证据数量平衡度（0-1）。
 */
export function buildRating(evidence: ScoreEvidence[]): Rating {
  const totalDelta = evidence.reduce((s, e) => s + e.delta, 0)
  const score = clamp(50 + totalDelta, 0, 100)
  const favorable = evidence.filter((e) => e.delta > 0)
  const constraint = evidence.filter((e) => e.delta < 0)
  // 一致性：两方数量越接近且总权重越集中越高；简单用 1 - |正-负|/(总数)
  const total = favorable.length + constraint.length
  const consistency = total === 0 ? 0.5 : clamp(1 - Math.abs(favorable.length - constraint.length) / total, 0.2, 1)
  return {
    score,
    label: labelForScore(score),
    consistency: Math.round(consistency * 100) / 100,
    favorableCount: favorable.length,
    constraintCount: constraint.length,
    evidence,
    ruleVersion: RULESET_VERSION
  }
}
