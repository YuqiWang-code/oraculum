# Oraculum（智能推理与预测）

Oraculum **v4.4.0**

一个**移动端优先**的传统文化问卦 / 解卦 PWA。梅花易数多种起卦 + 六爻纳甲排盘，64 卦完整本地经典解读。**v4.4 运势正确性大修（大运顺逆/出生历法统一/农历闰月/晚子时日界/分钟精度/year_month不伪造）+ 运势解释引擎（十神/六合六冲/大运流年白话）+ 京房十六变逐节点解释 + 本地出生档案 + 性能专项（dynamic import 懒加载/bundle budget）。**

**核心计算和解读完全本地。无需后端。无需 API Key。无需 AI。支持离线。**

**正式上线：**[https://oraculum-3g8.pages.dev](https://oraculum-3g8.pages.dev)

> **免责声明**
> 本应用用于传统文化研究、娱乐与自我反思，不代表客观事实或未来必然结果。涉及医疗、法律、财务、安全、升学就业等重要决定时，请以现实证据和专业意见为准，不以占卜结果替代决策。



***

## 快速开始

### 直接使用

打开 [https://oraculum-3g8.pages.dev](https://oraculum-3g8.pages.dev) 即可使用，无需安装任何东西。

### 手机安装 PWA



* **Android**：用 Chrome 打开网址 → 菜单 → "安装应用" 或 "添加到主屏幕"

* **iOS**：用 Safari 打开网址 → 分享 → "添加到主屏幕"

安装后可从桌面图标以全屏模式启动，核心功能离线可用。

### 本地开发



```
npm install

npm run dev        # 开发服务器，默认 http://localhost:5173

npm run build      # 类型检查 + 生产构建，输出 dist/

npm run preview    # 预览生产构建（http://localhost:4173）
```



***

## 测试与校验



```
npm run test       # 运行 Vitest 单元测试（307 tests）

npm run test:watch # 监视模式

npm run validate   # 本地数据完整性校验（64卦/384爻/彖传/大象/小象/现代释义/themeKeyword）

npm run lint       # ESLint 检查

npm run bundle:check # 构建产物体积预算检查

npm run audit:privacy # 源码审计：禁止远程 DB SDK（Firebase/Supabase/D1/KV）
```



***

## 起卦方式

### 传统 / 常用



| 方式      | 标识                        | 说明               |
| ------- | ------------------------- | ---------------- |
| 梅花・年月日时 | `meihua_time_v1`          | 传统梅花易数起卦法        |
| 六爻・三枚钱  | `liuyao_three_coins_v1`   | 传统六爻纳甲真实摇卦       |
| 梅花・文字   | `meihua_text_count_v1`    | 传统思想・项目规范（长文本字数） |
| 梅花・外应   | `meihua_external_omen_v1` | 传统 + 规范化         |

### 现代数字化



| 方式      | 标识                         | 说明                 |
| ------- | -------------------------- | ------------------ |
| 梅花・秒级时间 | `meihua_time_second_v2`    | 现代扩展（秒参与算法）        |
| 梅花・随机数  | `meihua_random_numbers_v1` | 现代数字化（crypto 安全随机） |
| 梅花・摇骰   | `meihua_dice_v1`           | 现代交互               |

### 实验



| 方式   | 标识                     | 说明           |
| ---- | ---------------------- | ------------ |
| 六源合参 | `six_source_hybrid_v1` | 本项目实验（非古籍原法） |



***

## 功能



* **梅花易数多种起卦**：年月日时、秒级时间、随机数、摇骰、文字、外应

* **六爻纳甲排盘**：八宫、世应、纳甲、六亲、六神、伏神、神煞、旬空

* **64 卦完整本地经典解读**：卦辞、彖传、大象传、384 爻辞、384 小象传

* **本地确定性解读引擎**：本卦 → 动爻 → 互卦 → 变卦 → 体用 → 综合，每段原文→白话→角色解释

* **一句话看懂**：把经典卦象和规则转换为现代口语化提示（纯本地模板，不调用大模型）

* **现实白话解读（v4.3 新增）**：长辈友好三层解读——现在是什么情况 / 为什么这么看（本卦·动爻·互卦·变卦·体用·评分）/ 接下来怎么做 / 最需要注意。64卦+384爻全部长辈友好现代释义，默认展开，大字号高对比。

* **运势栏目（v4.3 新增，v4.4 大修）**：八字大运流年（lunar-javascript 1.7.7，输入精度诚实——年月二柱/三柱/四柱分级展示，不伪造时柱；大运顺逆由 yun.isForward() 唯一事实源，阳男阴女顺/阴男阳女逆；晚子时日界 sect=1/2 可切换；农历闰月支持；分钟精度标记）+ 京房八宫/《易隐》十六变研究层（逐节点 step reading，归魂初爻修复，Source A 本机历史/Source B 出生时刻起卦/Source C 手动选宫，历史术语保护不预测死亡）。

* **运势解释引擎（v4.4 新增）**：十神（日干为日主，10×10 全覆盖，与 6tail 交叉 golden）、地支六合六冲（大运支/流年支 vs 原局四支及互相对比）、DaYunAnalysis/LiuNianAnalysis（每步 focus/why/howToAct/watchOut，所有解释可回溯 FortuneStructureEvidence）。禁止伪精确（无 80 分/发财率/升职概率）。

* **本地出生档案（v4.4 新增）**：运势页可保存出生资料到本机 IndexedDB，支持使用/重命名/删除。默认不保存，需主动勾选。不云同步。

* **性能专项（v4.4）**：elderFriendly 8 批真实 dynamic import 懒加载（非静态 import）、local-data 两层化（light 索引 66KB + heavy 按需）、ResultView 异步加载+骨架、KnowledgeView 按展开加载、Fortune 流年按范围计算+分十年页、bundle:check 预算脚本。local-data 主 chunk gzip 从 74.8KB 降至 62.7KB。

* **阅读模式（v4.3 新增）**：简明模式（默认，一句话+现实白话+必要传统信息）/ 研究模式（完整经典、详细规则、评分依据），兼容旧设置迁移。

* **0–100 传统规则评分** + 五档（大凶 / 凶 / 平 / 吉 / 大吉）+ RatingBreakdown 七项明细

* **六爻规则状态**：用神、元神 / 忌神 / 仇神、旺衰、暗动 / 日破、合绊、回头生克、三合、进退、飞伏

* **统一 LiuYaoAnalysis 事实源**：scorer、解读引擎、ResultView 共享同一份分析结果，不漂移

* **本地历史记录**（IndexedDB）：导出 / 导入 JSON，`/result/:id` 路由刷新可恢复

* **知识库浏览**：64 卦可展开详情（卦辞 / 彖传 / 大象 / 六爻爻辞 + 小象 / 现代释义 / 来源），支持搜索

* **PWA 离线支持**：起卦、历法、梅花、六爻、本地解读、历史、知识库全部离线工作

* **安装与分享**：Android beforeinstallprompt 安装卡片、iOS 添加到主屏幕指引、navigator.share 分享应用

* **时区感知**：记录起卦时的目标时区，历史和结果页按记录时区显示时间

* **移动端优化**：响应式布局、经典原文折叠（details）、六爻高级状态默认折叠、底部导航



***

## 技术栈

Vue 3 · TypeScript（strict）· Vite · Vue Router · Pinia · Dexie(IndexedDB) · lunar-javascript · vite-plugin-pwa · Vitest · ESLint



***

## 版本



| 版本标识                      | 值     | 说明                                                     |
| ------------------------- | ----- | ------------------------------------------------------ |
| `APP_VERSION`             | 4.4.0 | 应用版本（v4.4 运势正确性大修 + 解释引擎 + 性能专项）        |
| `RULESET_VERSION`         | 4.1.0 | 起卦算法与评分规则版本（不变）                                  |
| `DATASET_VERSION`         | 3.0.0 | 经典数据集版本（卦辞 / 爻辞 / 彖传 / 大象 / 小象完整，不变）            |
| `LOCAL_KNOWLEDGE_VERSION` | 1.2.0 | 本地现代释义版本（不变）                |
| `FORTUNE_RULESET_VERSION` | 2.0.0 | 运势规则版本（顺逆/出生历法/精度/解释引擎重大行为修正）                    |
| `FORTUNE_DATASET_VERSION` | 1.1.0 | 运势数据版本（v4.4 十神/地支关系/step reading）                                |

每条历史记录均保存版本号，算法升级不改变旧结果。



***

## 目录结构



```
src/

├─ data/                    经典资料层（八卦/64卦/八宫/纳甲/六亲/六神/神煞/历法）

├─ engine/                  确定性规则引擎

│  ├─ calendar/             历法（节气、月建、旬空、时区墙时间）

│  ├─ casting/              起卦（多种方式）

│  ├─ meihua/               梅花易数（体用、互卦、变卦）

│  ├─ liuyao/               六爻纳甲排盘（roles/strength/analyze/scorer）

│  ├─ scoring/              评分

│  ├─ localInterpretation/  本地确定性解读引擎

│  ├─ realWorldInterpretation/ 现实白话解读引擎（v4.3 新增，长辈友好）

│  ├─ fortune/              运势引擎（v4.3 新增，v4.4 大修：八字大运流年 + 京房十六变）
│  │  ├─ birth/            出生历法统一转换 + 校验（v4.4 新增：normalizeBirthProfile/validateBirthProfile）
│  │  ├─ bazi/             八字排盘（顺逆 yun.isForward()、晚子时 sect、五行显式统计）
│  │  ├─ analysis/         运势解释引擎（v4.4 新增：十神/六合六冲/DaYunAnalysis/LiuNianAnalysis）
│  │  └─ jingfang16/       京房十六变（buildStepReading 逐节点解释，归魂初爻修复）

│  └─ orchestrator.ts       总编排

├─ local-data/              本地经典文本 + Oraculum 现代释义
│  ├─ classics/             古籍原文（周易卦辞/彖传/大象/小象，JSON 数据）
│  ├─ interpretation/       Oraculum 现代释义（64卦 + 384爻，JSON 数据 + elderBatch TS 包装）
│  ├─ light/                轻量索引（v4.4 新增：kingWen/name/core/theme，66KB，首屏搜索用）
│  └─ meihua/               梅花体用角色与含义

├─ components/              组件

├─ views/                   页面（Home/Divination/Result/History/Knowledge/Settings/Fortune）

├─ db/                      Dexie 历史（IndexedDB，version 4 新增 fortuneProfiles）

├─ router/                  路由（/result/:id + IndexedDB 刷新恢复）

├─ stores/                  Pinia 状态（async bootstrap，mount 前加载设置）

├─ types/                   类型定义

└─ utils/                   工具函数

public/

├─ \_redirects               SPA fallback（/\* /index.html 200）

├─ icons/                   PWA 图标（含独立 maskable-512）

└─ manifest.webmanifest     PWA manifest

docs/                       文档

tests/                      Vitest 测试（307 tests：正确性/运势解释/十六变/隐私/realWorld）

scripts/                    数据校验 + bundle:check + audit-local-only 脚本
```



***

## 三层架构



1. **经典资料层** `src/data/` + `src/local-data/classics/`：卦、卦辞、爻辞、彖传、大象传、小象传、术数基础表。古籍原文与现代释义严格分字段，所有现代解释标注 "Oraculum 现代释义"。

2. **确定性规则引擎层** `src/engine/`：历法、起卦、八宫、世应、纳甲、六亲、六神、伏神、旬空、神煞、评分。全部离线、确定性、可复现。六爻分析通过 `analyzeLiuyao()` 生成统一 `LiuYaoAnalysis`，scorer 和解读共享同一事实源。

3. **本地解读层** `src/engine/localInterpretation/`：只读结构化结果，查本地知识数据 + 套确定性模板生成现代中文。运行时不联网、不调用大模型、不临时生成空洞句子。



***

## 部署

### Cloudflare Pages（正式）

生产网址：[https://oraculum-3g8.pages.dev](https://oraculum-3g8.pages.dev)



| 配置项                    | 值                        |
| ---------------------- | ------------------------ |
| Project name           | `oraculum`               |
| GitHub repo            | `YuqiWang-code/oraculum` |
| Production branch      | `main`                   |
| Framework preset       | `None`                   |
| Build command          | `npm run build`          |
| Build output directory | `dist`                   |
| Environment variables  | 无                        |

`public/_redirects` 提供 SPA fallback（`/* /index.html 200`），确保 `/history`、`/knowledge`、`/settings`、`/result/:id` 等深路由直接刷新不 404。

详见 [docs/DEPLOY\_CLOUDFLARE\_PAGES.md](docs/DEPLOY_CLOUDFLARE_PAGES.md)。

### 自动部署

GitHub `main` 分支已连接 Cloudflare Pages。每次 `git push origin main` 自动触发构建并更新到同一个生产域名。

### 临时分享（备选）

如需在正式部署前临时分享给朋友测试，可用 Cloudflare Tunnel：



```
npm run build

npm run preview          # http://localhost:4173

\# 另一个终端：

cloudflared tunnel --url http://localhost:4173
```

详见 [docs/REMOTE\_SHARE\_TEMPORARY.md](docs/REMOTE_SHARE_TEMPORARY.md)。



***

## 隐私



* **每台设备自己的 IndexedDB**：问卦历史和出生档案仅存储在当前浏览器的 IndexedDB 中

* **Cloudflare 不保存问卦数据**：纯静态托管，无后端、无数据库、无用户账号

* **A 用户看不到 B 用户的历史**：数据不跨设备同步，跨设备自动同步关闭/不支持

* **出生档案默认不保存**：运势页需主动勾选"保存本地档案"才写入；导出默认不含出生档案，需用户显式选择

* **本地存储用量可见**：设置页可查看本机站点存储用量（navigator.storage.estimate()）

* **无远程 DB SDK**：源码审计脚本（audit:privacy）扫描禁止 Firebase/Supabase/D1/KV 导入

* `/result/:id`**&#x20;URL 不携带完整问卦数据**：只包含记录 ID，其他设备打开同 URL 找不到本地记录是正常设计

* **无 Analytics、无广告、无第三方追踪**

* **运势是传统结构研究，不代表事实预测**



***

## 文档



* [本地解读引擎](docs/LOCAL_INTERPRETATION_ENGINE.md)

* [一句话看懂白话引擎](docs/PLAIN_INTERPRETATION_ENGINE.md)

* [本地释义审查记录](docs/LOCAL_INTERPRETATION_REVIEW.md)

* [长辈友好现实解读设计](docs/ELDER_FRIENDLY_INTERPRETATION.md)

* [本地语言数据蒸馏](docs/LOCAL_LANGUAGE_DATA_DISTILLATION.md)

* [运势引擎设计](docs/FORTUNE_ENGINE.md)

* [京房十六变来源笔记](docs/JINGFANG_16_SOURCE_NOTES.md)

* [运势规则冲突记录](docs/FORTUNE_RULE_CONFLICTS.md)

* [本地模型研究（不采用记录）](docs/LOCAL_MODEL_RESEARCH.md)

* [v4.3 审计](docs/V43_AUDIT.md)

* [v4.4 审计](docs/V44_AUDIT.md)

* [v4.4 浏览器 Smoke 测试](docs/V44_BROWSER_SMOKE.md)

* [v4.3 性能 Baseline](docs/PERFORMANCE_BASELINE_V43.md)

* [本地知识数据](docs/LOCAL_KNOWLEDGE_DATA.md)

* [经典文本来源](docs/CLASSIC_TEXT_SOURCES.md)

* [AI 移除迁移说明](docs/AI_REMOVAL_MIGRATION.md)

* [Cloudflare Pages 部署](docs/DEPLOY_CLOUDFLARE_PAGES.md)

* [临时分享（Cloudflare Tunnel）](docs/REMOTE_SHARE_TEMPORARY.md)

* [手机安装 PWA](docs/MOBILE_INSTALL.md)

* [架构说明](docs/ARCHITECTURE.md)

* [规则说明](docs/RULES.md)

* [测试说明](docs/TESTING.md)

* [变更日志](docs/CHANGELOG.md)



***

## Git



```
git add -A

git commit -m "说明本次改动"

git push origin main
```

远程仓库：`https://github.com/YuqiWang-code/oraculum`（main 分支）。push 后 Cloudflare Pages 自动部署。