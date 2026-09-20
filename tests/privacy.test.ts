import { describe, it, expect } from 'vitest'
import { readFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join, extname } from 'node:path'

/**
 * Phase 45：隐私 / 纯本地存储测试
 * 测试环境为 node（无 IndexedDB），因此以源码静态扫描 + 结构断言为主，
 * 确保业务层不引入任何远程 DB SDK，数据仅落本机 IndexedDB。
 */

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const srcDir = join(root, 'src')

async function walk(dir: string): Promise<string[]> {
  const out: string[] = []
  const entries = await readdir(dir, { withFileTypes: true })
  for (const e of entries) {
    const p = join(dir, e.name)
    if (e.isDirectory()) out.push(...(await walk(p)))
    else if (['.ts', '.vue'].includes(extname(e.name))) out.push(p)
  }
  return out
}

// 远程 DB SDK 的 import 路径关键词（大小写不敏感）
const REMOTE_DB_PATTERNS = [
  /['"][^'"]*firebase[^'"]*/i,
  /['"][^'"]*supabase[^'"]*/i,
  /['"][^'"]*@cloudflare[^'"]*/i,
  /['"][^'"]*cloudflare[\-_/]workers[^'"]*/i,
  /['"][^'"]*['"]d1['"]/i,
  /['"][^'"]*['"]kv['"]/i
]

function findRemoteDbImports(content: string): string[] {
  const hits: string[] = []
  for (const line of content.split(/\r?\n/)) {
    if (!/^\s*(import|export|require)\b/.test(line)) continue
    if (REMOTE_DB_PATTERNS.some((re) => re.test(line))) hits.push(line.trim())
  }
  return hits
}

describe('纯本地存储：无远程 DB SDK', () => {
  it('业务代码 src/ 不引入 firebase / supabase / cloudflare d1 / kv', async () => {
    const files = await walk(srcDir)
    const violations: string[] = []
    for (const f of files) {
      const content = await readFile(f, 'utf8')
      const hits = findRemoteDbImports(content)
      for (const h of hits) {
        violations.push(`${f.replace(root, '')}: ${h}`)
      }
    }
    expect(violations, violations.join('\n')).toEqual([])
  })

  it('package.json 不依赖远程 DB SDK', async () => {
    const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
    const deps = { ...pkg.dependencies, ...pkg.devDependencies } as Record<string, string>
    for (const name of Object.keys(deps)) {
      expect(
        /firebase|supabase|@cloudflare/.test(name),
        `意外依赖远程 DB SDK: ${name}`
      ).toBe(false)
    }
  })
})

describe('Dexie / IndexedDB 结构', () => {
  it('db/index.ts 使用 Dexie，且仅含 history/settings/fortuneProfiles 三表', async () => {
    const src = await readFile(join(root, 'src', 'db', 'index.ts'), 'utf8')
    expect(src).toMatch(/import\s+Dexie/)
    expect(src).toMatch(/this\.version\(\d+\)\.stores\(\{/)
    // 三个表都在 stores 中
    expect(src).toMatch(/history:\s*['"]id/)
    expect(src).toMatch(/settings:\s*['"]key/)
    expect(src).toMatch(/fortuneProfiles:\s*['"]id/)
    // 不应残留远程连接
    expect(src).not.toMatch(/firebase|supabase|fetch\(['"]http/)
  })

  it('history 表仅写本机 IndexedDB（saveRecord 落 db.history）', async () => {
    const src = await readFile(join(root, 'src', 'db', 'index.ts'), 'utf8')
    expect(src).toMatch(/db\.history\.put/)
  })

  it('fortuneProfiles 表仅写本机 IndexedDB（saveFortuneProfile 落 db.fortuneProfiles）', async () => {
    const src = await readFile(join(root, 'src', 'db', 'index.ts'), 'utf8')
    expect(src).toMatch(/db\.fortuneProfiles\.put/)
  })
})

describe('出生档案默认不保存', () => {
  it('BirthProfile.saveLocally 默认 false（源码注释声明默认不保存）', async () => {
    const src = await readFile(join(root, 'src', 'engine', 'fortune', 'types.ts'), 'utf8')
    expect(src).toMatch(/saveLocally:\s*boolean/)
    expect(src).toMatch(/默认\s*false|默认不保存/)
  })
})

describe('导出默认不含出生档案', () => {
  it('exportAll() 默认不包含 fortuneProfiles 字段', async () => {
    const src = await readFile(join(root, 'src', 'db', 'index.ts'), 'utf8')
    // 基础导出对象只含 records，fortuneProfiles 不在默认对象字面量中
    expect(src).toMatch(/records:\s*rows/)
    // 默认 data 对象字面量（在 includeFortuneProfiles 条件块之前）不含 fortuneProfiles
    const funcBody = src.slice(src.indexOf('export async function exportAll'))
    const objEnd = funcBody.indexOf('records: rows')
    expect(objEnd).toBeGreaterThan(-1)
    const beforeIf = funcBody.slice(0, funcBody.indexOf('options?.includeFortuneProfiles'))
    expect(beforeIf).not.toContain('data.fortuneProfiles')
  })

  it('仅当 includeFortuneProfiles=true 时才追加 fortuneProfiles', async () => {
    const src = await readFile(join(root, 'src', 'db', 'index.ts'), 'utf8')
    // fortuneProfiles 赋值必须位于 includeFortuneProfiles 条件块内
    expect(src).toMatch(
      /if\s*\(\s*options\?\.includeFortuneProfiles\s*\)\s*\{\s*data\.fortuneProfiles\s*=\s*await db\.fortuneProfiles\.toArray\(\)/s
    )
  })
})
