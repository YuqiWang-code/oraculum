import type { Element } from '../../types'

/**
 * 体用关系文字（资料 5.3）
 * a=体，b=用。
 */
export function bodyUseText(relation: 'same' | 'generatesA' | 'generatesB' | 'controlsA' | 'controlsB'): string {
  switch (relation) {
    case 'generatesB':
      return '用生体：外在有助力，事情易得到支持'
    case 'controlsA':
      return '体克用：自身较能掌控，需主动付出'
    case 'same':
      return '体用比和：局面协调，顺势而为'
    case 'generatesA':
      return '体生用：自身付出、泄耗较多，需评估投入'
    case 'controlsB':
      return '用克体：外在压力较大，宜谨慎稳妥'
  }
}

export function elementRelation(a: Element, b: Element): string {
  if (a === b) return `${a}比和`
  return `${a}与${b}`
}
