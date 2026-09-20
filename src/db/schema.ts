import type { DivinationRecord } from '../engine/orchestrator'
import type { DayBoundaryRule } from '../types'

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
}
