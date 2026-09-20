/**
 * 隐私审计脚本：tsx scripts/audit-local-only.ts
 * 扫描 src/ 业务代码，禁止引入远程 DB SDK：
 *   Firebase / @firebase / Supabase / @supabase / Cloudflare D1 / KV 等。
 * 不禁止浏览器加载静态资源所需的正常网络（CDN 字体、PWA service worker 等），
 * 因为这些不构成业务层远程数据库连接。
 *
 * 用法：npm run audit:privacy
 * 退出码：0 通过；1 发现违规。
 */
import { readFileSync, readdirSync, statSync } from 'fs'
import { resolve, dirname, extname, relative } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC = resolve(__dirname, '..', 'src')

// 禁止出现在 import / require 路径中的远程 DB SDK 关键词
const FORBIDDEN: RegExp[] = [
  /['"][^'"]*firebase[^'"]*/i,
  /['"][^'"]*supabase[^'"]*/i,
  /['"][^'"]*@cloudflare[^'"]*/i,
  /['"][^'"]*cloudflare[_/-]workers[^'"]*/i,
  /['"][^'"]*['"]d1['"]/i,
  /['"][^'"]*['"]kv['"]/i
]

interface Violation {
  file: string
  line: number
  text: string
}

function walk(dir: string): string[] {
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    const p = resolve(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) out.push(...walk(p))
    else if (['.ts', '.vue'].includes(extname(name))) out.push(p)
  }
  return out
}

function audit(): Violation[] {
  const violations: Violation[] = []
  for (const file of walk(SRC)) {
    const content = readFileSync(file, 'utf8')
    content.split(/\r?\n/).forEach((text, idx) => {
      // 只检查 import / export-from / require 行
      if (!/^\s*(import|export)\b.*(from\s+)?['"]|require\s*\(/.test(text)) return
      if (FORBIDDEN.some((re) => re.test(text))) {
        violations.push({ file, line: idx + 1, text: text.trim() })
      }
    })
  }
  return violations
}

const violations = audit()
if (violations.length === 0) {
  console.log('[audit:privacy] 通过：src/ 未发现远程 DB SDK（firebase/supabase/cloudflare d1/kv）导入。')
  process.exit(0)
} else {
  console.error(`[audit:privacy] 失败：发现 ${violations.length} 处违规：`)
  for (const v of violations) {
    console.error(`  ${relative(process.cwd(), v.file)}:${v.line}  ${v.text}`)
  }
  process.exit(1)
}
