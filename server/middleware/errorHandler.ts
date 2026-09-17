import type { Request, Response, NextFunction } from 'express'

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error('[ai] error:', err)
  res.status(500).json({ ok: false, code: 'INTERNAL', message: '服务暂时出错' })
}

export const SAFETY_BLOCK = {
  ok: false,
  code: 'CONTENT_SAFETY',
  message: '这个问题不适合用占卜或 AI 方式继续判断，请依据现实信息和可信帮助。'
}
