import type { Element, TrigramName, TriLines } from '../types'

/**
 * 八卦基础表
 * 依据：资料 2.2 节；先天数为梅花起卦常用。
 * lines 自下而上 [初,二,三]。
 */
export interface TrigramInfo {
  name: TrigramName
  /** 先天数（梅花）：1乾2兑3离4震5巽6坎7艮8坤 */
  xiantianNumber: number
  lines: TriLines
  laterDirection: string
  element: Element
  images: string[]
}

export const TRIGRAMS: Record<TrigramName, TrigramInfo> = {
  乾: { name: '乾', xiantianNumber: 1, lines: [1, 1, 1], laterDirection: '西北', element: '金', images: ['天', '健', '父', '首', '领导'] },
  兑: { name: '兑', xiantianNumber: 2, lines: [1, 1, 0], laterDirection: '西', element: '金', images: ['泽', '悦', '口', '交流'] },
  离: { name: '离', xiantianNumber: 3, lines: [1, 0, 1], laterDirection: '南', element: '火', images: ['火', '明', '目', '显现'] },
  震: { name: '震', xiantianNumber: 4, lines: [1, 0, 0], laterDirection: '东', element: '木', images: ['雷', '动', '足', '启动'] },
  巽: { name: '巽', xiantianNumber: 5, lines: [0, 1, 1], laterDirection: '东南', element: '木', images: ['风', '入', '股', '渗透'] },
  坎: { name: '坎', xiantianNumber: 6, lines: [0, 1, 0], laterDirection: '北', element: '水', images: ['水', '险', '耳', '流动'] },
  艮: { name: '艮', xiantianNumber: 7, lines: [0, 0, 1], laterDirection: '东北', element: '土', images: ['山', '止', '手', '边界'] },
  坤: { name: '坤', xiantianNumber: 8, lines: [0, 0, 0], laterDirection: '西南', element: '土', images: ['地', '顺', '腹', '承载'] }
}

/** 先天数 -> 经卦 */
export const TRIGRAM_BY_NUMBER: Record<number, TrigramName> = {
  1: '乾',
  2: '兑',
  3: '离',
  4: '震',
  5: '巽',
  6: '坎',
  7: '艮',
  8: '坤'
}

/** 三爻 -> 经卦（自下而上） */
export function trigramFromLines(lines: TriLines): TrigramName {
  const key = lines.join('')
  for (const name of Object.keys(TRIGRAMS) as TrigramName[]) {
    if (TRIGRAMS[name].lines.join('') === key) return name
  }
  throw new Error(`未知三爻编码: ${key}`)
}

/** 五行相生 */
export const GENERATES: Record<Element, Element> = {
  木: '火',
  火: '土',
  土: '金',
  金: '水',
  水: '木'
}

/** 五行相克 */
export const CONTROLS: Record<Element, Element> = {
  木: '土',
  土: '水',
  水: '火',
  火: '金',
  金: '木'
}

/** 两五行关系描述，用于体用/生克评分 */
export function relationOfElement(a: Element, b: Element): 'same' | 'generatesA' | 'generatesB' | 'controlsA' | 'controlsB' {
  if (a === b) return 'same'
  if (GENERATES[a] === b) return 'generatesA' // a 生 b
  if (GENERATES[b] === a) return 'generatesB' // b 生 a
  if (CONTROLS[a] === b) return 'controlsA' // a 克 b
  return 'controlsB' // b 克 a
}

export const TRIGRAM_SOURCES = ['资料 2.2 八卦表', '《说卦传》']
