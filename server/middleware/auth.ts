import type { Request, Response, NextFunction } from 'express'

/** 校验 AI 访问口令（不是 OpenAI key）；未配置 AI_ACCESS_TOKEN 时不强制 */
export function requireToken(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.AI_ACCESS_TOKEN
  if (!expected || expected === 'CHANGE_ME_TO_A_PRIVATE_TOKEN') {
    // 未设置私人口令则放行（仅本机/内网场景）
    return next()
  }
  const got = req.header('x-oraculum-token')
  if (got !== expected) {
    return res.status(401).json({ ok: false, code: 'UNAUTHORIZED', message: 'AI 访问口令不正确' })
  }
  next()
}
