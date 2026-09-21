/**
 * 数据校验脚本：tsx scripts/validate-data.ts
 * 校验范围：
 *  - 八卦/64卦/八宫/纳甲/世应等静态结构
 *  - 64 卦知识（LocalHexagramKnowledge）：卦辞/彖传/大象传/来源/现代白话
 *  - 384 爻：爻辞/小象传/themeKeyword 全部非空
 *  - 古籍表：TUAN_MAP / DA_XIANG_MAP / XIAO_XIANG_MAP / SOURCE_REFS 齐全
 *
 * 注意：大 JSON 文件用 fs.readFileSync + JSON.parse 直接读取，
 * 不走 tsx/esbuild 的 import 转换（~300KB JSON 会导致 tsx 挂起）。
 */
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { HEXAGRAMS } from '../src/data/hexagrams'
import { TRIGRAMS } from '../src/data/trigrams'
import { PALACE_ELEMENT } from '../src/data/palaces'
import { TUAN_MAP } from '../src/local-data/classics/tuan'
import { DA_XIANG_MAP } from '../src/local-data/classics/daxiang'
import { XIAO_XIANG_MAP } from '../src/local-data/classics/xiaoxiang'
import { SOURCE_REFS } from '../src/local-data/classics/sources'
import {
  PLAIN_HEXAGRAMS,
  TERM_GLOSSARY,
  getTermPlain,
  BODY_USE_PLAIN,
  FRIENDLY_THEMES,
  WHEEL_SECTORS
} from '../src/local-data/plainInterpretation'
import type { LocalHexagramKnowledge } from '../src/local-data/types'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = resolve(__dirname, '..', 'src', 'local-data', 'interpretation')

function loadJson<T>(filename: string): T {
  const raw = readFileSync(resolve(DATA_DIR, filename), 'utf-8')
  return JSON.parse(raw) as T
}

const HEXAGRAM_MEANINGS = loadJson<Record<number, LocalHexagramKnowledge>>('hexagramMeanings.json')
const HEXAGRAM_MEANINGS_PART2 = loadJson<Record<number, LocalHexagramKnowledge>>('hexagramMeaningsPart2.json')

let errors = 0
function check(cond: boolean, msg: string) {
  if (!cond) { console.error('✗', msg); errors++ }
}

// ---------- 1. 既有结构校验：八卦/64卦/宫/世应 ----------
check(Object.keys(TRIGRAMS).length === 8, '八卦应为8个')
check(HEXAGRAMS.length === 64, `六十四卦应为64个，实际 ${HEXAGRAMS.length}`)

const nameSet = new Set(HEXAGRAMS.map((h) => h.name))
check(nameSet.size === 64, '卦名应唯一')

const lineSet = new Set(HEXAGRAMS.map((h) => h.lines.join('')))
check(lineSet.size === 64, '六爻编码应唯一')

for (const h of HEXAGRAMS) {
  check(h.kingWen >= 1 && h.kingWen <= 64, `${h.name} 序号越界`)
  check(h.lines.length === 6, `${h.name} 爻数应为6`)
  check(h.shiLine >= 1 && h.shiLine <= 6, `${h.name} 世爻越界`)
  check(h.yingLine >= 1 && h.yingLine <= 6, `${h.name} 应爻越界`)
  check(PALACE_ELEMENT[h.palace] !== undefined, `${h.name} 宫无效`)
  check(h.lineTextsClassic.length === 6, `${h.name} 爻辞应为6条`)
}

// ---------- 2. 本地卦象知识合并 ----------
const ALL: Record<number, LocalHexagramKnowledge> = {
  ...HEXAGRAM_MEANINGS,
  ...HEXAGRAM_MEANINGS_PART2
}
check(Object.keys(ALL).length === 64, `本地卦象知识应为64卦，实际 ${Object.keys(ALL).length}`)

let lineCount = 0
let themeKeywordCount = 0
let emptyTheme = 0

