/**
 * 运势模块——类型定义
 * v4.4 重构：
 * - 统一出生历法 normalize（公历/农历/闰月）
 * - 大运顺逆以 yun.isForward() 为唯一事实源
 * - 诚实精度（year_month 不伪造日=1）
 * - 晚子时日界 sect 显式记录
 * - 运势解释引擎（十神/地支冲合 evidence 闭环）
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
  /** 农历：本个月是否为闰月（仅 calendarType=lunar 时有意义） */
  lunarLeapMonth?: boolean
  /** 时间精度：有 minute='minute'，只有 hour='hour' */
  timePrecision?: 'hour' | 'minute'
  /**
   * 八字日界（晚子时规则）：
   * - 2：00:00 换日，23:00-23:59 日柱按当天（默认）
   * - 1：23:00 子初换日，晚子时按次日
   */
  daySect?: 1 | 2
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

/** 起运信息（完整） */
export interface QiYunInfo {
  /** 起运年龄（虚岁） */
  startAge: number
  /** 出生后 X 年起运 */
  startYears: number
  /** 出生后 X 个月起运（配合 startYears） */
  startMonths: number
  /** 出生后 X 天起运（配合 startYears/startMonths） */
  startDays: number
  /** 出生后 X 个时辰起运（配合前面） */
  startHours: number
  /** 起运公历日期（YYYY-MM-DD） */
  startDate: string
  /** 排列方向：顺排 / 逆排 */
  direction: '顺' | '逆'
  /** 采用的晚子时日界 sect */
  yunSect: 1 | 2
}

/** 八字概览 */
export interface BaziOverview {
  pillars: BaziPillars
  precision: BirthPrecision
  /** 精度说明文字，如"仅展示年月二柱" */
  precisionNote: string
  /** 起运信息（仅 exact_time 且 gender 非 unspecified） */
  qiYun?: QiYunInfo
  /** 五行统计（仅表层八字干支计数） */
  wuxingCount?: Record<string, number>
  /** 纳音 */
  nayin?: { year: string; month: string; day?: string; hour?: string }
  /** 采用的晚子时日界 sect */
  daySect?: 1 | 2
  /** 日界规则说明文字 */
  dayBoundaryLabel?: string
}

/** 运势独立版本号 */
export const FORTUNE_RULESET_VERSION = '2.0.0'
export const FORTUNE_DATASET_VERSION = '1.1.0'
