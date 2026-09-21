/**
 * 评分证据的人话化（表达层）
 *
 * 评分引擎产出的 evidence.reason 含专业术语（如「用卦克体卦，外在压力较大」）。
 * 本模块只在「表达层」把这些证据翻译成生活说法，绝不修改评分与证据本身。
 * 纯函数、确定性、不联网、无随机。
 */
import type { ScoreEvidence } from '../../types'

interface Rule {
  /** 命中任一关键词就采用 */
  keys: string[]
  /** 人话说法（尽量短，口语化） */
  text: string
}

/** 制约类（delta < 0）按顺序匹配；统一用「名词短语」，方便套进「把……理顺」 */
const CONSTRAINT_RULES: Rule[] = [
  { keys: ['克体', '外在压力', '用克体', '压力较大'], text: '外面的阻力' },
  { keys: ['体生用', '泄耗', '付出', '消耗'], text: '要你多投入这一点' },
  { keys: ['月破'], text: '眼下不合的时机' },
  { keys: ['旬空', '空亡', '落空', '逢空'], text: '还没落实的条件' },
  { keys: ['反吟', '相冲', '冲克', '逢冲'], text: '反复和冲突' },
  { keys: ['伏吟'], text: '原地打转的状态' },
  { keys: ['墓绝', '休囚', '衰弱', '偏弱', '无力'], text: '偏弱的状态' },
  { keys: ['合绊', '牵绊', '化合'], text: '眼前的牵绊' },
  { keys: ['月建', '临月'], text: '大环境的影响' },
  { keys: ['日辰'], text: '当下环境的影响' },
  { keys: ['用神'], text: '还没看清的关键' },
  { keys: ['动爻', '动而'], text: '那个变化点' },
  { keys: ['卦辞', '经典', '基调'], text: '偏谨慎的基调' }
]

/** 有利类（delta > 0）按顺序匹配；用偏口语的短句 */
const SUPPORT_RULES: Rule[] = [
  { keys: ['用生体', '生体', '外力相助', '有人帮'], text: '外部有支持，可以借力' },
  { keys: ['比和', '平顺', '内外一致'], text: '内外比较合拍，做着顺手' },
  { keys: ['体克用', '主动把握'], text: '你自己比较能把握住局面' },
  { keys: ['六合', '相合', '得合'], text: '关系比较和顺，有照应' },
  { keys: ['月建', '临月', '旺相', '得令', '旺'], text: '状态比较足，环境也配合' },
  { keys: ['卦辞', '经典', '基调'], text: '整体基调比较稳' }
]

function matchRule(haystack: string, rules: Rule[]): string | undefined {
  for (const r of rules) {
    if (r.keys.some((k) => haystack.includes(k))) return r.text
  }
  return undefined
}

function evText(ev: ScoreEvidence): string {
  return `${ev.title} ${ev.reason} ${ev.sourceRule ?? ''}`
}

/** 把一条证据翻译成人话（未命中时按正负给通用说法） */
export function plainEvidenceNote(ev: ScoreEvidence): string {
  const text = evText(ev)
  if (ev.delta < 0) {
    return matchRule(text, CONSTRAINT_RULES) ?? '眼前最卡的地方'
  }
  if (ev.delta > 0) {
    return matchRule(text, SUPPORT_RULES) ?? '眼下有可以借力的地方'
  }
  return matchRule(text, [...CONSTRAINT_RULES, ...SUPPORT_RULES]) ?? '信号不算明显，先看看再说'
}

/** 取最主要的一条制约（人话），无则 undefined */
export function mainHumanConstraint(evidence: ScoreEvidence[]): string | undefined {
  const negatives = evidence
    .filter((e) => e.delta < 0)
    .sort((a, b) => a.delta - b.delta)
  if (negatives.length === 0) return undefined
  return plainEvidenceNote(negatives[0])
}

/** 取最主要的一条支持（人话），无则 undefined */
export function mainHumanSupport(evidence: ScoreEvidence[]): string | undefined {
  const positives = evidence
    .filter((e) => e.delta > 0)
    .sort((a, b) => b.delta - a.delta)
  if (positives.length === 0) return undefined
  return plainEvidenceNote(positives[0])
}
