/**
 * 把结构证据组合成可读的中性白话（Phase 14 / Phase 20）
 *
 * 原则：
 * - 所有现实解释都可回溯到 evidence
 * - 不预测吉凶，不给概率分数
 * - 中性描述结构，把判断权交还给现实处境
 */
import type { FortuneStructureEvidence, FortuneReading } from './types'

/** 十神中性结构描述 */
const TEN_GOD_FOCUS: Record<string, string> = {
  比肩: '同辈、合作与竞争',
  劫财: '资源分配与同辈互动',
  食神: '表达、输出与放松',
  伤官: '想法、表现与变动',
  偏财: '实际事务与流动性资源',
  正财: '稳定的实际事务与日常安排',
  七杀: '压力、责任与外部约束',
  正官: '规则、责任与秩序',
  偏印: '学习、思考与间接支持',
  正印: '学习、保护与稳定支持'
}

const TEN_GOD_WHY: Record<string, string> = {
  比肩: '这一步的天干与日主同类，结构上偏向与同辈、同立场的人互动。',
  劫财: '这一步的天干与日主同类但阴阳不同，结构上偏向资源分配与意见协调。',
  食神: '这一步的天干为日主所生，结构上偏向表达、输出和把已有东西分享出去。',
  伤官: '这一步的天干为日主所生但阴阳不同，结构上偏向想法、表现和主动求变。',
  偏财: '这一步的天干为日主所克，结构上偏向处理流动的实际事务与资源。',
  正财: '这一步的天干为日主所克且阴阳不同，结构上偏向稳定的日常安排与具体事务。',
  七杀: '这一步的天干克日主且阴阳相同，结构上偏向外部压力、责任与需要应对的约束。',
  正官: '这一步的天干克日主且阴阳不同，结构上偏向规则、秩序与承担责任。',
  偏印: '这一步的天干生日主且阴阳相同，结构上偏向学习、思考和间接的支持。',
  正印: '这一步的天干生日主且阴阳不同，结构上偏向学习、保护与稳定的支持。'
}

const TEN_GOD_HOW: Record<string, string> = {
  比肩: '可以多与同辈、同事协作，同时留意分工与边界。',
  劫财: '重要资源和决定先理清归属，避免口头默认带来的分歧。',
  食神: '适合把想法整理成可分享的成果，节奏可以放松一些。',
  伤官: '有新想法时先验证再行动，注意表达方式，减少不必要的冲撞。',
  偏财: '适合推进有流动性的实际事务，留意账目和节奏。',
  正财: '把日常安排和具体事务落实清楚，稳步推进。',
  七杀: '把压力拆成可执行的小步骤，量力而行，避免硬扛。',
  正官: '按规则和流程办事，主动承担能承担的责任。',
  偏印: '适合学习、研究和向内思考，支持往往是间接到来的。',
  正印: '适合学习、休整和借助既有支持，稳步积累。'
}

const TEN_GOD_WATCH: Record<string, string> = {
  比肩: '避免把协作变成互相等待。',
  劫财: '避免在资源和利益上含糊不清。',
  食神: '避免只输出不落地。',
  伤官: '避免因表现欲而忽视规则和他人感受。',
  偏财: '避免在流动性事务上过于冒进。',
  正财: '避免因琐碎事务而忽略整体节奏。',
  七杀: '避免硬扛超出能力的压力。',
  正官: '避免把规则当成束缚或过度承担。',
  偏印: '避免想得多做得少。',
  正印: '避免过度依赖外部支持。'
}

/** 把十神 evidence 合并成 focus */
function focusFromTenGod(tenGodLabel?: string): string {
  if (tenGodLabel && TEN_GOD_FOCUS[tenGodLabel]) {
    return TEN_GOD_FOCUS[tenGodLabel]
  }
  return '传统结构参考'
}

/** 组合一条中性解读 */
export function composeReading(
  tenGodLabel: string | undefined,
  evidence: FortuneStructureEvidence[],
  scopeLabel: string
): FortuneReading {
  // focus：以十神为主，叠加明显冲合
  let focus = focusFromTenGod(tenGodLabel)
  const hasChong = evidence.some((e) => e.kind === 'branch_clash')
  const hasHe = evidence.some((e) => e.kind === 'branch_combine')
  if (hasChong) focus += '，并伴有地支冲的变动提示'
  if (hasHe) focus += '，并伴有地支合的聚合提示'

  // why：十神结构 + evidence 详情
  const whyParts: string[] = []
  if (tenGodLabel && TEN_GOD_WHY[tenGodLabel]) {
    whyParts.push(TEN_GOD_WHY[tenGodLabel])
  }
  for (const e of evidence) {
    whyParts.push(e.detail)
  }
  const why = whyParts.length > 0 ? whyParts.join(' ') : `${scopeLabel}在传统记号上属于结构参考，不代表确定命运。`

  // howToAct：十神建议 + 冲合调整
  const howParts: string[] = []
  if (tenGodLabel && TEN_GOD_HOW[tenGodLabel]) {
    howParts.push(TEN_GOD_HOW[tenGodLabel])
  }
  if (hasChong) howParts.push('遇冲的年份注意出行、作息和关系协调，提前留余地。')
  if (hasHe) howParts.push('遇合的年份适合借力协作，但要把合作条件说清楚。')
  if (howParts.length === 0) {
    howParts.push('依据当年的实际条件和自己的处境做判断。')
  }
  const howToAct = howParts.join(' ')

  // watchOut
  const watchParts: string[] = []
  if (tenGodLabel && TEN_GOD_WATCH[tenGodLabel]) {
    watchParts.push(TEN_GOD_WATCH[tenGodLabel])
  }
  if (hasChong) watchParts.push('不要把"冲"当成必然出事的预言，它只提示需要多留意。')
  if (watchParts.length === 0) {
    watchParts.push('不把传统记号当成确定命运的结论。')
  }
  const watchOut = watchParts.join(' ')

  return { focus, why, howToAct, watchOut }
}
