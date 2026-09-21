import { describe, it, expect, beforeAll } from 'vitest'
import { readFileSync, readdirSync } from 'fs'
import { resolve } from 'path'
import { HEXAGRAM_BY_KINGWEN } from '../../src/data/hexagrams'
import type { MeihuaResult } from '../../src/engine/meihua/castByTime'
import type { LiuYaoResult } from '../../src/engine/liuyao/layout'
import { buildLiuyao } from '../../src/engine/liuyao/layout'
import { buildCalendarContext } from '../../src/engine/calendar/calendarEngine'
import type { Rating, QuestionCategory } from '../../src/types'
import { buildRating } from '../../src/engine/scoring/rating'
import { interpretMeihuaPlain, interpretLiuyaoPlain } from '../../src/engine/plainInterpretation'
import { interpretMeihuaRealWorld, interpretLiuyaoRealWorld } from '../../src/engine/realWorldInterpretation'
import { loadElderFriendlyBatches } from '../../src/local-data'
import {
  PLAIN_HEXAGRAMS,
  TERM_GLOSSARY,
  getTermPlain,
  BODY_USE_PLAIN,
  FRIENDLY_THEMES,
  WHEEL_SECTORS
} from '../../src/local-data/plainInterpretation'

const ROOT = resolve(__dirname, '../..')

/** 硬性承诺词：面向普通用户的白话层一律不得出现（否定语境除外） */
const HARD_BANNED = ['命中注定', '百分百', '发财', '死亡预测'] as const
/** 「一定 / 必然」仅在否定（不一定 / 不必然）时可接受 */
const AFFIRMATIVE_BANNED = [/[^不未]一定/, /[^不未]必然/, /^一定/, /^必然/] as const
/** 一句话里不应直接出现的术语串 / 机器腔 */
const JARGON_IN_ONE_LINER = [
  '用卦克体卦', '体卦', '用卦', '克体', '五行克',
  '外在压力较大', '制约因素较多', '宜稳守', '宜谨慎', '宜守', '忌'
] as const

function findHardBanned(text: string): string[] {
  const hits: string[] = []
  for (const w of HARD_BANNED) if (text.includes(w)) hits.push(w)
  for (const re of AFFIRMATIVE_BANNED) if (re.test(text)) hits.push(re.source)
  return hits
}

function normalMeihua(over: Partial<MeihuaResult> = {}): MeihuaResult {
  const ben = HEXAGRAM_BY_KINGWEN.get(17)!
  const hu = HEXAGRAM_BY_KINGWEN.get(53)!
  const bian = HEXAGRAM_BY_KINGWEN.get(58)!
  return {
    ruleVersion: 'meihua_time_v1',
    annualBranchNum: 7,
    lunarMonth: 8,
    lunarDay: 17,
    hourBranchNum: 7,
    upperTrigram: '兑',
    lowerTrigram: '震',
    ben, hu, bian,
    movingLine: 2,
    movingIndex0: 1,
    tiTrigram: '兑',
    yongTrigram: '震',
    tiElement: '金',
    yongElement: '木',
    relation: 'controlsA',
    bianYongElement: '金',
    ...over
  }
}

function goldenMeihua(): MeihuaResult {
  const ben = HEXAGRAM_BY_KINGWEN.get(33)!
  const hu = HEXAGRAM_BY_KINGWEN.get(44)!
  const bian = HEXAGRAM_BY_KINGWEN.get(44)!
  return normalMeihua({
    upperTrigram: '乾', lowerTrigram: '艮', ben, hu, bian,
    tiTrigram: '乾', yongTrigram: '艮',
    tiElement: '金', yongElement: '金', relation: 'same', bianYongElement: '金'
  })
}

/** 用克体（controlsB）：旧版最容易冒出「用卦克体卦，外在压力较大」机器腔 */
function controlsBMeihua(): MeihuaResult {
  return normalMeihua({ tiElement: '土', yongElement: '木', relation: 'controlsB', bianYongElement: '木' })
}

function rating(deltas: Array<[string, number, string, string]>): Rating {
  return buildRating(
    deltas.map(([id, delta, title, reason], i) => ({
      id: id || `e${i}`, delta, title, reason, sourceRule: 'meihua_body_use'
    }))
  )
}
const good = () => rating([['e1', 12, '体用比和', '局面平顺，内外一致'], ['e2', 10, '卦辞', '整体偏顺']])
const bad = () => rating([['e1', -15, '制约', '外部条件不顺'], ['e2', -15, '时机', '时机不到']])
const flat = () => rating([['e1', 0, '中性', '信号中性']])

function liuyaoCase(): { liuyao: LiuYaoResult; monthBranch: string; dayGanzhi: string } {
  const cal = buildCalendarContext({ date: new Date(2026, 8, 17, 12), timezone: 'Asia/Shanghai' })
  const lines = HEXAGRAM_BY_KINGWEN.get(17)!.lines
  const liuyao = buildLiuyao([...lines], [false, true, false, false, false, false], cal)
  return { liuyao, monthBranch: cal.monthBranch, dayGanzhi: cal.dayGanzhi }
}

