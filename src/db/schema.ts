import type { DivinationRecord } from '../engine/orchestrator'
import type { AiInterpretation, AiChatMessage } from '../types/ai'
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
  aiEnabled?: boolean
}

export interface AiSession {
  id: string
  recordId: string
  createdAt: string
  updatedAt: string
  model: string
  promptVersion: 'oraculum_ai_v1'
  response: AiInterpretation
  messages: AiChatMessage[]
  usage?: { input_tokens?: number; output_tokens?: number }
}
