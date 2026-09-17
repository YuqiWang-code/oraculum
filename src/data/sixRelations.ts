import type { Element, SixRelation } from '../types'
import { CONTROLS, GENERATES } from './trigrams'

/**
 * 六亲（资料 6.4）：以本宫五行为"我"。
 * 生我者父母，同我者兄弟，我生者子孙，我克者妻财，克我者官鬼。
 */
export function relationOf(myElement: Element, otherElement: Element): SixRelation {
  if (otherElement === myElement) return '兄弟'
  if (GENERATES[otherElement] === myElement) return '父母' // 他生我
  if (GENERATES[myElement] === otherElement) return '子孙' // 我生他
  if (CONTROLS[myElement] === otherElement) return '妻财' // 我克他
  return '官鬼' // 克我
}

/** 问题类别 -> 首要用神候选（资料 6.4 / 第9节） */
export const CATEGORY_USEFUL_GOD: Record<string, { gods: (SixRelation | '世爻')[]; reason: string }> = {
  财务收益: { gods: ['妻财'], reason: '财务收益以妻财为用神，并兼看子孙（财源）与兄弟（分耗）' },
  事业工作: { gods: ['官鬼'], reason: '职位事业以官鬼为用神，兼看父母（名分文书）与世爻（自身）' },
  考试学业: { gods: ['父母'], reason: '考试文书以父母为用神，功名兼看官鬼' },
  项目合作: { gods: ['官鬼', '世爻'], reason: '合作项目看官鬼（主事成败）与世应关系，兼看兄弟（伙伴）' },
  感情关系: { gods: ['妻财', '官鬼'], reason: '男感情看妻财，女感情看官鬼，并看世应与桃花' },
  家庭人际: { gods: ['父母', '兄弟'], reason: '长辈家庭看父母，同辈人际看兄弟，并看世应' },
  出行变动: { gods: ['世爻'], reason: '出行以世爻为自身，兼看驿马与用神动静' },
  失物寻找: { gods: ['妻财'], reason: '失物以妻财为用神，兼看父母（文书证物）与卦象方位' },
  选择比较: { gods: ['世爻'], reason: '选择以世爻为身，比较各动爻变爻指向' },
  计划成败: { gods: ['官鬼'], reason: '计划成败看官鬼（主事）与世爻旺衰及动变' },
  日常综合: { gods: ['世爻'], reason: '日常综合以世爻为主，兼顾用神与整体卦象' },
  其他: { gods: ['世爻'], reason: '未明确类别，默认以世爻为自身参考' }
}
