/**
 * 大运分析（Phase 14）
 *
 * 每步大运：
 * - stemTenGod：大运天干相对日干的十神
 * - evidence：大运支与原局四支的六合/六冲
 * - reading：中性白话（focus/why/howToAct/watchOut）
 *
 * 不预测吉凶，不给概率。
 */
import type { BirthProfile, DaYunEntry } from '../types'
import type { DaYunAnalysis, FortuneStructureEvidence } from './types'
import { tenGod } from './tenGod'
import { relationsWithNatal } from './branchRelations'
import { composeReading } from './composeFortunePlainReading'
import { computeNatalFrame, splitGanZhi } from './natalFrame'

/**
 * 分析一组大运。
 */
export function analyzeDaYun(
  profile: BirthProfile,
  entries: DaYunEntry[]
): DaYunAnalysis[] {
  const frame = computeNatalFrame(profile)
  if (!frame) return []

  return entries.map((entry, entryIndex) => {
    const [gan, zhi] = splitGanZhi(entry.ganzhi)
    const ev: FortuneStructureEvidence[] = []

    // 十神 evidence
    const sg = tenGod(frame.dayGan, gan)
    if (sg) {
      ev.push({
        id: `dy-ev-${entryIndex}-0`,
        sourceLayer: 'bazi-yun',
        kind: 'ten_god',
        title: `大运天干${gan}为日主${frame.dayGan}之${sg}`,
        detail: `大运干支${entry.ganzhi}的天干${gan}，相对日主${frame.dayGan}为${sg}。`
      })
    }

    // 地支与原局关系 evidence
    if (zhi) {
      const rels = relationsWithNatal(zhi, frame.natalBranches, '大运支')
      rels.forEach((r, relIndex) => {
        ev.push({
          id: `dy-ev-${entryIndex}-${relIndex + 1}`,
          sourceLayer: 'bazi-yun',
          kind: r.kind === '六冲' ? 'branch_clash' : 'branch_combine',
          title: `大运支${r.a}与原局${r.b}${r.kind}`,
          detail: r.description
        })
      })
    }

    const reading = composeReading(sg ?? undefined, ev, `大运${entry.ganzhi}`)

    return {
      entry,
      stemTenGod: sg ?? undefined,
      evidence: ev,
      reading
    }
  })
}