beforeAll(async () => {
  // 与 realWorld 测试一致的 8 批，覆盖本文件用到的卦
  await loadElderFriendlyBatches([1, 9, 17, 25, 33, 41, 49, 57])
})

describe('普通用户解释层 · 数据完整与文案红线', () => {
  it('64 卦白话齐全且字段非空', () => {
    expect(Object.keys(PLAIN_HEXAGRAMS).length).toBe(64)
    for (let kw = 1; kw <= 64; kw++) {
      const p = PLAIN_HEXAGRAMS[kw]
      expect(p, `第${kw}卦缺失`).toBeTruthy()
      expect(p.name.length).toBeGreaterThan(0)
      expect(p.simple.trim().length).toBeGreaterThan(5)
      expect(p.action.trim().length).toBeGreaterThan(3)
    }
  })

  it('64 卦白话不含承诺词 / 死亡预测 / 发财', () => {
    for (let kw = 1; kw <= 64; kw++) {
      const p = PLAIN_HEXAGRAMS[kw]
      const text = `${p.simple}${p.action}${p.elder ?? ''}`
      const hits = findHardBanned(text)
      expect(hits, `第${kw}卦《${p.name}》出现禁词 ${hits.join(',')}`).toEqual([])
    }
  })

  it('64 卦白话不直接用 宜/忌/凶/吉 下断语', () => {
    for (let kw = 1; kw <= 64; kw++) {
      const p = PLAIN_HEXAGRAMS[kw]
      const text = `${p.simple}${p.action}`
      for (const ch of ['宜', '忌', '凶', '吉']) {
        expect(text.includes(ch), `第${kw}卦《${p.name}》仍含「${ch}」：${text}`).toBe(false)
      }
    }
  })

  it('必备专业术语都有小白解释', () => {
    const required = ['本卦', '动爻', '互卦', '变卦', '体用', '世应', '用神', '六亲', '六神',
      '五行', '八字', '四柱', '天干地支', '纳音', '十神', '起运', '大运', '流年',
      '八宫', '游魂', '归魂', '十六变', '梅花易数', '六爻纳甲']
    for (const t of required) {
      const info = getTermPlain(t)
      expect(info, `术语「${t}」缺少白话`).toBeTruthy()
      expect(info!.simple.trim().length, `术语「${t}」simple 为空`).toBeGreaterThan(3)
      expect(info!.elder.trim().length, `术语「${t}」elder 为空`).toBeGreaterThan(3)
      expect(findHardBanned(`${info!.simple}${info!.elder}`), `术语「${t}」含禁词`).toEqual([])
    }
    expect(TERM_GLOSSARY.length).toBeGreaterThanOrEqual(required.length)
  })

  it('五种体用关系都有人话解释且不含术语串', () => {
    for (const key of ['same', 'generatesB', 'controlsA', 'generatesA', 'controlsB'] as const) {
      const b = BODY_USE_PLAIN[key]
      expect(b.simple.length).toBeGreaterThan(3)
      expect(b.elder.length).toBeGreaterThan(3)
      const text = `${b.simple}${b.elder}${b.action}`
      expect(findHardBanned(text)).toEqual([])
      expect(text).not.toContain('用卦克体卦')
      expect(text).not.toContain('外在压力较大')
    }
  })

  it('主题卡与灵感转盘配置完整，且转盘不伪装成起卦', () => {
    expect(FRIENDLY_THEMES.length).toBeGreaterThanOrEqual(5)
    expect(WHEEL_SECTORS.length).toBeGreaterThanOrEqual(6)
    for (const w of WHEEL_SECTORS) {
      expect(w.label.length).toBeGreaterThan(0)
      expect(w.placeholder.length).toBeGreaterThan(0)
    }
  })
})

