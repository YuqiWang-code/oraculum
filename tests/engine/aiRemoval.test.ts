import { describe, it, expect } from 'vitest'
import { existsSync } from 'fs'
import { resolve } from 'path'
import { APP_VERSION, DATASET_VERSION, LOCAL_KNOWLEDGE_VERSION, RULESET_VERSION } from '../../src/types'

const ROOT = resolve(__dirname, '../..')

describe('AI 彻底移除验证', () => {
  it('package.json 不含 openai', async () => {
    const pkg = await import('../../package.json')
    const deps = { ...pkg.dependencies, ...pkg.devDependencies } as Record<string, string>
    expect(deps.openai).toBeUndefined()
  })

  it('package.json 不含 express', async () => {
    const pkg = await import('../../package.json')
    const deps = { ...pkg.dependencies, ...pkg.devDependencies } as Record<string, string>
    expect(deps.express).toBeUndefined()
    expect(deps['express-rate-limit']).toBeUndefined()
    expect(deps['@types/express']).toBeUndefined()
  })

  it('package.json 不含 dotenv', async () => {
    const pkg = await import('../../package.json')
    const deps = { ...pkg.dependencies, ...pkg.devDependencies } as Record<string, string>
    expect(deps.dotenv).toBeUndefined()
  })

  it('package.json 不含 concurrently', async () => {
    const pkg = await import('../../package.json')
    const deps = { ...pkg.dependencies, ...pkg.devDependencies } as Record<string, string>
    expect(deps.concurrently).toBeUndefined()
  })

  it('server/ 目录不存在', () => {
    expect(existsSync(resolve(ROOT, 'server'))).toBe(false)
  })

  it('.env.example 不存在', () => {
    expect(existsSync(resolve(ROOT, '.env.example'))).toBe(false)
  })

  it('src/components/ai/ 不存在', () => {
    expect(existsSync(resolve(ROOT, 'src/components/ai'))).toBe(false)
  })

  it('src/services/ai.ts 不存在', () => {
    expect(existsSync(resolve(ROOT, 'src/services/ai.ts'))).toBe(false)
  })

  it('src/types/ai.ts 不存在', () => {
    expect(existsSync(resolve(ROOT, 'src/types/ai.ts'))).toBe(false)
  })

  it('dist-server/ 不存在', () => {
    expect(existsSync(resolve(ROOT, 'dist-server'))).toBe(false)
  })

  it('版本号正确', () => {
    expect(APP_VERSION).toBe('4.1.0')
    expect(DATASET_VERSION).toBe('3.0.0')
    expect(LOCAL_KNOWLEDGE_VERSION).toBe('1.0.0')
    expect(RULESET_VERSION).toBe('4.1.0')
  })

  it('package.json scripts 不含 dev:server/dev:full/build:server/start', async () => {
    const pkg = await import('../../package.json')
    const scripts = pkg.scripts as Record<string, string>
    expect(scripts['dev:server']).toBeUndefined()
    expect(scripts['dev:full']).toBeUndefined()
    expect(scripts['build:server']).toBeUndefined()
    expect(scripts['start']).toBeUndefined()
  })

  it('package.json scripts 保留纯前端脚本', async () => {
    const pkg = await import('../../package.json')
    expect(pkg.scripts.dev).toBeDefined()
    expect(pkg.scripts.build).toBeDefined()
    expect(pkg.scripts.test).toBeDefined()
    expect(pkg.scripts.preview).toBeDefined()
  })
})
