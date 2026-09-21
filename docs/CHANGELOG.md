# Changelog

## 通俗化娱乐化升级（2026-09-21）

定位从“专业易学工具”升级为“普通用户、年轻人、老人都能玩的传统文化娱乐 PWA”：**计算专业、表达通俗、体验有趣**。本次只改表达层与界面层，核心本地确定性计算引擎与经典数据一律未动。

### 新增：独立的“普通用户解释层”
- 新增 `src/local-data/plainInterpretation/`：64 卦白话（simple/elder/action）、31 个专业术语白话、5 种体用关系人话、评分证据人话、主题卡与灵感转盘数据；版本常量 `PLAIN_INTERPRETATION_VERSION`。
- 不修改任何 classic 数据（`src/local-data/interpretation/*.json`、classics、zhouyi 保持原样），专业层与白话层分离。
- 数据流保持“用户输入 → casting engine → analysis fact → interpretation layer → view”，Vue 页面不自行解释卦、不重新起卦、不自行推八字。

### 首页与问卦流程
- 首页改国风“数字博物馆”风格：第一屏是“今天想了解什么？”主题卡（学业成长 / 工作方向 / 心情状态 / 关系情感 / 随便看看），不再直接堆“梅花易数/六爻纳甲/八字排盘”。
- 新增“灵感转盘”：只用于挑选问题主题，**不参与、不决定卦象**。
- 新增三步新手引导（说明“不是预测未来、只在本机计算”），仅用 localStorage 记录，不碰 IndexedDB。
- 问卦改为分步状态机（准备问题 → 起卦 → 生成卦象 → 解读），当前步骤高亮、其余弱化。
- 三枚铜钱翻转动画仅用 CSS/Vue Transition 实现，**随机算法与每次投爻结果完全不变**。

### 解读去“机器味”、分三层
- 顶部新增“🌱 简单看看 / 📚 深入研究”模式开关，默认简单；专业内容默认折叠、用户主动展开。
- 结果页三层：第一层一句话白话（老人能懂）；第二层“为什么这么看”，本卦/动爻/互卦/变卦/体用都带“这是什么意思？”；第三层专业分析整体折叠。
- 经典解读改为“古文原文 → 今天怎么理解 → 现实提醒”。
- 所有专业词（体用、互卦、变卦、四柱、十神、纳音、游魂、归魂、大运、流年等）配小白解释。
- 白话一句话改为按**完整分句**收束，修复此前按字数硬切产生的半句话（如“别三天两”）与重复拼句；避免连续四字成语，减少“宜/忌/慎/凶”。
- 新增本地“分享卡片”：纯 canvas 生成、可保存/系统分享，无新依赖、不联网。

### 运势（人生）页
- 第一屏改为出生资料录入与“八字是什么”白话说明，不再直接展示四柱。
- “大运”改为“人生阶段时间轴”，主显童年/少年/青年/而立/中年/晚年等阶段俗称，高亮当前阶段；干支等专业信息弱化并挂术语解释。
- 传统四柱排盘整体折叠到后面。
- “京房十六变”改名为“卦象变化研究”，明确说明它展示卦象如何变化、**不是人生年份或年龄预测**；专业内容折叠。
- 流年保持十年分段按需加载，不一次性渲染 120 年。

### 命名 / 文案红线
- 应用标题与 PWA 名称弱化“预测”，改为“今日问卦 · Oraculum”，文案强调“不预测未来、不联网、不调用 AI，用传统文化帮你整理想法”。
- 白话层禁词：一定 / 必然 / 命中注定 / 百分百 / 发财 / 死亡预测等；不做命运承诺。

### 数据校验与测试
- `scripts/validate-data.ts` 新增白话层校验：64 卦白话齐全、必备术语齐全、体用关系齐全、主题/转盘齐全、禁词与裸“宜忌凶吉”扫描。
- 新增文案测试与确定性测试：同输入结果必须一致、白话层源码不得出现 Math.random/fetch/XHR。

### 性能与依赖
- 经典/elder 白话仍为动态 import 懒加载分片；新增白话数据独立分片；结果页、运势页 chunk 与总 gzip 体积均在 `bundle:check` 预算内。
- 未引入任何大型动画库或新的 npm 依赖；动画只用 CSS 与 Vue Transition。
- 通过 320 / 375 / 390 / 430px 小屏验收（首页主题卡、转盘、三枚铜钱、结果三层、人生页出生资料优先均无横向溢出）。

### 红线确认（本次未改动）
- 未改 `src/engine/casting/`、`src/engine/liuyao/`、`src/engine/scoring/`、`src/engine/calendar/`。
- 未改起卦算法、六爻评分、classic 数据、历史结果与 IndexedDB schema。
- **RULESET_VERSION、DATASET_VERSION 保持不变。**
- 无任何 AI API / LLM / 云端服务；全部计算本地确定性完成。
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
