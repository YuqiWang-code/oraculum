import type { Element, PalaceName } from '../types'

/**
 * 八宫五行（资料 6.1 表头）。
 */
export const PALACE_ELEMENT: Record<PalaceName, Element> = {
  乾: '金',
  兑: '金',
  离: '火',
  震: '木',
  巽: '木',
  坎: '水',
  艮: '土',
  坤: '土'
}

/** 八宫位置名称（资料 6.1） */
export const PALACE_POSITION_NAMES = ['本宫', '一世', '二世', '三世', '四世', '五世', '游魂', '归魂'] as const
