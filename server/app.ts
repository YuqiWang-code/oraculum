import 'dotenv/config'
import express from 'express'
import rateLimit from 'express-rate-limit'
import path from 'node:path'
import fs from 'node:fs'
import { isConfigured, getModel, getProviderInfo } from './openaiClient.js'
import { sanitizeRecord } from './ai/sanitizeRecord.js'
import { runInterpret, runFollowUp } from './ai/interpret.js'
import { moderate } from './ai/moderation.js'
import { requireToken } from './middleware/auth.js'
import { errorHandler, SAFETY_BLOCK } from './middleware/errorHandler.js'
import { InterpretRequestSchema, FollowUpRequestSchema } from './ai/schema.js'

/**
 * v3.1: 拆分 app 与 start。
 * app.ts 只创建并 export Express app，不 listen。
 * start.ts 才 listen，便于测试 import app 不占端口。
 */

export function createApp(): express.Express {
  const app = express()

  app.use(express.json({ limit: '200kb' }))

  // 每 IP 10 分钟最多 20 次 AI 请求
  const aiLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false })

  app.get('/api/ai/health', (_req, res) => {
    if (!isConfigured()) return res.json({ enabled: false, provider: 'none' })
    const info = getProviderInfo()
    res.json({
      enabled: true,
      provider: info.provider,
      model: info.model,
      apiMode: info.apiMode,
      structuredOutputMode: info.structuredOutputMode
    })
  })

  app.get('/api/ai/auth-check', requireToken, (_req, res) => {
    res.json({ ok: true, message: '口令正确' })
  })

  app.post('/api/ai/interpret', aiLimiter, requireToken, async (req, res) => {
    if (!isConfigured()) return res.status(503).json({ ok: false, code: 'NOT_CONFIGURED', message: 'AI service is not configured' })
    try {
      const parsed = InterpretRequestSchema.safeParse(req.body)
      if (!parsed.success) return res.status(400).json({ ok: false, code: 'BAD_REQUEST', message: '请求格式不正确' })
      const snapshot = sanitizeRecord(parsed.data.record as Record<string, unknown>)
      // v3.1: 首次解读也做 moderation
      const questionText = String(snapshot.question || '')
      const mod = await moderate(questionText)
      if (!mod.ok) return res.status(200).json(SAFETY_BLOCK)
      const result = await runInterpret(snapshot)
      res.json({ ok: true, result: result.result, model: result.model, usage: result.usage })
    } catch (e) {
      console.error(e)
      res.status(502).json({ ok: false, code: 'AI_ERROR', message: 'AI 请求失败' })
    }
  })

  app.post('/api/ai/follow-up', aiLimiter, requireToken, async (req, res) => {
    if (!isConfigured()) return res.status(503).json({ ok: false, code: 'NOT_CONFIGURED', message: 'AI service is not configured' })
    try {
      const parsed = FollowUpRequestSchema.safeParse(req.body)
      if (!parsed.success) return res.status(400).json({ ok: false, code: 'BAD_REQUEST', message: '请求格式不正确' })
      const { record, messages } = parsed.data
      // messages 最后一条即用户问题（v3.1 不再单独传 question，避免重复）
      const lastUserMsg = messages[messages.length - 1]
      const mod = await moderate(lastUserMsg.content)
      if (!mod.ok) return res.status(200).json(SAFETY_BLOCK)
      const snapshot = sanitizeRecord(record as Record<string, unknown>)
      const result = await runFollowUp(snapshot, messages)
      res.json({ ok: true, result: result.result, model: result.model, usage: result.usage })
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
  return app
}
