import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { sanitizeRecord } from '../../server/ai/sanitizeRecord'
import { AiInterpretationSchema } from '../../server/ai/schema'
import { SYSTEM_PROMPT } from '../../server/ai/prompt'

const root = process.cwd()

describe('sanitizeRecord 数据最小化', () => {
  const rec: any = {
    input: { question: '测试', category: '日常综合', querentAlias: '秘密名字', gender: 'unspecified' },
    calendar: { lunarDate: '2026-09-17', yearGanzhi: '丙午', monthGanzhi: '丁酉', dayGanzhi: '甲子', hourGanzhi: '甲子', solarTerm: '秋分', monthBranch: '酉', xunKong: ['戌','亥'] },
    rating: { score: 68, label: '吉', consistency: 0.8 },
    interpretation: { summary: 's', favorable: ['a'], constraints: [], trend: 't' },
    meihua: { ben: { name: '乾' }, hu: { name: '夬' }, bian: { name: '履' }, movingLine: 3, tiElement: '金', yongElement: '金', relation: 'same' },
    history: [{ id: 'old' }]
  }
  it('不包含 alias', () => {
    const s: any = sanitizeRecord(rec)
    expect(JSON.stringify(s)).not.toContain('秘密名字')
    expect(s.querentAlias).toBeUndefined()
  })
  it('不包含历史全库', () => {
    const s: any = sanitizeRecord(rec)
    expect(s.history).toBeUndefined()
  })
  it('保留必要字段', () => {
    const s: any = sanitizeRecord(rec)
    expect(s.question).toBe('测试')
    expect(s.rating.score).toBe(68)
    expect(s.meihua.ben).toBe('乾')
  })
})

describe('AI schema 可验证', () => {
  const mock = {
    answer: '综合结论',
    traditionalReading: { summary: 's', favorable: ['a'], constraints: [], trend: 't', evidenceIds: ['体用'] },
    timing: { applicable: true, window: '数日', confidence: 'low', basis: ['动爻'] },
    likelihood: { applicable: true, realityFeasibility: 'uncertain', explanation: '信息不足' },
    realityCheck: '现实核对',
    actionSuggestions: ['先确认进度'],
    uncertainties: ['依赖未知'],
    disclaimer: '仅供娱乐'
  }
  it('有效输入通过', () => {
    expect(AiInterpretationSchema.parse(mock)).toBeTruthy()
  })
  it('likelihood 不产生伪精确百分比', () => {
    const r = AiInterpretationSchema.parse(mock)
    expect(r.likelihood.realityFeasibility).not.toMatch(/\d+%/)
  })
  it('AI 输出不含 traditionalScore/traditionalLabel（v3.1）', () => {
    const r = AiInterpretationSchema.parse(mock)
    expect((r.likelihood as Record<string, unknown>).traditionalScore).toBeUndefined()
    expect((r.likelihood as Record<string, unknown>).traditionalLabel).toBeUndefined()
  })
})

describe('prompt 职责限制', () => {
  it('包含禁止重新起卦与不冒充概率', () => {
    expect(SYSTEM_PROMPT).toContain('禁止重新起卦')
    expect(SYSTEM_PROMPT).toContain('不是统计概率')
  })
})

describe('前端源码不泄露 key / 直连 OpenAI', () => {
  function walk(dir: string): string[] {
    const out: string[] = []
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.name === 'node_modules' || e.name.startsWith('.')) continue
      const p = join(dir, e.name)
      if (e.isDirectory()) out.push(...walk(p))
      else if (/\.(ts|vue|js)$/.test(e.name)) out.push(p)
    }
    return out
  }
  it('src/ 不含 OPENAI_API_KEY 或 api.openai.com', () => {
    const files = walk(join(root, 'src'))
    let bad: string[] = []
    for (const f of files) {
      const c = readFileSync(f, 'utf8')
      if (/OPENAI_API_KEY/.test(c) || /api\.openai\.com/.test(c)) bad.push(f)
    }
    expect(bad).toEqual([])
  })
})

describe('.env 被 gitignore', () => {
  it('.gitignore 忽略 .env 且保留 .env.example', () => {
    const gi = readFileSync(join(root, '.gitignore'), 'utf8')
    expect(gi).toContain('.env')
    expect(gi).toContain('!.env.example')
  })
  it('.env.example 只有占位符', () => {
    const ex = readFileSync(join(root, '.env.example'), 'utf8')
    expect(ex).toContain('YOUR_LLM_API_KEY_HERE')
    expect(ex).not.toMatch(/sk-[A-Za-z0-9]{20}/)
  })
})
