# Oraculum / 智能推理与预测 —— OpenAI 大模型接入资料库 v3.0

> 项目仓库：`https://github.com/YuqiWang-code/oraculum`  
> 本地目录：`F:\豆包\Projects\智能推理与预测`  
> 建议放置：`F:\豆包\Projects\智能推理与预测\资料\Oraculum_OpenAI大模型接入资料库_v3.md`  
> 调研日期：2026-09-17

## 0. 本轮目标

在现有 Oraculum v2 基础上增加一个**可选 AI 深度解读层**。原来的八卦、六爻、历法、起卦、评分仍由本地 TypeScript 确定性规则引擎完成；OpenAI 大模型不参与决定卦象、动爻、干支或评分基础值。AI 只读取已经计算好的结构化结果，用于更自然的中文解释、复杂追问、多证据综合，以及对“什么时候”“可能性有多高”这类问题做带不确定性说明的解释。

## 1. 当前仓库状态

当前 GitHub 已经完成 v2：`RULESET_VERSION=2.0.0`，包含七种独立起卦方式、六源合参、`castingEvidence`、`castingRuleVersion`、`sixSource`、秒级时间、三枚钱真实六爻、随机数 / 骰子 / 文字 / 外应。关键文件包括：

```text
src/types/index.ts
src/engine/orchestrator.ts
src/views/DivinationView.vue
src/views/ResultView.vue
src/db/index.ts
src/db/schema.ts
src/components/casting/*
src/engine/casting/*
```

这些结构已经很适合增加 AI，因为本地结果已结构化。

## 2. API Key 安全

OpenAI 官方安全文档明确要求：不要把 API key 部署在浏览器端或手机 App/PWA 客户端，不要提交到 GitHub，请求应该经过自己的后端服务器。

正确结构：

```text
手机 / 浏览器
      │
      │ POST /api/ai/interpret
      ▼
Oraculum 自己的后端
      │
      │ OPENAI_API_KEY（仅服务端环境变量）
      ▼
OpenAI Responses API
```

任何曾经贴到聊天、截图、Issue、GitHub 或公开日志中的 API Key，都应该立即撤销并重新创建。项目只能提供：

```env
OPENAI_API_KEY=YOUR_NEW_KEY_HERE
OPENAI_MODEL=gpt-5.6-terra
AI_ACCESS_TOKEN=CHANGE_ME
```

真实 `.env` 不能提交。当前仓库 `.gitignore` 已经正确忽略 `.env` / `.env.*`，只允许 `.env.example`。

## 3. ChatGPT Plus 与 API 分开计费

ChatGPT Plus 不等于 API 免费额度。OpenAI 官方说明 ChatGPT 订阅和 API Platform 分开计费；API 需要在 API Platform 单独配置 billing，并按模型 / token 等用量计费。

建议为 Oraculum 单独创建一个 API Project、独立 API key、预算和 90% / 95% 支出提醒。

## 4. 推荐使用 Responses API

OpenAI 当前文档推荐新的文本生成应用使用 Responses API。Oraculum 更适合使用 Responses API + Structured Outputs + Zod，让返回结果是稳定 JSON，而不是难解析的自由文本。

典型服务端写法：

```ts
import OpenAI from "openai"
import { zodTextFormat } from "openai/helpers/zod"

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const response = await client.responses.parse({
  model: process.env.OPENAI_MODEL || "gpt-5.6-terra",
  store: false,
  input: [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: JSON.stringify(payload) }
  ],
  text: {
    format: zodTextFormat(AiInterpretationSchema, "oraculum_ai_interpretation")
  }
})

const result = response.output_parsed
```

## 5. 模型选择

模型名称必须通过环境变量配置，不能硬编码死。个人应用建议默认：

```env
OPENAI_MODEL=gpt-5.6-terra
```

它适合在智能和成本之间平衡。可把 `gpt-5.6-luna` 用于更便宜的快速模式，把 `gpt-5.6-sol` 或当时最新旗舰模型用于更复杂的深度分析。未来换模型无需改代码。

