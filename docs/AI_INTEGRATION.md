# AI 深度解读接入说明

## 架构

```
浏览器 / PWA
  │  POST /api/ai/*  (同源，经 Vite 代理到 8787)
  ▼
Express 后端 (server/index.ts)
  │  sanitize 记录 → zod 校验 → Responses API + Structured Outputs
  ▼
OpenAI Responses API (store:false)
```

## 端点

- `GET /api/ai/health` → `{enabled, model}`，不返回 key。
- `POST /api/ai/interpret` → 首次结构化解读。
- `POST /api/ai/follow-up` → 追问（最多 6 轮，单条 ≤2000 字）。

## 模型

`OPENAI_MODEL` 环境变量，默认 `gpt-5.6-terra`。换模型无需改代码。

## Structured Output

使用 `client.responses.parse()` + `zodTextFormat(AiInterpretationSchema, ...)`，返回固定 JSON（见 `server/ai/schema.ts`）。前端不解析自由 markdown。

## "什么时候"问题

AI 只给宽泛传统象意窗口（`timing.window`），`confidence=low`，不伪造具体日期。

## "可能性多高"问题

本地传统评分（`rec.rating.score`）单独展示为"传统规则倾向"，AI 另给"现实可行性"枚举（偏低/不确定/偏高等），不输出伪精确现实百分比。

## 缓存

AI 结果存入 Dexie `aiSessions`；重开历史直接读缓存，不重复调 API；仅"重新生成"才产生新用量。

## 不做什么

AI 不改卦象、不动爻、不改干支、不改本地评分 label。
