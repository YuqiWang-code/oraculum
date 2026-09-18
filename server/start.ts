import { createApp } from './app.js'
import { isConfigured, isPlaceholderSecret } from './openaiClient.js'

const PORT = Number(process.env.PORT || 8787)

// 生产环境且 AI 已配置时，要求 AI_ACCESS_TOKEN 不能是 placeholder
if (process.env.NODE_ENV === 'production' && isConfigured()) {
  const token = process.env.AI_ACCESS_TOKEN
  if (!token || isPlaceholderSecret(token)) {
    console.error('生产环境且 AI 已配置时，必须设置 AI_ACCESS_TOKEN（不能是 placeholder）')
    process.exit(1)
  }
}

const app = createApp()
app.listen(PORT, () => console.log(`Oraculum server on http://localhost:${PORT}`))
