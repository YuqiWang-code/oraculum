# AI 安全与隐私

- API key 只存在后端 `process.env.OPENAI_API_KEY`，绝不进前端 bundle。
- 前端源码测试强制扫描：不含 `OPENAI_API_KEY`、不含 `api.openai.com`。
- 访问口令 `AI_ACCESS_TOKEN`：前端请求带 `X-Oraculum-Token`；这不是 OpenAI key。
- rate limit：每 IP 10 分钟 20 次；请求体 `express.json({ limit: '200kb' })`。
- follow-up：最多 6 轮、单条 ≤2000 字，超长直接 400。
- moderation：用 `omni-moderation-latest` 对追问输入做安全检查；命中返回 `CONTENT_SAFETY`。
- 数据最小化：`sanitizeRecord` 只发本次卦象必要字段，不发 alias、设备信息、全部历史。
- `store:false`，多轮由本地保存少量消息，不依赖 OpenAI 服务端记忆。
- `.env` 被 gitignore；仓库只提供 `.env.example` 占位符。
