/**
 * 体用关系的人话解释（表达层，只读计算结果）
 * key 与梅花 BodyUseRelation 对齐；不改变任何体用计算。
 */
import type { PlainBodyUse } from './types'

export const BODY_USE_PLAIN: Record<PlainBodyUse['relation'], PlainBodyUse> = {
  same: {
    relation: 'same',
    classic: '体用比和',
    simple: '你和这件事的节奏比较合，内外一致，顺着做就比较顺手。',
    elder: '就像人和事情对得上路子，做起来不别扭，比较省心。',
    action: '顺着现在的节奏往前推。'
  },
  generatesB: {
    relation: 'generatesB',
    classic: '用生体',
    simple: '外面的条件在帮你，容易得到支持，但也要看看这帮助能不能长久。',
    elder: '眼下有人帮、有外力托着，您比较省力。',
    action: '接住外部的帮助，顺势推进。'
  },
  controlsA: {
    relation: 'controlsA',
    classic: '体克用',
    simple: '你比较能把握住局面，但主要靠自己主动出力，不能干等着。',
    elder: '这件事主要靠您自己拿主意、下力气，等是等不来的。',
    action: '主动去做，别坐等。'
  },
  generatesA: {
    relation: 'generatesA',
    classic: '体生用',
    simple: '你得先投入、先付出，短期比较费心费神，要留意成本和精力。',
    elder: '这会儿是您在往外掏力气，容易累，得悠着点。',
    action: '算好投入，别过度消耗。'
  },
  controlsB: {
    relation: 'controlsB',
    classic: '用克体',
    simple: '眼下外部阻力比较明显，使不上劲，先换个方法、别硬冲。',
    elder: '外头的压力偏大，一个人硬顶会很累，先缓一缓。',
    action: '先放慢，调整方法和帮手。'
  }
}

export function getBodyUsePlain(relation: PlainBodyUse['relation']): PlainBodyUse {
  return BODY_USE_PLAIN[relation]
}
