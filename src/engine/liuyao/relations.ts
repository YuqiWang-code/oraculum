import type { ScoreEvidence } from '../../types'
import { BRANCH_ELEMENT } from '../../data/najia'

/**
 * 六爻基础关系规则（v3.1 P1）
 * 实现：旬空、六冲、六合、月破。
 * 每条规则独立纯函数，输出 ScoreEvidence。
 */

/** 六冲地支对 */
const CHONG_PAIRS: Record<string, string> = {
  子: '午', 丑: '未', 寅: '申', 卯: '酉', 辰: '戌', 巳: '亥',
  午: '子', 未: '丑', 申: '寅', 酉: '卯', 戌: '辰', 亥: '巳'
}

/** 六合地支对 */
const HE_PAIRS: Record<string, string> = {
  子: '丑', 寅: '亥', 卯: '戌', 辰: '酉', 巳: '申', 午: '未',
  未: '午', 申: '巳', 酉: '辰', 戌: '卯', 亥: '寅', 丑: '子'
}

export interface BranchRelation {
  chongWith: string | null
  heWith: string | null
  isKong: boolean
  isYuePo: boolean
}

/** 计算某爻地支与日支、月建的关系 */
export function evaluateBranchRelation(
  branch: string,
  dayBranch: string,
  monthBranch: string,
  xunKong: string[]
): BranchRelation {
  const chongWith = CHONG_PAIRS[branch] === dayBranch ? dayBranch : null
  const heWith = HE_PAIRS[branch] === dayBranch ? dayBranch : null
  const isKong = xunKong.includes(branch)
  const isYuePo = CHONG_PAIRS[branch] === monthBranch
  return { chongWith, heWith, isKong, isYuePo }
}

/** 为单爻生成基础关系证据 */
export function branchRelationEvidence(
  lineIndex: number,
  branch: string,
  rel: BranchRelation
): ScoreEvidence[] {
  const out: ScoreEvidence[] = []
  if (rel.isKong) {
    out.push({
      id: `kong_${lineIndex}`,
      title: `第${lineIndex}爻旬空`,
      delta: -4,
      reason: `${branch}落入旬空，力量暂虚，待填实/冲空时方应`,
      sourceRule: 'liuyao_xunkong_v1'
    })
  }
  if (rel.isYuePo) {
    out.push({
      id: `yuepo_${lineIndex}`,
      title: `第${lineIndex}爻月破`,
      delta: -6,
      reason: `${branch}被月建冲破，此爻当月无力`,
      sourceRule: 'liuyao_yuepo_v1'
    })
  }
  if (rel.chongWith) {
    out.push({
      id: `chong_${lineIndex}`,
      title: `第${lineIndex}爻逢日冲`,
      delta: -3,
      reason: `${branch}与日支${rel.chongWith}相冲，主事有动、不稳`,
      sourceRule: 'liuyao_liuChong_v1'
    })
  }
  if (rel.heWith) {
    out.push({
      id: `he_${lineIndex}`,
      title: `第${lineIndex}爻逢日合`,
      delta: 3,
      reason: `${branch}与日支${rel.heWith}相合，主有助、牵绊`,
      sourceRule: 'liuyao_liuHe_v1'
    })
  }
  return out
}
