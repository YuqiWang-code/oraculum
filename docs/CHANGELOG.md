# Changelog

## v3.1.0 (2026-09-18)

### P0 工程与规则修复
- 生产 build 重构：`server/app.ts`（createApp 工厂）+ `server/start.ts`（listen），测试导入 app 不占端口
- 时区真正参与计算：`wallTimeInTimezone()` 用 Intl.DateTimeFormat 反推墙上时间，DivinationView/HomeView 不再硬编码
- 日界规则：`DayBoundaryRule = 'midnight' | 'zi_hour'`，进入 Settings/DivinationInput/CalendarContext，旧数据自动映射
- 节气与月建节令分开：`currentSolarTerm`（完整24节气）+ `monthBoundaryJie`（仅12个节令换月）
- TimeSecondCaster 修复：实时秒+两条路径（锁定当前这一秒 / 按指定时间）
- SixSourceWizard 修复：coinThrow 从 null 开始，必须真正掷钱才能完成
- consistency 算法修正：基于 delta 权重 `abs(posWeight - negWeight) / totalWeight`
- AI schema 安全：删除 traditionalScore/traditionalLabel，前端永远显示本地评分
- follow-up 去重：messages 最后一条即问题，不再单独传 question
- Zod 校验：拒绝 role=system/developer，messages max 6，question max 2000
- moderation：interpret 初始问题也走 moderation，故障不 fail-open
- auth-check：新增 GET /api/ai/auth-check，测试连接分两步
- 生产 auth fail-closed：production 且 AI 已配置时，token 缺失/placeholder 启动失败

### P1 规则与 AI
- 六爻用神选择：按类别从 CATEGORY_USEFUL_GOD 选首要用神
- 基础冲合空破：六冲/六合/旬空/月破纯函数 + 独立 evidence
- AI snapshot 扩充：rating.evidence、卦辞、六爻用神/变爻
- AI model/usage：返回真实模型名 + input/output tokens，AiSession 保存 usage
- AI 成本控制：max_tokens 从 env 读取，默认 2500
- prompt injection 防护：system prompt 声明输入为不可信数据

### P2 数据与版本
- DB 级联删除：deleteRecord/clearHistory 同时清 aiSessions
- export schema version=2，包含 appVersion + aiSessions
- importAll 加 schema 校验
- 版本号：APP_VERSION=3.1.0, RULESET_VERSION=2.1.0

## v3.0.0 (2026-09-17)
- 新增 Express 后端 + AI 深度解读层
- 三种 AI endpoint：health / interpret / follow-up
- Dexie v2：aiSessions 表
- AI 缓存：已有 AI 解读不自动重调

## v2.0.0 (2026-09-17)
- 秒级时间起卦 meihua_time_second_v2
- 六种起卦方式：秒级时间/随机数/摇骰/三枚钱/文字/外应
- 六源合参实验模式 six_source_hybrid_v1
- crypto.getRandomValues 安全随机（无 modulo bias）

## v1.0.0 (2026-09-17)
- Vue 3 + TS + Vite PWA 基础框架
- 梅花时间起卦 meihua_time_v1
- 六爻排盘：八宫/世应/纳甲/六亲/六神/伏神/神煞
- 0-100 评分 + 五档
- IndexedDB 历史记录
