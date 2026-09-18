import Dexie, { Table } from 'dexie'
import type { HistoryRecord, Settings, AiSession } from './schema'
import type { DivinationRecord } from '../engine/orchestrator'
import type { AiInterpretation, AiChatMessage } from '../types/ai'
import { APP_VERSION } from '../types'

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
  // 深克隆去掉 Vue 响应式代理，避免 IndexedDB DataCloneError
  const raw = JSON.parse(JSON.stringify(rec)) as DivinationRecord
  const row: HistoryRecord = {
    ...raw,
    question: raw.input.question,
    category: raw.input.category,
    label: raw.rating.label,
    score: raw.rating.score,
    hexagramName: raw.meihua ? raw.meihua.ben.name : raw.liuyao?.hexagram.name ?? ''
  }
  await db.history.put(row)
  return rec.id
}

export async function listHistory(limit = 100): Promise<HistoryRecord[]> {
  return db.history.orderBy('createdAt').reverse().limit(limit).toArray()
}

// v3.1: 删除历史同时级联删除 aiSessions
export async function deleteRecord(id: string): Promise<void> {
  await db.transaction('rw', db.history, db.aiSessions, async () => {
    await db.history.delete(id)
    await db.aiSessions.where('recordId').equals(id).delete()
  })
}

// v3.1: 清空同时清两表
export async function clearHistory(): Promise<void> {
  await db.transaction('rw', db.history, db.aiSessions, async () => {
    await db.history.clear()
    await db.aiSessions.clear()
  })
}

export async function exportAll(): Promise<string> {
  const rows = await db.history.toArray()
  const sessions = await db.aiSessions.toArray()
  return JSON.stringify({
    app: 'Oraculum',
    exportSchemaVersion: 2,
    appVersion: APP_VERSION,
    exportedAt: new Date().toISOString(),
    records: rows,
    aiSessions: sessions
  }, null, 2)
}

// v3.1: 简单 schema 校验，非法 JSON 不 bulkPut
export async function importAll(json: string): Promise<number> {
  let data: { records?: unknown }
  try {
    data = JSON.parse(json)
  } catch {
    throw new Error('导入文件不是合法 JSON')
  }
  if (!Array.isArray(data.records)) throw new Error('导入文件缺少 records 数组')
  const rows = data.records as HistoryRecord[]
  // 简单校验：每条必须有 id 和 rating
  for (const r of rows) {
    if (!r.id || !r.rating || typeof r.rating.score !== 'number') {
      throw new Error('导入文件格式不正确：存在缺少 id/rating 的记录')
    }
  }
  await db.history.bulkPut(rows)
  return rows.length
}

const DEFAULT_SETTINGS: Settings = {
  timezone: 'Asia/Shanghai',
  useShenshaInScore: true,
  showLunarDetail: true,
  dayBoundaryRule: 'midnight'
}

export async function getSettings(): Promise<Settings> {
  const row = await db.settings.get('main')
  // v3.1: 旧数据 dayBoundaryRule 可能是 '00:00'/'23:00' 字符串，映射为新枚举
  const merged = row ? { ...DEFAULT_SETTINGS, ...row } : { ...DEFAULT_SETTINGS }
  const rawRule = String(merged.dayBoundaryRule)
  if (rawRule === '00:00') {
    merged.dayBoundaryRule = 'midnight'
  } else if (rawRule === '23:00') {
    merged.dayBoundaryRule = 'zi_hour'
  }
  return merged
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
  model: string,
  usage?: { input_tokens?: number; output_tokens?: number }
): Promise<void> {
  const existing = await getAiSession(recordId)
  const row: AiSession = {
    id: existing?.id || (Date.now().toString(36) + Math.random().toString(36).slice(2, 7)),
    recordId,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    model,
    promptVersion: 'oraculum_ai_v1',
    response: JSON.parse(JSON.stringify(response)),
    messages: messages.slice(-6),
    usage
  }
  await db.aiSessions.put(row)
}
