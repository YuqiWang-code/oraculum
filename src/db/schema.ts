import type { DivinationRecord } from '../engine/orchestrator'
import type { DayBoundaryRule } from '../types'
import type { BirthProfile } from '../engine/fortune'

export interface HistoryRecord extends DivinationRecord {
  /** 便于列表展示与搜索的冗余字段 */
  question: string
  category: string
  label: string
  score: number
  hexagramName: string
}

export interface Settings {
  timezone: string
  useShenshaInScore: boolean
  showLunarDetail: boolean
  dayBoundaryRule: DayBoundaryRule
  /** 结果页默认显示：一句话 + 详细解读，或仅详细解读 */
  resultDisplayMode: 'full_with_plain' | 'detailed_only'
  /** v4.3 阅读模式：简明模式（默认）或研究模式 */
  readingMode?: 'simple' | 'research'
}

/** v4.3 出生档案（运势模块），默认不保存，只有用户主动勾选才写入 */
export interface FortuneProfileRecord extends BirthProfile {
  id: string
  createdAt: string
  label?: string
}