## 6. AI 在 Oraculum 里的角色

本地规则引擎继续负责：

```text
起卦
历法
八卦
本卦 / 互卦 / 变卦
动爻
体用
纳甲
六亲
六神
伏神
神煞
评分
castingEvidence
```

AI 负责：

```text
综合上述数据形成自然语言
理解复杂问题真正关心的维度
解释多条证据为何一致或冲突
回答继续追问
补充现实层面的可控因素分析
```

AI 禁止重新起卦、修改本卦 / 动爻 / 评分、伪造古籍规则、把传统评分说成统计概率、宣称未来必然发生。

## 7. 两层解释

AI 输出必须明确分为：

### A. 传统术数解读

读取问题、起卦方式、本/互/变卦、动爻、体用、六爻信息、干支节气、传统规则评分、`castingEvidence`，生成：

- 核心象意
- 有利因素
- 制约因素
- 变化趋势
- 使用了哪些证据

### B. 现实分析

明确说明卦象是传统文化解释，不是现实证据，再根据用户提供的实际信息分析当前进度、时间、资源、依赖条件、风险与可控因素。

## 8. “XXX 什么时候回家？”的处理

AI 可以把它识别为时间类问题，并读取卦象、动爻、变卦和当前时间，给出**宽泛的传统象意时间窗口**，例如“偏近期”“数日到数周”，并明确 `confidence=low`。

当前项目还没有完整确定性“应期”引擎，因此不能伪造具体准确日期，也不能说对方“一定”会回来。

推荐结构：

```json
{
  "timing": {
    "applicable": true,
    "window": "偏近期，可理解为数日到一两周内的象意",
    "confidence": "low",
    "basis": ["动爻位置", "变卦趋势"]
  }
}
```

## 9. “我完成这个任务的可能性有多高？”的处理

必须分开显示：

```text
传统规则倾向：例如 吉（68 / 100）
```

和：

```text
现实可行性：偏低 / 不确定 / 偏高 / 信息不足
```

现有 `rating.score` 只是 Oraculum 的传统规则评分，不能解释为现实“68% 成功率”。

若现实信息不足，AI 应追问：截止时间、当前进度、关键依赖、最大困难等。没有真实统计数据时，不输出“73%”一类伪精确概率。

## 10. Structured Output 建议

```ts
const AiInterpretationSchema = z.object({
  answer: z.string(),

  traditionalReading: z.object({
    summary: z.string(),
    favorable: z.array(z.string()),
    constraints: z.array(z.string()),
    trend: z.string(),
    evidenceUsed: z.array(z.string())
  }),

  timing: z.object({
    applicable: z.boolean(),
    window: z.string().nullable(),
    confidence: z.enum(["low", "medium", "not_applicable"]),
    basis: z.array(z.string())
  }),

  likelihood: z.object({
    applicable: z.boolean(),
    traditionalScore: z.number().min(0).max(100).nullable(),
    traditionalLabel: z.string().nullable(),
    realityFeasibility: z.enum([
      "low",
      "somewhat_low",
      "uncertain",
      "somewhat_high",
      "high",
      "insufficient_information",
      "not_applicable"
    ]),
    explanation: z.string()
  }),

  realityCheck: z.string(),
  actionSuggestions: z.array(z.string()),
  uncertainties: z.array(z.string()),
  disclaimer: z.string()
})
```

其中 `traditionalScore` 只能复制本地 `rating.score`，AI 无权改变。

## 11. 深度解读与继续追问

结果页新增：

```text
AI 深度解读
```

点击后只把本次必要结构发给后端。完成后显示 AI 综合结论、传统术数解读、时间倾向（如适用）、现实可行性（如适用）、现实核对、不确定因素和行动提示。

下面再增加“继续追问”，最多保存最近 4–6 轮，避免 token 无限增长。

## 12. 数据最小化

不要把整个 IndexedDB、全部历史或全部资料库发送给 OpenAI。只发送本次记录必要字段，例如：

