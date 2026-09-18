import Dexie, { Table } from 'dexie'
import type { HistoryRecord, Settings } from './schema'
import type { DivinationRecord } from '../engine/orchestrator'
import { APP_VERSION } from '../types'

class DivinationDB extends Dexie {
  history!: Table<HistoryRecord, string>
  settings!: Table<Settings, string>

  constructor() {
    super('smart-divination')
    this.version(1).stores({
      history: 'id, createdAt, category, label',
      settings: 'key'
    })
    // v2：曾新增 aiSessions；v3 起彻底移除 AI，此 store 被删除
    this.version(2).stores({
      history: 'id, createdAt, category, label',
      settings: 'key',
      aiSessions: 'id, recordId, updatedAt'
    })
    // v3：删除 aiSessions store（Dexie 官方：新版 schema 中设为 null 即删除 store）
    // history / settings 完全保留，旧数据不丢
    this.version(3).stores({
      aiSessions: null
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

export async function deleteRecord(id: string): Promise<void> {
  await db.history.delete(id)
}

export async function clearHistory(): Promise<void> {
  await db.history.clear()
}

export async function exportAll(): Promise<string> {
  const rows = await db.history.toArray()
  return JSON.stringify({
    app: 'Oraculum',
    exportSchemaVersion: 3,
    appVersion: APP_VERSION,
    exportedAt: new Date().toISOString(),
    records: rows
  }, null, 2)
}

export async function importAll(json: string): Promise<number> {
  let data: { records?: unknown }
  try {
    data = JSON.parse(json)
  } catch {
    throw new Error('导入文件不是合法 JSON')
  }
  if (!Array.isArray(data.records)) throw new Error('导入文件缺少 records 数组')
  const rows = data.records as HistoryRecord[]
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
