/**
 * 本地知识数据类型定义
 * 严格区分：古籍原文（classics/）与 Oraculum 现代释义（interpretation/）
 */

/** 单条爻的本地知识 */
export interface LocalLineKnowledge {
  /** 爻位 1=初 ... 6=上 */
  index: 1 | 2 | 3 | 4 | 5 | 6
  /** 爻辞原文（传统繁体） */
  classicText: string
  /** 小象传原文 */
  xiaoXiang: string
  /** Oraculum 现代释义——爻辞白话 */
  plainText: string
  /** Oraculum 现代释义——小象白话 */
  plainXiaoXiang: string
  /** Oraculum 现代释义——此爻核心含义 */
  coreMeaning: string
  /** 动爻主题词（2-6 字，取自爻辞核心短语，如"潜龙勿用"） */
  themeKeyword: string
  /** 有利面（可选） */
  favorableMeaning?: string
  /** 警示面（可选） */
  cautionMeaning?: string
}

/** 单卦的本地知识 */
export interface LocalHexagramKnowledge {
  /** 周文王序 1-64 */
  kingWen: number
  /** 卦名（简体，与 UI 一致） */
  name: string

  /** 古籍原文层 */
  classic: {
    /** 卦辞 */
    judgment: string
    /** 彖传 */
    tuan: string
    /** 大象传 */
    daXiang: string
    /** 来源 URL */
    sourceRefs: string[]
  }

  /** Oraculum 现代释义层（非古籍） */
  localMeaning: {
    /** 卦辞白话 */
    plainJudgment: string
    /** 彖传白话 */
    plainTuan: string
    /** 大象传白话 */
    plainDaXiang: string
    /** 核心含义 */
    coreMeaning: string
    /** 主题关键词（搜索标签用，不做主要解释） */
    keyThemes: string[]
    /** 作为本卦（当前主旨）的解释 */
    asBaseHexagram: string
    /** 作为互卦（中间过程）的解释 */
    asMutualHexagram: string
    /** 作为变卦（后续趋向）的解释 */
    asChangedHexagram: string
    /** 注意事项 */
    cautions: string[]
  }

  /** 六爻知识（自下而上） */
  lines: [
    LocalLineKnowledge,
    LocalLineKnowledge,
    LocalLineKnowledge,
    LocalLineKnowledge,
    LocalLineKnowledge,
    LocalLineKnowledge
  ]
}

/** 本地知识查找结果 */
export interface LocalKnowledgeLookup {
  /** 卦名简体 */
  name: string
  /** 卦名繁体（用于原文展示） */
  nameTraditional: string
  /** 完整知识 */
  knowledge: LocalHexagramKnowledge
}
