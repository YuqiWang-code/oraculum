/**
 * 普通用户解释层（plain interpretation）数据类型
 *
 * 设计原则：
 *  - 这是「表达层」，只负责把专业计算结果翻译成大白话。
 *  - 不参与任何起卦、排盘、评分计算；不含随机、不联网。
 *  - 与古籍原文层（classic）严格分开，绝不改写 classic 数据。
 *  - 同一份数据在任何时候输出都一致（确定性）。
 */

/**
 * 专业术语的小白解释。
 * simple：一句话，给第一次接触的人看。
 * elder：更大白话的说法，给长辈看（可与 simple 接近）。
 * detail：可选，给「文化/研究模式」补充一点背景，不堆术语。
 */
export interface PlainTerm {
  /** 专业术语，如「体用」「四柱」 */
  term: string
  /** 普通解释（文化模式） */
  simple: string
  /** 长辈友好解释（简单模式） */
  elder: string
  /** 可选的补充背景（研究模式） */
  detail?: string
}

/**
 * 单个卦的普通用户解释。
 * classic：专业词（卦名），与古文层对应但不复制原文。
 * simple：一句生活化白话（文化模式）。
 * elder：长辈大白话（简单模式优先，缺省回退 simple）。
 * action：一句可以怎么做的现实提醒。
 */
export interface PlainHexagram {
  kingWen: number
  /** 卦名（简体，与 UI / 数据层一致） */
  name: string
  /** 专业层：卦名本身 */
  classic: string
  /** 普通用户一句话（15-32 字，不堆术语、不用宜/忌/凶/吉） */
  simple: string
  /** 长辈友好一句话（可缺省，缺省用 simple） */
  elder?: string
  /** 现实行动提醒（8-20 字） */
  action: string
}

/** 体用关系（梅花）的人话解释，key 与 BodyUseRelation 对齐 */
export interface PlainBodyUse {
  relation: 'same' | 'generatesA' | 'generatesB' | 'controlsA' | 'controlsB'
  /** 专业标签（研究模式用，如「用克体」） */
  classic: string
  /** 普通一句话 */
  simple: string
  /** 长辈友好一句话 */
  elder: string
  /** 现实提醒 */
  action: string
}

/** 首页 / 问卦入口的友好主题卡片 */
export interface FriendlyTheme {
  /** 稳定 key */
  key: string
  /** emoji 图标（纯字符，不引图片资源） */
  icon: string
  /** 卡片标题 */
  title: string
  /** 一句话副标题 */
  subtitle: string
  /** 映射到引擎既有的问题类别（计算层不变） */
  category: import('../../types').QuestionCategory
}