```ts
interface AiDivinationSnapshot {
  question: string
  category: string

  casting: {
    ruleVersion?: string
    evidence?: unknown
  }

  calendar: {
    lunarDate: string
    yearGanzhi: string
    monthGanzhi: string
    dayGanzhi: string
    hourGanzhi: string
    solarTerm: string
  }

  hexagram?: {
    ben: string
    hu?: string
    bian?: string
    movingLine?: number
    ti?: string
    yong?: string
  }

  rating: {
    score: number
    label: string
    evidence: Array<{
      title: string
      delta: number
      reason: string
    }>
  }

  localInterpretation: {
    summary: string
    favorable: string[]
    constraints: string[]
    trend: string
  }
}
```

默认不要发送姓名 / alias、设备信息、无关设置或全部历史。

## 13. API 数据与隐私

OpenAI 当前说明：API Platform 的输入 / 输出默认不用于训练模型，除非组织主动 opt-in。

Responses API 支持 `store: false`，建议 Oraculum 使用它，且多轮对话由本地保存少量消息并重新发送，不依赖 OpenAI 服务端保存。

## 14. 内容安全

如果应用可能由未成年人使用，应增加年龄适当的提示、内容过滤和高风险问题处理。OpenAI 的 Under 18 API Guidance 也建议这样做。

Oraculum 中涉及医疗、法律、财务、人身安全等重要现实决定时，可以解释传统文化部分，但现实建议必须提醒用户依据事实、可信信息和专业帮助。

## 15. Moderation

OpenAI 提供 `omni-moderation-latest`。建议流程：

```text
用户追问
  ↓
moderation(input)
  ↓
AI interpret
  ↓
必要时 moderation(output)
  ↓
前端
```

Moderation 模型目前是免费模型。

## 16. 推荐后端架构

当前项目是纯 Vite PWA，没有后端。v3 增加：

```text
server/
├─ index.ts
├─ openaiClient.ts
├─ ai/
│  ├─ schema.ts
│  ├─ prompt.ts
│  ├─ sanitizeRecord.ts
│  ├─ interpret.ts
│  └─ moderation.ts
└─ middleware/
   ├─ auth.ts
   └─ errorHandler.ts
```

前端增加：

```text
src/services/ai.ts
src/types/ai.ts
src/components/ai/
├─ AiInterpretationCard.vue
└─ AiFollowUp.vue
```

## 17. 本地开发架构

```text
Vite 5173
  │
  │ /api proxy
  ▼
Node / Express 8787
  │
  ▼
OpenAI
```

`vite.config.ts` 中把 `/api` 代理到 `http://localhost:8787`。

## 18. 生产部署

生产时不能只把 `dist/` 放在纯静态托管，因为必须有地方安全保存 API key。

推荐一个 Node 服务同时：

- 提供 `/api/*`
- 提供构建后的 `dist/*`
- 给 Vue Router 做 index fallback

这样手机访问同一域名，AI 也走同源接口。

## 19. 个人访问口令

即使 OpenAI key 藏在后端，如果网站公开，别人仍然可以调用你的 `/api/ai/interpret` 消耗 API 费用。

建议服务器设置：

```env
AI_ACCESS_TOKEN=一段私人口令
```

前端请求只发送：

```http
X-Oraculum-Token: ...
```

这不是 OpenAI key。即使它泄露，也只需要换 Oraculum 口令，不需要把真正 OpenAI key 放进浏览器。

同时增加 rate limit、请求体大小限制、最大对话轮数和最大输出。

## 20. 成本控制

个人应用建议：

```text
默认模型：gpt-5.6-terra
reasoning effort：low / medium
最多最近 4–6 轮
不默认启用 web search
不发送整套资料库
Structured Output
缓存已经生成的 AI 解读
```

重新打开历史记录时优先显示缓存，只有点击“重新生成”才产生新的 API 费用。

## 21. AI 结果和传统结果分开存

不要覆盖 `rec.interpretation`。

推荐 Dexie v2：

```text
history
settings
aiSessions
```

