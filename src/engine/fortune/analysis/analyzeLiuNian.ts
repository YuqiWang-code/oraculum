/**
 * 流年分析（Phase 14 / Phase 20）
 *
 * 每年流年：
 * - stemTenGod：流年天干相对日干的十神
 * - evidence：流年支与原局四支、流年支与大运支的六合/六冲
 * - reading：中性白话
 *
 * 同时把 structureHint / clashHarmonyHint / plainReading 回填到 LiuNianEntry。
 * 不预测吉凶，不给概率。
 */
import type { BirthProfile, LiuNianEntry } from '../types'
import type { LiuNianAnalysis, FortuneStructureEvidence } from './types'
import { tenGod } from './tenGod'
import { relationsWithNatal, relationBetween } from './branchRelations'
import { composeReading } from './composeFortunePlainReading'
import { computeNatalFrame, splitGanZhi } from './natalFrame'

/**
 * 分析一组流年，并回填 entry 的 structureHint/clashHarmonyHint/plainReading。
 */
export function analyzeLiuNian(
  profile: BirthProfile,
  entries: LiuNianEntry[]
): LiuNianAnalysis[] {
  const frame = computeNatalFrame(profile)
  if (!frame) return []

  return entries.map((entry, entryIndex) => {
    const [gan, zhi] = splitGanZhi(entry.liuNianGanzhi)
    const ev: FortuneStructureEvidence[] = []
    let evCounter = 0
    const nextId = () => `ln-ev-${entryIndex}-${evCounter++}`

    // 十神
    const sg = tenGod(frame.dayGan, gan)
    if (sg) {
      ev.push({
        id: nextId(),
        sourceLayer: 'bazi-yun',
        kind: 'ten_god',
        title: `流年天干${gan}为日主${frame.dayGan}之${sg}`,
        detail: `流年${entry.liuNianGanzhi}的天干${gan}，相对日主${frame.dayGan}为${sg}。`
      })
    }

    const clashDescs: string[] = []
    const combineDescs: string[] = []

    // 流年支 vs 原局
    if (zhi) {
      const rels = relationsWithNatal(zhi, frame.natalBranches, '流年支')
      for (const r of rels) {
        ev.push({
          id: nextId(),
          sourceLayer: 'bazi-yun',
          kind: r.kind === '六冲' ? 'branch_clash' : 'branch_combine',
          title: `流年支${r.a}与原局${r.b}${r.kind}`,
          detail: r.description
        })
        if (r.kind === '六冲') clashDescs.push(r.description)
        else combineDescs.push(r.description)
      }
    }

    // 流年支 vs 大运支
    if (zhi && entry.daYunGanzhi) {
      const [, dyZhi] = splitGanZhi(entry.daYunGanzhi)
      const between = relationBetween(zhi, dyZhi)
      if (between) {
        ev.push({
          id: nextId(),
          sourceLayer: 'bazi-yun',
          kind: between.kind === '六冲' ? 'branch_clash' : 'branch_combine',
          title: `流年支${between.a}与大运支${between.b}${between.kind}`,
          detail: between.description
        })
        if (between.kind === '六冲') clashDescs.push(between.description)
        else combineDescs.push(between.description)
      }
    }

    const reading = composeReading(sg ?? undefined, ev, `流年${entry.liuNianGanzhi}`)

    // 回填 LiuNianEntry 字段
    if (sg) entry.structureHint = `${sg}主事（流年天干${gan}相对日主${frame.dayGan}）`
    const hints: string[] = []
    if (clashDescs.length) hints.push(clashDescs.join('；'))
    if (combineDescs.length) hints.push(combineDescs.join('；'))
    if (hints.length) entry.clashHarmonyHint = hints.join('；')
    entry.plainReading = `${reading.focus}。${reading.why}${reading.howToAct}${reading.watchOut}`

    return {
      entry,
      stemTenGod: sg ?? undefined,
      evidence: ev,
      reading
    }
  })
}
