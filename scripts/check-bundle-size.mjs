// bundle:check —— 构建后输出各 chunk 大小，并按预算 console.warn 超预算（不使 build 失败）。
// 用法：先 npm run build，再 node scripts/check-bundle-size.mjs
// 读取 dist/assets/*.js（必要时回退 dist-verify/assets）。
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs'
import { join, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

// 定位 assets 目录
const candidates = [
  join(root, 'dist/assets'),
  join(root, 'dist-verify/assets')
]
const assetsDir = candidates.find((p) => existsSync(p))
if (!assetsDir) {
  console.error('未找到 dist/assets，请先运行 npm run build')
  process.exit(1)
}

/** 预算（KB，gzip 后）。超过则 console.warn。 */
const BUDGETS = {
  mainEntry: 110, // 主入口 + 主 chunk 合计
  lunar: 140, // lunar-javascript
  localData: 90, // 卦象完整知识
  routeFortune: 20,
  routeKnowledge: 30,
  routeResult: 15,
  elderChunkEach: 13,
  totalJs: 450
}

function kb(bytes) {
  return +(bytes / 1024).toFixed(1)
}

function sizeInfo(file) {
  const raw = statSync(join(assetsDir, file)).size
  const gz = gzipSync(readFileSync(join(assetsDir, file))).length
  return { file, raw, gz }
}

const files = readdirSync(assetsDir).filter((f) => f.endsWith('.js')).sort()
const all = files.map(sizeInfo)

const elderChunks = all.filter((f) => f.file.startsWith('elderFriendly_'))
const fortuneRoute = all.filter((f) => f.file.startsWith('FortuneView'))
const knowledgeRoute = all.filter((f) => f.file.startsWith('KnowledgeView'))
const resultRoute = all.filter((f) => f.file.startsWith('ResultView'))
const divinationRoute = all.filter((f) => f.file.startsWith('DivinationView'))
// index-*.js：主入口/main/lunar/local-data
const indexChunks = all.filter((f) => f.file.startsWith('index-'))

function sum(arr, key) {
  return +arr.reduce((a, b) => a + b[key], 0).toFixed(0)
}

const warnings = []
function check(label, gzKb, budgetKb) {
  const status = gzKb > budgetKb ? 'OVER' : 'ok'
  if (gzKb > budgetKb) warnings.push(`${label} 超预算：${gzKb}KB > ${budgetKb}KB`)
  return status
}

console.log('=== Bundle Size Report (gzip) ===')
console.log('')

// 主 index chunks
console.log('[index chunks]')
for (const c of indexChunks.sort((a, b) => b.gz - a.gz)) {
  console.log(`  ${c.file.padEnd(34)} ${kb(c.raw)} KB raw / ${kb(c.gz)} KB gz`)
}

console.log('')
console.log('[route chunks]')
for (const group of [
  ['fortune', fortuneRoute, BUDGETS.routeFortune],
  ['knowledge', knowledgeRoute, BUDGETS.routeKnowledge],
  ['result', resultRoute, BUDGETS.routeResult],
  ['divination', divinationRoute, null]
]) {
  const [label, arr, budget] = group
  for (const c of arr) {
    const s = budget ? check(label, kb(c.gz), budget) : '-'
    console.log(`  ${label.padEnd(11)} ${c.file.padEnd(34)} ${kb(c.raw)} KB raw / ${kb(c.gz)} KB gz  [${s}]`)
  }
}

console.log('')
console.log('[elderFriendly dynamic chunks (on-demand)]')
let elderTotal = 0
for (const c of elderChunks) {
  elderTotal += c.gz
  const s = check('elderEach', kb(c.gz), BUDGETS.elderChunkEach)
  console.log(`  ${c.file.padEnd(34)} ${kb(c.raw)} KB raw / ${kb(c.gz)} KB gz  [${s}]`)
}
console.log(`  ${'elder合计'.padEnd(34)} ${kb(sum(elderChunks, 'raw'))} KB raw / ${kb(elderTotal)} KB gz`)

const totalGz = sum(all, 'gz')
console.log('')
console.log(`[total] ${all.length} js chunks, ${kb(sum(all, 'raw'))} KB raw / ${kb(totalGz)} KB gz  [${check('totalJs', kb(totalGz), BUDGETS.totalJs)}]`)

console.log('')
console.log('=== Budgets (gzip KB) ===')
console.log(`  mainEntry<=${BUDGETS.mainEntry}  lunar<=${BUDGETS.lunar}  localData<=${BUDGETS.localData}`)
console.log(`  fortune<=${BUDGETS.routeFortune}  knowledge<=${BUDGETS.routeKnowledge}  result<=${BUDGETS.routeResult}`)
console.log(`  elderEach<=${BUDGETS.elderChunkEach}  totalJs<=${BUDGETS.totalJs}`)

if (warnings.length) {
  console.warn('')
  console.warn(`⚠ bundle:check 超预算 ${warnings.length} 项：`)
  for (const w of warnings) console.warn('  - ' + w)
} else {
  console.log('')
  console.log('✓ 所有 chunk 均在预算内')
}
