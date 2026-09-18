/**
 * 本地确定性解读引擎——输出类型
 * 所有解读均来自本地数据 + 确定性模板，不调用任何大模型。
 */

/** 解读区角色 */
export type InterpretationRole = 'base' | 'moving_line' | 'mutual' | 'changed' | 'body_use'

/** 单条经典文本引用 */
export interface ClassicTextRef {
  /** 标签，如「卦辞」「彖曰」「象曰」「爻辞」 */
  label: string
  /** 原文 */
  text: string
  /** 来源说明 */
  source: string
}

/** 单个解读区块（本卦/动爻/互卦/变卦/体用） */
export interface LocalInterpretationSection {
  role: InterpretationRole
  title: string
  /** 经典原文列表 */
  classicTexts: ClassicTextRef[]
  /** Oraculum 现代释义——白话解释 */
  plainExplanation: string
  /** 该卦象在本次问卦中的角色说明 */
  roleExplanation: string
}

/** 完整的本地解读结果 */
export interface LocalDetailedInterpretation {
  /** 一句话概览 */
  overview: string
  /** 本卦 */
  base: LocalInterpretationSection
  /** 动爻列表（梅花通常1个，六爻可能多个） */
  movingLines: LocalInterpretationSection[]
  /** 互卦（梅花用，六爻不用） */
  mutual?: LocalInterpretationSection
  /** 变卦 */
  changed?: LocalInterpretationSection
  /** 体用（梅花用，六爻不用） */
  bodyUse?: LocalInterpretationSection
  /** 综合段落（由数据+模板组合，非硬编码） */
  synthesis: string
  /** 有利信号 */
  favorable: string[]
  /** 制约/警示信号 */
  constraints: string[]
  /** 行动提示 */
  actionTips: string[]
  /** 用神理由（六爻用） */
  usefulGodReason?: string
}
