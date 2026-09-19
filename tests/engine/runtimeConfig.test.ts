// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import type { RatingBreakdown } from '../../src/types'

// Mock dexie to avoid IndexedDB hang in jsdom
vi.mock('dexie', () => {
  class Table {
    constructor() {}
  }
  class Dexie {
    version() { return { stores: () => {} } }
  }
  return { default: Dexie, Table }
})

/**
 * Phase 17：路由 / DB / RatingBreakdown 测试
 * 路由需要 DOM（createWebHistory），故本文件使用 jsdom 环境。
 */

describe('DB 导出', () => {
  it('src/db 导出 getRecord 为函数', async () => {
    const mod = await import('../../src/db/index')
    expect(typeof mod.getRecord).toBe('function')
  })

  it('src/db 同时导出 saveRecord/listHistory 等历史操作', async () => {
    const mod = await import('../../src/db/index')
    expect(typeof mod.saveRecord).toBe('function')
    expect(typeof mod.listHistory).toBe('function')
    expect(typeof mod.deleteRecord).toBe('function')
    expect(typeof mod.getSettings).toBe('function')
  })
})

describe('路由配置', () => {
  it('router 包含 path 为 /result/:id 的结果页路由', async () => {
    const { router } = await import('../../src/router/index')
    const matched = router.getRoutes().find((r) => r.path === '/result/:id')
    expect(matched, '应有 /result/:id 路由').toBeDefined()
    expect(matched!.name).toBe('result')
  })

  it('router 包含首页与历史页路由', async () => {
    const { router } = await import('../../src/router/index')
    const paths = router.getRoutes().map((r) => r.path)
    expect(paths).toContain('/')
    expect(paths).toContain('/history')
    expect(paths).toContain('/settings')
  })
})

describe('RatingBreakdown 结构', () => {
  it('RatingBreakdown 包含 sourceTaboo 字段', () => {
    const b: RatingBreakdown = {
      usefulGod: 10,
      sourceTaboo: 0,
      shiYing: 5,
      monthDay: -3,
      movement: 8,
      conflictHarmony: 0,
      classicTheme: 5,
      auxiliary: 0
    }
    expect(typeof b.sourceTaboo).toBe('number')
    expect(Object.keys(b)).toContain('sourceTaboo')
  })

  it('RatingBreakdown 八个 bucket 齐全', () => {
    const b: RatingBreakdown = {
      usefulGod: 0, sourceTaboo: 0, shiYing: 0, monthDay: 0,
      movement: 0, conflictHarmony: 0, classicTheme: 0, auxiliary: 0
    }
    expect(Object.keys(b).sort()).toEqual([
      'auxiliary', 'classicTheme', 'conflictHarmony', 'monthDay',
      'movement', 'shiYing', 'sourceTaboo', 'usefulGod'
    ])
  })
})
