/**
 * 体用五行关系的详细本地释义
 */

export type BodyUseRelation = 'same' | 'generatesA' | 'generatesB' | 'controlsA' | 'controlsB'

export interface BodyUseMeaning {
  relation: BodyUseRelation
  label: string
  /** Oraculum 现代释义——总体描述 */
  summary: string
  /** 有利面 */
  favorable: string
  /** 警示面 */
  caution: string
}

export const BODY_USE_MEANINGS: Record<BodyUseRelation, BodyUseMeaning> = {
  generatesB: {
    relation: 'generatesB',
    label: '用生体',
    summary: '用卦五行生体卦，外在因素对主体有助力。',
    favorable: '事情容易得到外部支持，顺势可得助。',
    caution: '助力虽在，仍需判断支持是否持久、是否有附加条件。'
  },
  controlsA: {
    relation: 'controlsA',
    label: '体克用',
    summary: '体卦五行克用卦，主体较能掌控局面。',
    favorable: '自身有主动权，事情可通过努力达成。',
    caution: '克则劳心，需主动付出，不可坐等。'
  },
  same: {
    relation: 'same',
    label: '体用比和',
    summary: '体卦与用卦五行相同，主客协调。',
    favorable: '局面平顺，内外一致，顺势而为即可。',
    caution: '过于平顺则缺乏变化，注意是否过于保守。'
  },
  generatesA: {
    relation: 'generatesA',
    label: '体生用',
    summary: '体卦五行生用卦，主体付出较多、有所泄耗。',
    favorable: '主动投入可推动事情，但需评估成本。',
    caution: '投入大、回报慢，注意不要过度消耗自身。'
  },
  controlsB: {
    relation: 'controlsB',
    label: '用克体',
    summary: '用卦五行克体卦，外在压力较大。',
    favorable: '有压力才有动力，谨慎应对可化解。',
    caution: '外部制约明显，宜稳守、延后重大决定。'
  }
}