```ts
interface AiSession {
  id: string
  recordId: string
  createdAt: string
  model: string
  promptVersion: string
  response: AiInterpretation
  messages: AiChatMessage[]
}
```

本地传统规则是确定性、可重现；AI 是概率生成、模型版本会变化，两者不应该混成一个字段。

## 22. 推荐 system prompt 核心

```text
你是 Oraculum 的“AI 深度解读层”，不是占卜引擎。

你只能解释输入中已经存在的卦象、历法、动爻、体用、
六爻结构、评分和证据。

禁止重新起卦、修改卦象、修改传统评分。

严格区分：
1. 传统术数解释；
2. 现实事实分析。

传统评分不是统计概率。

如果用户问“概率多少”，没有真实统计数据时，不输出虚假的精确百分比。

如果用户问“什么时候”，没有确定性 timing engine 的证据时，
只提供宽泛象意窗口并明确低确定性，不给伪精确日期。

不要使用“必然、一定、注定”等语言。

重要现实决定应依据事实、可信信息和专业意见。
```

## 23. 推荐 API

### GET `/api/ai/health`

```json
{
  "enabled": true,
  "model": "gpt-5.6-terra"
}
```

绝不返回 key。

### POST `/api/ai/interpret`

输入本次 `DivinationRecord`，服务端立即 sanitize。

### POST `/api/ai/follow-up`

输入本次 snapshot、最近几轮消息和当前追问，服务器限制最多 6 轮。

## 24. 错误处理

AI 不可用不能破坏 PWA。前端只显示：

```text
AI 深度解读暂时不可用。
你的本地确定性卦象和评分不受影响。
```

区分 401（AI 口令错误）、429（请求过多）、503（未配置 OpenAI key）、502（OpenAI 请求失败），但不要向前端回显 key、header 或底层敏感错误。

## 25. 测试要求

至少补：

1. 前端 bundle / source 不含 `OPENAI_API_KEY`
2. `.env` 被 gitignore
3. `/api/ai/health` 不返回 key
4. 无 key 时返回明确 503
5. 错 token 返回 401
6. rate limit 生效
7. sanitizeRecord 不发送全部历史
8. alias 默认不发给 AI
9. Structured Output schema 校验
10. AI 不能修改 local rating
11. AI 不能修改 hexagram
12. “可能性多少”不产生虚假现实精确概率
13. “什么时候”必须带 uncertainty
14. API 挂掉时 ResultView 仍可用
15. aiSessions migration 不破坏 history
16. AI 缓存不重复调用
17. follow-up 最大轮数
18. `npm run test`
19. `npm run validate`
20. `npm run build`

## 26. 官方资料

1. API Key Safety  
   https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety

2. Account Security / API Key  
   https://help.openai.com/en/articles/8304786

3. ChatGPT 与 API 分开计费  
   https://help.openai.com/en/articles/9039756

4. Responses API / Text Generation  
   https://developers.openai.com/api/docs/guides/text

5. Structured Outputs  
   https://developers.openai.com/api/docs/guides/structured-outputs

6. Models  
   https://developers.openai.com/api/docs/models

7. Pricing  
   https://developers.openai.com/api/docs/pricing

8. Moderation  
   https://developers.openai.com/api/docs/models/omni-moderation-latest

9. Under 18 API Guidance  
   https://developers.openai.com/api/docs/guides/safety-checks/under-18-api-guidance

10. API 数据默认不用于训练  
    https://help.openai.com/en/articles/5722486-how-your-data-is-used-to-improve-model-performance

11. Responses `store` 参数  
    https://developers.openai.com/api/reference/resources/responses/methods/create

## 27. 最终原则

```text
传统资料
  ↓
确定性起卦引擎
  ↓
确定性评分
  ↓
本地模板解释
  ↓
──────────────
可选 AI 深度解释
  ↓
复杂问题 / 追问 / 综合分析
```

四条硬规则：

> API key 永远不进前端。  
> AI 永远不改卦象与本地评分。  
> 传统倾向永远不冒充统计概率。  
> AI 失败时，本地 PWA 仍然完整可用。
