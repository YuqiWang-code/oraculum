import type { ShenshaHit } from '../types'

/**
 * 神煞（资料 8）：仅 v1 四种，低权重辅助。
 * 三合局分组：申子辰、寅午戌、巳酉丑、亥卯未。
 */
const SANHE_GROUP: Record<string, string> = {}
for (const s of ['申', '子', '辰']) SANHE_GROUP[s] = '申子辰'
for (const s of ['寅', '午', '戌']) SANHE_GROUP[s] = '寅午戌'
for (const s of ['巳', '酉', '丑']) SANHE_GROUP[s] = '巳酉丑'
for (const s of ['亥', '卯', '未']) SANHE_GROUP[s] = '亥卯未'

/** 驿马（资料 8.1） */
const YIMA: Record<string, string> = {
  申子辰: '寅',
  寅午戌: '申',
  巳酉丑: '亥',
  亥卯未: '巳'
}

/** 桃花/咸池（资料 8.2） */
const TAOHUA: Record<string, string> = {
  申子辰: '酉',
  寅午戌: '卯',
  巳酉丑: '午',
  亥卯未: '子'
}

/** 华盖（资料 8.3） */
const HUAGAI: Record<string, string> = {
  申子辰: '辰',
  寅午戌: '戌',
  巳酉丑: '丑',
  亥卯未: '未'
}

/** 天乙贵人（资料 8.4，按日干） */
const TIANYI: Record<string, string[]> = {
  甲: ['丑', '未'], 戊: ['丑', '未'], 庚: ['丑', '未'],
  乙: ['子', '申'], 己: ['子', '申'],
  丙: ['亥', '酉'], 丁: ['亥', '酉'],
  壬: ['巳', '卯'], 癸: ['巳', '卯'],
  辛: ['寅', '午']
}

/**
 * 计算神煞命中。
 * @param dayBranch 日支
 * @param dayStem 日干
 * @param lineBranches 六爻地支（初→上）
 */
export function computeShensha(dayBranch: string, dayStem: string, lineBranches: string[]): ShenshaHit[] {
  const hits: ShenshaHit[] = []
  const group = SANHE_GROUP[dayBranch]
  const rule = 'shensha_v1'
  const src = '资料第8节'

  if (group) {
    const yima = YIMA[group]
    if (lineBranches.includes(yima)) {
      hits.push({ name: '驿马', basis: '日支三合局', branch: yima, meaning: '移动、变化、出行、转换', ruleVersion: rule, source: src })
    }
    const tao = TAOHUA[group]
    if (lineBranches.includes(tao)) {
      hits.push({ name: '桃花', basis: '日支三合局', branch: tao, meaning: '人际吸引、社交、情感议题', ruleVersion: rule, source: src })
    }
    const hua = HUAGAI[group]
    if (lineBranches.includes(hua)) {
      hits.push({ name: '华盖', basis: '日支三合局', branch: hua, meaning: '孤高、艺文、宗教哲学倾向', ruleVersion: rule, source: src })
    }
  }

  const ty = TIANYI[dayStem]
  if (ty) {
    for (const b of ty) {
      if (lineBranches.includes(b)) {
        hits.push({ name: '天乙贵人', basis: '日干', branch: b, meaning: '贵人相助、转机、助力', ruleVersion: rule, source: src })
      }
    }
  }
  return hits
}
