import type { ScoreEvidence, RatingBreakdown, RatingBucket } from '../../types'

export function aggregateRatingBreakdown(evidence: ScoreEvidence[]): RatingBreakdown {
  const buckets: Record<RatingBucket, number> = {
    usefulGod: 0,
    sourceTaboo: 0,
    shiYing: 0,
    monthDay: 0,
    movement: 0,
    conflictHarmony: 0,
    classicTheme: 0,
    auxiliary: 0
  }
  for (const e of evidence) {
    const b = e.bucket || 'auxiliary'
    buckets[b] += e.delta
  }
  return buckets
}