for (let kw = 1; kw <= 64; kw++) {
  const k = ALL[kw]
  check(!!k, `第${kw}卦知识缺失`)
  if (!k) continue
  check(k.kingWen === kw, `第${kw}卦 kingWen 字段不一致：${k.kingWen}`)

  // 古籍原文层
  check(k.classic.judgment.trim().length > 0, `第${kw}卦（${k.name}）卦辞(judgment)为空`)
  check(k.classic.tuan.trim().length > 0, `第${kw}卦（${k.name}）彖传(tuan)为空`)
  check(k.classic.daXiang.trim().length > 0, `第${kw}卦（${k.name}）大象传(daXiang)为空`)
  check(Array.isArray(k.classic.sourceRefs) && k.classic.sourceRefs.length >= 1,
    `第${kw}卦（${k.name}）sourceRefs 至少1个来源`)

  // 现代白话层
  check(k.localMeaning.plainJudgment.trim().length > 0, `第${kw}卦（${k.name}）plainJudgment 为空`)
  check(k.localMeaning.plainTuan.trim().length > 0, `第${kw}卦（${k.name}）plainTuan 为空`)
  check(k.localMeaning.plainDaXiang.trim().length > 0, `第${kw}卦（${k.name}）plainDaXiang 为空`)

  // 六爻
  check(k.lines.length === 6, `第${kw}卦（${k.name}）爻数应为6，实际 ${k.lines.length}`)
  for (let i = 0; i < k.lines.length; i++) {
    const ln = k.lines[i]
    check(ln.index === (i + 1), `第${kw}卦第${i + 1}爻 index 应为 ${i + 1}，实际 ${ln.index}`)
    check(ln.classicText.trim().length > 0, `第${kw}卦第${i + 1}爻 classicText 为空`)
    check(ln.xiaoXiang.trim().length > 0, `第${kw}卦第${i + 1}爻 xiaoXiang 为空`)
    check(ln.plainText.trim().length > 0, `第${kw}卦第${i + 1}爻 plainText 为空`)
    check(ln.plainXiaoXiang.trim().length > 0, `第${kw}卦第${i + 1}爻 plainXiaoXiang 为空`)
    check(ln.coreMeaning.trim().length > 0, `第${kw}卦第${i + 1}爻 coreMeaning 为空`)
    if (ln.themeKeyword && ln.themeKeyword.trim().length > 0) {
      themeKeywordCount++
    } else {
      emptyTheme++
      check(false, `第${kw}卦第${i + 1}爻 themeKeyword 为空`)
    }
    lineCount++
  }
}

check(lineCount === 384, `爻总数应为384，实际 ${lineCount}`)
check(emptyTheme === 0, `themeKeyword 有 ${emptyTheme} 条为空`)
check(themeKeywordCount === 384, `themeKeyword 非空应384，实际 ${themeKeywordCount}`)

// ---------- 3. 古籍表校验 ----------
check(Object.keys(TUAN_MAP).length === 64, `TUAN_MAP 应为64条彖传，实际 ${Object.keys(TUAN_MAP).length}`)
check(Object.keys(DA_XIANG_MAP).length === 64, `DA_XIANG_MAP 应为64条大象传，实际 ${Object.keys(DA_XIANG_MAP).length}`)
check(Object.keys(XIAO_XIANG_MAP).length === 64, `XIAO_XIANG_MAP 应为64卦，实际 ${Object.keys(XIAO_XIANG_MAP).length}`)
check(Object.keys(SOURCE_REFS).length === 64, `SOURCE_REFS 应为64条来源，实际 ${Object.keys(SOURCE_REFS).length}`)

for (let kw = 1; kw <= 64; kw++) {
  check((TUAN_MAP[kw] || '').trim().length > 0, `TUAN_MAP 第${kw}卦为空`)
  check((DA_XIANG_MAP[kw] || '').trim().length > 0, `DA_XIANG_MAP 第${kw}卦为空`)
  const xx = XIAO_XIANG_MAP[kw]
  check(Array.isArray(xx) && xx.length === 6, `XIAO_XIANG_MAP 第${kw}卦应6条，实际 ${Array.isArray(xx) ? xx.length : '缺失'}`)
  if (Array.isArray(xx)) {
    for (let i = 0; i < xx.length; i++) {
      check((xx[i] || '').trim().length > 0, `XIAO_XIANG_MAP 第${kw}卦第${i + 1}爻为空`)
    }
  }
  check(Array.isArray(SOURCE_REFS[kw]) && SOURCE_REFS[kw].length >= 1, `SOURCE_REFS 第${kw}卦至少1个来源`)
}

// 小象传总数
let xiaoXiangTotal = 0
for (const arr of Object.values(XIAO_XIANG_MAP)) xiaoXiangTotal += arr.length
check(xiaoXiangTotal === 384, `小象传总数应384，实际 ${xiaoXiangTotal}`)

