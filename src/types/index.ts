// 全局规则版本：算法或数据变更时必须递增，历史记录据此可重现
export const RULESET_VERSION = '1.0.0'
export const DATASET_VERSION = '1.0.0'

/** 五行 */
export type Element = '金' | '木' | '水' | '火' | '土'

/** 八卦名（经卦） */
export type TrigramName = '乾' | '兑' | '离' | '震' | '巽' | '坎' | '艮' | '坤'

/** 八宫名（同八卦） */
export type PalaceName = TrigramName

/** 六亲 */
export type SixRelation = '父母' | '兄弟' | '子孙' | '妻财' | '官鬼'

/** 六神 */
export type SixSpirit = '青龙' | '朱雀' | '勾陈' | '螣蛇' | '白虎' | '玄武'

/** 阴阳爻：1 阳，0 阴 */
export type YinYang = 0 | 1

/** 问题类别 */
export type QuestionCategory =
  | '事业工作'
  | '考试学业'
  | '项目合作'
  | '财务收益'
  | '感情关系'
  | '家庭人际'
  | '出行变动'
  | '失物寻找'
  | '选择比较'
  | '计划成败'
  | '日常综合'
  | '其他'

/** 起卦方式 */
export type CastingMode = 'meihua_time' | 'liuyao_coins' | 'manual_hexagram' | 'hybrid_experimental'

export type Gender = 'male' | 'female' | 'unspecified'

/** 五档标签 */
export type RatingLabel = '大凶' | '凶' | '平' | '吉' | '大吉'

/** 评分证据项 */
export interface ScoreEvidence {
  id: string
  title: string
  delta: number
  reason: string
  sourceRule: string
}

/** 评分结果 */
export interface Rating {
  score: number
  label: RatingLabel
  /** 证据一致性 0-1，证据越一致越高 */
  consistency: number
  favorableCount: number
  constraintCount: number
  evidence: ScoreEvidence[]
  ruleVersion: string
}

/** 历法上下文（统一封装，业务不直接调 lunar-javascript） */
export interface CalendarContext {
  localDateTime: string
  timezone: string
  lunarDate: string
  yearGanzhi: string
  monthGanzhi: string
  dayGanzhi: string
  hourGanzhi: string
  solarTerm: string
  prevSolarTermAt: string
  nextSolarTermAt: string
  /** 月建地支（按节令） */
  monthBranch: string
  dayStem: string
  dayBranch: string
  /** 时支 */
  hourBranch: string
  /** 年支（用于梅花年支数） */
  yearBranch: string
  /** 农历月（数字） */
  lunarMonth: number
  /** 农历日（数字） */
  lunarDay: number
  /** 旬空两个地支 */
  xunKong: string[]
}

/** 卦结构：六爻自下而上 [初,二,三,四,五,上] */
export type Lines = [YinYang, YinYang, YinYang, YinYang, YinYang, YinYang]

/** 三爻经卦自下而上 */
export type TriLines = [YinYang, YinYang, YinYang]

/** 经典文本 */
export interface ClassicText {
  source: string
  original: string
  modernSummary: string
  tags: string[]
}

/** 六十四卦数据 */
export interface HexagramData {
  kingWen: number
  name: string
  unicode: string
  upper: TrigramName
  lower: TrigramName
  lines: Lines
  palace: PalaceName
  /** 八宫位置 0本宫 1一世...7归魂 */
  palacePosition: number
  shiLine: 1 | 2 | 3 | 4 | 5 | 6
  yingLine: 1 | 2 | 3 | 4 | 5 | 6
  judgmentClassic: string
  lineTextsClassic: string[]
  editorialKeywords: string[]
  sources: string[]
  /** 经典文本是否已联网逐字核验 */
  needsVerify: boolean
}

/** 单爻（六爻排盘用） */
export interface LiuYaoLine {
  index: 1 | 2 | 3 | 4 | 5 | 6
  yinYang: YinYang
  moving: boolean
  branch: string
  branchElement: Element
  stem: string
  sixRelation: SixRelation
  sixSpirit: SixSpirit
  isShi: boolean
  isYing: boolean
  /** 变爻后的地支（若动） */
  changedBranch?: string
  hidden?: {
    branch: string
    element: Element
    relation: SixRelation
  }
}

/** 神煞命中 */
export interface ShenshaHit {
  name: string
  basis: string
  branch: string
  meaning: string
  ruleVersion: string
  source: string
}

/** 一次起卦输入 */
export interface DivinationInput {
  id: string
  createdAt: string
  timezone: string
  question: string
  category: QuestionCategory
  querentAlias?: string
  gender: Gender
  castingMode: CastingMode
  /** 用户指定的起卦时间（ISO），默认当前时间 */
  castTime: string
  locationLabel?: string
}

/** 现代解读结构 */
export interface Interpretation {
  summary: string
  favorable: string[]
  constraints: string[]
  trend: string
  actionTips: string[]
  usefulGodReason?: string
}
