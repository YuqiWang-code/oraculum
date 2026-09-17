import Dexie, { Table } from 'dexie'
import type { HistoryRecord, Settings, AiSession } from './schema'
import type { DivinationRecord } from '../engine/orchestrator'
import type { AiInterpretation, AiChatMessage } from '../types/ai'

class DivinationDB extends Dexie {
  history!: Table<HistoryRecord, string>
  settings!: Table<Settings, string>
  aiSessions!: Table<AiSession, string>

  constructor() {
    super('smart-divination')
    this.version(1).stores({
      history: 'id, createdAt, category, label',
      settings: 'key'
    })
    // v2：新增 aiSessions；不删 history/settings，旧数据保留
    this.version(2).stores({
      history: 'id, createdAt, category, label',
      settings: 'key',
      aiSessions: 'id, recordId, updatedAt'
    })
  }
}

export const db = new DivinationDB()

export async function saveRecord(rec: DivinationRecord): Promise<string> {
  const row: HistoryRecord = {
    ...rec,
    question: rec.input.question,
    category: rec.input.category,
    label: rec.rating.label,
    score: rec.rating.score,
    hexagramName: rec.meihua ? rec.meihua.ben.name : rec.liuyao?.hexagram.name ?? ''
  }
  await db.history.put(row)
  return rec.id
}

export async function listHistory(limit = 100): Promise<HistoryRecord[]> {
  return db.history.orderBy('createdAt').reverse().limit(limit).toArray()
}

export async function deleteRecord(id: string): Promise<void> {
  await db.history.delete(id)
}

export async function clearHistory(): Promise<void> {
  await db.history.clear()
}

export async function exportAll(): Promise<string> {
  const rows = await db.history.toArray()
  return JSON.stringify({ app: '智能推理与预测', version: 1, exportedAt: new Date().toISOString(), records: rows }, null, 2)
}

export async function importAll(json: string): Promise<number> {
  const data = JSON.parse(json)
  const rows: HistoryRecord[] = data.records || []
  await db.history.bulkPut(rows)
  return rows.length
}

const DEFAULT_SETTINGS: Settings = {
  timezone: 'Asia/Shanghai',
  useShenshaInScore: true,
  showLunarDetail: true,
  dayBoundaryRule: '00:00'
}

export async function getSettings(): Promise<Settings> {
  const row = await db.settings.get('main')
  return row ? { ...DEFAULT_SETTINGS, ...row } : { ...DEFAULT_SETTINGS }
}

export async function saveSettings(s: Settings): Promise<void> {
  await db.settings.put({ key: 'main', ...s } as Settings & { key: string })
}

// ---- AI 会话（v2）----
export async function getAiSession(recordId: string): Promise<AiSession | undefined> {
  return db.aiSessions.where('recordId').equals(recordId).first()
}

export async function saveAiSession(
  recordId: string,
  response: AiInterpretation,
  messages: AiChatMessage[],
  model: string
): Promise<void> {
  const existing = await getAiSession(recordId)
  const row: AiSession = {
    id: existing?.id || (Date.now().toString(36) + Math.random().toString(36).slice(2, 7)),
    recordId,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    model,
    promptVersion: 'oraculum_ai_v1',
    response,
    messages: messages.slice(-6)
  }
  await db.aiSessions.put(row)
}
