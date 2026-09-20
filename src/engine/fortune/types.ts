/**
 * 运势模块——类型定义
 * v4.3 新增：八字大运流年 + 京房八宫 / 《易隐》十六变研究层。
 * 纯本地、离线、确定性。不引入模型权重。
 */

/** 出生资料精度 */
export type BirthPrecision =
  | 'year_month'    // 只有年月 → 年月二柱
  | 'date'          // 年月日 → 三柱，时柱未知
  | 'exact_time'    // 完整年月日时 → 四柱 + 大运 + 流年

/** 出生资料 */
export interface BirthProfile {
  id?: string
  calendarType: 'solar' | 'lunar'
  year: number
  month: number
  day?: number
  hour?: number
  minute?: number
  timezone: string
  precision: BirthPrecision
  /** 传统大运顺逆需要的男/女参数；unspecified 不猜 */
  traditionalGenderParam: 'male' | 'female' | 'unspecified'
  /** 是否保存本地档案（默认 false，只有用户主动勾选才保存） */
  saveLocally: boolean
}

/** 规则来源层——所有运势规则都必须标注来源 */
export type FortuneSourceLayer =
  | 'jingfang-eight-palace'     // 京房八宫核心
  | 'yiyin-sixteen-extension'   // 《易隐》后世扩展（十六变后8阶段）
  | 'yiyin-life-limit'          // 《易隐》身命三限
  | 'bazi-yun'                  // 八字大运/流年（lunar-javascript）
  | 'modern-analogy'            // 现代类比资料（如南怀瑾人生阶段类比）
  | 'oraculum-normalization'    // Oraculum 项目规范化

/** 运势白话解读 */
export interface FortunePlainReading {
  /** 这一阶段更值得关注什么 */
  focus: string
  /** 为什么 */
  why: string
  /** 适合怎么做 */
  howToAct: string
  /** 注意什么 */
  watchOut: string
  /** 来源层 */
  sourceLayer: FortuneSourceLayer
}

/** 四柱 */
export interface BaziPillars {
  year: string   // 年柱干支
  month: string  // 月柱干支
  day?: string   // 日柱干支（precision >= date）
  hour?: string  // 时柱干支（precision === exact_time）
}

/** 大运条目 */
export interface DaYunEntry {
  index: number
  ganzhi: string       // 大运干支
  startAge: number     // 起运年龄
  endAge: number       // 结束年龄
  startDate?: string   // 起运公历日期
  direction: '顺' | '逆'
  sourceLayer: FortuneSourceLayer
}

/** 流年条目 */
export interface LiuNianEntry {
  year: number           // 公历年份
  age: number            // 虚岁/周岁（标注清楚）
  daYunGanzhi?: string   // 所在大运干支
  liuNianGanzhi: string  // 流年干支
  /** 十神结构提示（如"比肩主事""偏财透出"） */
  structureHint?: string
  /** 明显冲合提示 */
  clashHarmonyHint?: string
  /** 现实白话（Oraculum 项目规范，非确定命运） */
  plainReading?: string
  sourceLayer: FortuneSourceLayer
}

/** 八字概览 */
export interface BaziOverview {
  pillars: BaziPillars
  precision: BirthPrecision
  /** 精度说明文字，如"仅展示年月二柱" */
  precisionNote: string
  /** 起运信息（仅 exact_time 且 gender 非 unspecified） */
  qiYun?: {
    startAge: number
    startDate: string
    direction: '顺' | '逆'
  }
  /** 五行统计 */
  wuxingCount?: Record<string, number>
  /** 纳音 */
  nayin?: { year: string; month: string; day?: string; hour?: string }
}

/** 运势独立版本号 */
export const FORTUNE_RULESET_VERSION = '1.0.0'
export const FORTUNE_DATASET_VERSION = '1.0.0'