// ---------- 4. v4.3 长辈友好数据校验 ----------
const ELDER_FILES = [
  'elderFriendly_01_08.json',
  'elderFriendly_09_16.json',
  'elderFriendly_17_24.json',
  'elderFriendly_25_32.json',
  'elderFriendly_33_40.json',
  'elderFriendly_41_48.json',
  'elderFriendly_49_56.json',
  'elderFriendly_57_64.json'
]

interface ElderLineEntry {
  elderFriendlyMeaning: string
  realLifeAction: string
  realLifeCaution?: string
}
interface ElderHexEntry {
  elderFriendlySummary: string
  realLifeNow: string
  realLifeProcess: string
  realLifeLater: string
  commonMisunderstanding?: string
  lines: ElderLineEntry[]
}

const ALL_ELDER: Record<number, ElderHexEntry> = {}
for (const fname of ELDER_FILES) {
  const batch = loadJson<Record<number, ElderHexEntry>>(fname)
  Object.assign(ALL_ELDER, batch)
}

check(Object.keys(ALL_ELDER).length === 64, `长辈友好数据应覆盖64卦，实际 ${Object.keys(ALL_ELDER).length}`)

let elderHexCount = 0
let elderLineCount = 0
let forbiddenHits = 0
const FORBIDDEN = ['一定', '必然', '百分之百', '百分百', '命中注定', '必死', '会死亡', '某年重病', '你会死亡', '某年去世', '某年必患重病', '寿命到这里']

function scanForbidden(text: string, field: string): void {
  for (const word of FORBIDDEN) {
    if (text.includes(word)) {
      console.error(`✗ 禁词「${word}」出现在 ${field}`)
      forbiddenHits++
    }
  }
}

for (let kw = 1; kw <= 64; kw++) {
  const e = ALL_ELDER[kw]
  check(!!e, `第${kw}卦长辈友好数据缺失`)
  if (!e) continue

  check(e.elderFriendlySummary && e.elderFriendlySummary.trim().length > 0, `第${kw}卦 elderFriendlySummary 为空`)
  check(e.realLifeNow && e.realLifeNow.trim().length > 0, `第${kw}卦 realLifeNow 为空`)
  check(e.realLifeProcess && e.realLifeProcess.trim().length > 0, `第${kw}卦 realLifeProcess 为空`)
  check(e.realLifeLater && e.realLifeLater.trim().length > 0, `第${kw}卦 realLifeLater 为空`)

  if (e.elderFriendlySummary) {
    const len = e.elderFriendlySummary.replace(/\s/g, '').length
    check(len >= 20 && len <= 200, `第${kw}卦 elderFriendlySummary 字数异常：${len}`)
    scanForbidden(e.elderFriendlySummary, `第${kw}卦.elderFriendlySummary`)
  }
  if (e.realLifeNow) scanForbidden(e.realLifeNow, `第${kw}卦.realLifeNow`)
  if (e.realLifeProcess) scanForbidden(e.realLifeProcess, `第${kw}卦.realLifeProcess`)
  if (e.realLifeLater) scanForbidden(e.realLifeLater, `第${kw}卦.realLifeLater`)
  if (e.commonMisunderstanding) scanForbidden(e.commonMisunderstanding, `第${kw}卦.commonMisunderstanding`)

  elderHexCount++

  check(Array.isArray(e.lines) && e.lines.length === 6, `第${kw}卦长辈友好爻数应为6，实际 ${e.lines?.length}`)
  if (!Array.isArray(e.lines)) continue

  for (let i = 0; i < e.lines.length; i++) {
    const ln = e.lines[i]
    check(ln.elderFriendlyMeaning && ln.elderFriendlyMeaning.trim().length > 0, `第${kw}卦第${i + 1}爻 elderFriendlyMeaning 为空`)
    check(ln.realLifeAction && ln.realLifeAction.trim().length > 0, `第${kw}卦第${i + 1}爻 realLifeAction 为空`)

    if (ln.elderFriendlyMeaning) scanForbidden(ln.elderFriendlyMeaning, `第${kw}卦第${i + 1}爻.elderFriendlyMeaning`)
    if (ln.realLifeAction) scanForbidden(ln.realLifeAction, `第${kw}卦第${i + 1}爻.realLifeAction`)
    if (ln.realLifeCaution) scanForbidden(ln.realLifeCaution, `第${kw}卦第${i + 1}爻.realLifeCaution`)

    elderLineCount++
  }
}

