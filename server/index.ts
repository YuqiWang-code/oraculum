import 'dotenv/config'
import express from 'express'
import rateLimit from 'express-rate-limit'
import path from 'node:path'
import fs from 'node:fs'
import { isConfigured, getModel } from './openaiClient'
import { sanitizeRecord } from './ai/sanitizeRecord'
import { runInterpret, runFollowUp } from './ai/interpret'
import { moderate } from './ai/moderation'
import { requireToken } from './middleware/auth'
import { errorHandler, SAFETY_BLOCK } from './middleware/errorHandler'
import type { AiChatMessage } from '../src/types/ai'

const app = express()
const PORT = Number(process.env.PORT || 8787)

app.use(express.json({ limit: '200kb' }))

// 每 IP 10 分钟最多 20 次 AI 请求
const aiLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false })

app.get('/api/ai/health', (_req, res) => {
  if (!isConfigured()) return res.json({ enabled: false })
  res.json({ enabled: true, model: getModel() })
})

app.post('/api/ai/interpret', aiLimiter, requireToken, async (req, res) => {
  if (!isConfigured()) return res.status(503).json({ ok: false, code: 'NOT_CONFIGURED', message: 'AI service is not configured' })
  try {
    const snapshot = sanitizeRecord(req.body?.record)
    const result = await runInterpret(snapshot)
    res.json({ ok: true, result, model: getModel() })
  } catch (e) {
    console.error(e)
    res.status(502).json({ ok: false, code: 'AI_ERROR', message: 'AI 请求失败' })
  }
})

app.post('/api/ai/follow-up', aiLimiter, requireToken, async (req, res) => {
  if (!isConfigured()) return res.status(503).json({ ok: false, code: 'NOT_CONFIGURED', message: 'AI service is not configured' })
  const { record, messages, question } = req.body || {}
  if (typeof question !== 'string' || question.length === 0) {
    return res.status(400).json({ ok: false, code: 'BAD_REQUEST', message: '缺少追问内容' })
  }
  if (question.length > 2000) {
    return res.status(400).json({ ok: false, code: 'TOO_LONG', message: '追问过长（上限 2000 字）' })
  }
  const trimmed: AiChatMessage[] = Array.isArray(messages) ? messages.slice(-6) : []
  // 输入 moderation
  const mod = await moderate(question)
  if (!mod.ok) return res.status(200).json(SAFETY_BLOCK)
  try {
    const snapshot = sanitizeRecord(record)
    const result = await runFollowUp(snapshot, trimmed, question)
    res.json({ ok: true, result, model: getModel() })
  } catch (e) {
    console.error(e)
    res.status(502).json({ ok: false, code: 'AI_ERROR', message: 'AI 请求失败' })
  }
})

// 生产：提供 dist 静态文件 + SPA fallback
const dist = path.join(process.cwd(), 'dist')
if (fs.existsSync(dist)) {
  app.use(express.static(dist))
  app.get(/^\/(?!api).*/, (_req, res) => {
    res.sendFile(path.join(dist, 'index.html'))
  })
}

app.use(errorHandler)

if (require.main === module) {
  app.listen(PORT, () => console.log(`Oraculum server on http://localhost:${PORT}`))
}

export { app }