describe('一句话 / 现实白话引擎 · 去机器味', () => {
  const cases: Array<{ name: string; m: MeihuaResult; r: Rating; q: string; c: QuestionCategory }> = [
    { name: '平顺', m: goldenMeihua(), r: good(), q: '我该不该现在去上厕所', c: '日常综合' },
    { name: '体克用', m: normalMeihua(), r: good(), q: '这件事该不该做', c: '事业工作' },
    { name: '用克体', m: controlsBMeihua(), r: bad(), q: '眼下压力很大怎么办', c: '事业工作' },
    { name: '中性', m: normalMeihua(), r: flat(), q: '这件事会怎么发展', c: '日常综合' },
    { name: '大凶分', m: controlsBMeihua(), r: bad(), q: '现在适合辞职吗', c: '事业工作' }
  ]

  for (const cc of cases) {
    it(`梅花·${cc.name}：一句话无术语串、无承诺词`, () => {
      const p = interpretMeihuaPlain(cc.q, cc.c, cc.m, cc.r)
      expect(p.oneLiner.length).toBeGreaterThan(0)
      expect(findHardBanned(p.oneLiner), `oneLiner 禁词：${p.oneLiner}`).toEqual([])
      for (const j of JARGON_IN_ONE_LINER) {
        expect(p.oneLiner.includes(j), `oneLiner 出现「${j}」：${p.oneLiner}`).toBe(false)
      }
      // 一句话不直接用 宜/忌/凶/吉 下断语
      for (const ch of ['宜', '忌', '凶', '吉']) {
        expect(p.oneLiner.includes(ch), `oneLiner 含「${ch}」：${p.oneLiner}`).toBe(false)
      }
      // 所有面向用户的理由文案也不含硬性承诺词
      for (const reason of p.reasons) {
        expect(findHardBanned(reason.explanation)).toEqual([])
      }
    })
  }

  it('用克体不再出现「用卦克体卦，外在压力较大」', () => {
    const rw = interpretMeihuaRealWorld('眼下压力很大怎么办', '事业工作', controlsBMeihua(), bad())
    const userFacing = [
      rw.headline, rw.currentSituation,
      ...rw.howToAct, ...rw.watchOutFor,
      ...Object.values(rw.why).flatMap((v) => (Array.isArray(v) ? v : v ? [v] : []))
    ].join('\n')
    expect(userFacing).not.toContain('用卦克体卦')
    expect(userFacing).not.toContain('外在压力较大')
    expect(userFacing).not.toContain('制约因素较多')
    expect(findHardBanned(userFacing)).toEqual([])
  })

  it('现实白话各用户可见字段不含承诺词', () => {
    for (const cc of [cases[0], cases[2], cases[3]]) {
      const rw = interpretMeihuaRealWorld(cc.q, cc.c, cc.m, cc.r)
      const texts = [rw.headline, rw.currentSituation, ...rw.howToAct, ...rw.watchOutFor]
      for (const t of texts) {
        expect(t.trim().length, '存在空文案').toBeGreaterThan(0)
        expect(findHardBanned(t), `「${t}」含禁词`).toEqual([])
      }
    }
  })

  it('六爻一句话同样无术语串 / 承诺词', () => {
    const { liuyao, monthBranch, dayGanzhi } = liuyaoCase()
    const r = buildRating([{ id: 'e1', title: '用神旺相', delta: 8, reason: '用神得助', sourceRule: 'usefulGod' }])
    const p = interpretLiuyaoPlain('我该不该做这个项目', '事业工作', liuyao, r, monthBranch, dayGanzhi)
    expect(p.oneLiner.length).toBeGreaterThan(0)
    expect(findHardBanned(p.oneLiner)).toEqual([])
    for (const j of JARGON_IN_ONE_LINER) {
      expect(p.oneLiner.includes(j), `oneLiner 出现「${j}」`).toBe(false)
    }
    const rw = interpretLiuyaoRealWorld('我该不该做这个项目', '事业工作', liuyao, r, monthBranch, dayGanzhi)
    expect(findHardBanned(`${rw.headline}${rw.currentSituation}${rw.howToAct.join('')}${rw.watchOutFor.join('')}`)).toEqual([])
  })
})

describe('确定性 / 纯本地', () => {
  it('同一输入，plain 与 realWorld 多次调用深相等', () => {
    const m = controlsBMeihua()
    const r = bad()
    const p1 = JSON.stringify(interpretMeihuaPlain('x', '事业工作', m, r))
    const p2 = JSON.stringify(interpretMeihuaPlain('x', '事业工作', m, r))
    expect(p1).toBe(p2)
    const w1 = JSON.stringify(interpretMeihuaRealWorld('x', '事业工作', m, r))
    const w2 = JSON.stringify(interpretMeihuaRealWorld('x', '事业工作', m, r))
    expect(w1).toBe(w2)
  })

  it('六爻同一输入深相等', () => {
    const { liuyao, monthBranch, dayGanzhi } = liuyaoCase()
    const r = good()
    const a = JSON.stringify(interpretLiuyaoPlain('x', '日常综合', liuyao, r, monthBranch, dayGanzhi))
    const b = JSON.stringify(interpretLiuyaoPlain('x', '日常综合', liuyao, r, monthBranch, dayGanzhi))
    expect(a).toBe(b)
  })

  it('普通用户解释数据层源码不含 Math.random / fetch / 网络调用', () => {
    const dir = resolve(ROOT, 'src/local-data/plainInterpretation')
    const files = readdirSync(dir).filter((f) => f.endsWith('.ts'))
    for (const f of files) {
      const src = readFileSync(resolve(dir, f), 'utf-8')
      expect(src.includes('Math.random'), `${f} 含 Math.random`).toBe(false)
      expect(/\bfetch\s*\(/.test(src), `${f} 含 fetch`).toBe(false)
      expect(src.includes('XMLHttpRequest'), `${f} 含 XHR`).toBe(false)
    }
  })
})