check(elderHexCount === 64, `长辈友好卦级数据应64卦，实际 ${elderHexCount}`)
check(elderLineCount === 384, `长辈友好爻级数据应384爻，实际 ${elderLineCount}`)
check(forbiddenHits === 0, `长辈友好数据中有 ${forbiddenHits} 处禁词`)

// ---------- 5. 普通用户解释层（plainInterpretation）校验 ----------
const PLAIN_BANNED = ['命中注定', '百分百', '发财', '死亡预测']
function scanPlain(text: string, field: string) {
  for (const w of PLAIN_BANNED) {
    if (text.includes(w)) { console.error(`✗ 白话层禁词「${w}」出现在 ${field}`); errors++ }
  }
  // 「一定 / 必然」只接受否定语境
  if (/(^|[^不未])一定/.test(text)) { console.error(`✗ 白话层出现肯定式「一定」：${field}`); errors++ }
  if (/(^|[^不未])必然/.test(text)) { console.error(`✗ 白话层出现肯定式「必然」：${field}`); errors++ }
}

check(Object.keys(PLAIN_HEXAGRAMS).length === 64, `普通用户卦解释应64卦，实际 ${Object.keys(PLAIN_HEXAGRAMS).length}`)
for (let kw = 1; kw <= 64; kw++) {
  const p = PLAIN_HEXAGRAMS[kw]
  check(!!p, `普通用户解释第${kw}卦缺失`)
  if (!p) continue
  check(p.name.trim().length > 0, `第${kw}卦白话 name 为空`)
  check(p.simple.trim().length > 5, `第${kw}卦（${p.name}）simple 过短`)
  check(p.action.trim().length > 3, `第${kw}卦（${p.name}）action 过短`)
  scanPlain(`${p.simple}${p.action}${p.elder ?? ''}`, `第${kw}卦（${p.name}）白话`)
  for (const ch of ['宜', '忌', '凶', '吉']) {
    check(!`${p.simple}${p.action}`.includes(ch), `第${kw}卦（${p.name}）白话仍用「${ch}」下断语`)
  }
}

const REQUIRED_TERMS = ['本卦', '动爻', '互卦', '变卦', '体用', '世应', '用神', '六亲', '六神',
  '五行', '八字', '四柱', '天干地支', '纳音', '十神', '起运', '大运', '流年',
  '八宫', '游魂', '归魂', '十六变', '梅花易数', '六爻纳甲']
for (const t of REQUIRED_TERMS) {
  const info = getTermPlain(t)
  check(!!info, `术语「${t}」缺少小白解释`)
  if (info) {
    check(info.simple.trim().length > 3, `术语「${t}」simple 过短`)
    check(info.elder.trim().length > 3, `术语「${t}」elder 过短`)
    scanPlain(`${info.simple}${info.elder}`, `术语「${t}」`)
  }
}
check(TERM_GLOSSARY.length >= REQUIRED_TERMS.length, `术语表条目不足：${TERM_GLOSSARY.length}`)

for (const key of ['same', 'generatesB', 'controlsA', 'generatesA', 'controlsB'] as const) {
  const b = BODY_USE_PLAIN[key]
  check(!!b && b.simple.length > 3 && b.elder.length > 3, `体用关系 ${key} 白话不完整`)
  if (b) scanPlain(`${b.simple}${b.elder}${b.action}`, `体用关系 ${key}`)
}
check(FRIENDLY_THEMES.length >= 5, `主题卡至少5张，实际 ${FRIENDLY_THEMES.length}`)
check(WHEEL_SECTORS.length >= 6, `灵感转盘至少6区，实际 ${WHEEL_SECTORS.length}`)

// ---------- 结果 ----------
if (errors === 0) {
  console.log('✓ 数据校验通过：64卦结构、64卦辞/彖/大象、384爻辞/小象、384 themeKeyword、来源均一致。')
  console.log(`✓ v4.3 长辈友好数据：64卦卦级 + 384爻爻级全部非空，禁词检查通过。`)
  console.log(`✓ 普通用户解释层：64卦白话、${REQUIRED_TERMS.length}个必备术语、5种体用关系、主题卡/转盘齐全，禁词检查通过。`)
  process.exit(0)
} else {
  console.error(`校验失败：${errors} 处错误`)
  process.exit(1)
}
