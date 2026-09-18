# AI 移除迁移说明

> 版本：3.4.0 → 4.0.0 · 从 AI 辅助解读改为纯本地确定性解读

## 移除内容

### 删除的目录与文件

| 项目 | 说明 |
|---|---|
| `server/` | 整个后端目录（Express + OpenAI 代理） |
| `dist-server/` | 后端构建输出 |
| `src/components/ai/` | AI 相关组件（AIInterpretationCard 等） |
| `src/services/ai.ts` | AI 服务调用层 |
| `src/types/ai.ts` | AI 相关类型定义 |
| `tests/server/` | 后端测试 |
| `.env.example` | 环境变量模板（不再需要） |
| `docs/AI_INTEGRATION.md` | AI 集成文档 |
| `docs/AI_SECURITY.md` | AI 安全文档 |

### 删除的 npm 依赖

| 依赖 | 用途 |
|---|---|
| `openai` | OpenAI SDK |
| `express` | 后端框架 |
| `express-rate-limit` | API 限流 |
| `dotenv` | 环境变量加载 |
| `concurrently` | 并行脚本 |
| `@types/express` | Express 类型 |
| `@types/express-rate-limit` | 限流类型 |

> `zod` 经确认本地校验仍在使用，保留。

### 删除的 npm scripts

| Script | 说明 |
|---|---|
| `dev:server` | 启动后端 |
| `dev:full` | 前后端并行 |
| `build:server` | 构建后端 |
| `start` | 生产启动（Node 服务） |
| `ai:smoke` | AI 冒烟测试 |

最终保留纯前端 scripts：

```json
{
  "dev": "vite",
  "build": "vue-tsc --noEmit && vite build",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest",
  "lint": "eslint . --ext .ts,.vue",
  "format": "prettier --write \"src/**/*.{ts,vue}\"",
  "validate": "tsx scripts/validate-data.ts"
}
```

## IndexedDB 迁移

Dexie 数据库版本变化：

| 版本 | 变更 |
|---|---|
| v1 | 初始：`history` + `settings` |
| v2 | 新增 `aiSessions` store（曾用于 AI 会话历史） |
| v3 | **删除 `aiSessions` store**（设为 `null`） |

```typescript
// v3：删除 aiSessions store
this.version(3).stores({
  aiSessions: null  // Dexie 官方：设为 null 即删除 store
})
```

### 数据保留

- ✅ `history` 表完全保留——旧历史记录不丢
- ✅ `settings` 表完全保留
- ✅ `aiSessions` 表被删除——其中数据不再需要
- ✅ 导出 JSON 不再包含 `aiSessions`
- ✅ 导入 JSON 兼容旧格式（自动忽略 `aiSessions` 字段）

## 版本号变化

| 版本标识 | 旧值 | 新值 |
|---|---|---|
| APP_VERSION | 3.4.0 | **4.0.0** |
| RULESET_VERSION | 4.0.0 | 4.0.0（不变） |
| DATASET_VERSION | 2.0.0 | **3.0.0** |
| LOCAL_KNOWLEDGE_VERSION | 无 | **1.0.0**（新增） |

## 用户注意事项

- 如果本地存在 `.env` 文件（曾用于存放 `OPENAI_API_KEY` 等），请**自行删除**。项目已不读取任何环境变量。
- 旧版历史记录在升级后自动保留，无需手动迁移。
- 首次加载 v3 数据库时，Dexie 会自动执行 `aiSessions: null` 删除操作，无需用户干预。
