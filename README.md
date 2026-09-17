# Oraculum（智能推理与预测）

一个**移动端优先**的传统文化问卦 / 解卦 PWA。七种独立起卦方式 + 六源合参实验模式，梅花易数 + 六爻纳甲排盘。

核心计算完全本地、确定性、可复现，不依赖云端 AI，支持离线使用。

## 本地引擎 vs AI

- **本地传统引擎**：离线可用，负责起卦/卦象/干支/评分。
- **AI 深度解读**：可选增强，需联网，把本次最小卦象快照发到自建后端再调 OpenAI，不改变卦象与评分。
- ChatGPT Plus **不包含** API 免费额度；API 在 OpenAI Platform 单独计费。

## 运行方式

```
npm install

# 无 AI 模式（纯 PWA，本地全部可用）
npm run dev

# 完整模式（前端 5173 + 后端 8787，后端读 .env）
npm run dev:full

npm run build && npm start   # 生产：一个 Node 服务同时托管 PWA 与 /api
```

后端首次使用：复制 `.env.example` 为 `.env`，填入真实 `OPENAI_API_KEY` 与 `AI_ACCESS_TOKEN`（不要提交到 git）。

## 起卦方式（v2）

| 方式 | 规则版本 | 性质 |
|---|---|---|
| 六源合参 | six_source_hybrid_v1 | 本项目实验（非古籍原法） |
| 梅花·秒级时间 | meihua_time_second_v2 | 现代扩展（秒参与算法） |
| 梅花·随机数 | meihua_random_numbers_v1 | 现代数字化（crypto 安全随机） |
| 梅花·摇骰 | meihua_dice_v1 | 现代交互 |
| 六爻·三枚钱 | liuyao_three_coins_v1 | 传统实践（真实六爻） |
| 梅花·文字 | meihua_text_count_v1 | 传统（长文本字数） |
| 梅花·外应 | meihua_external_omen_v1 | 传统 + 规范化 |
| 梅花·时间(v1) | meihua_time_v1 | 旧法保留兼容 |

> **免责声明**
> ：本应用用于传统文化研究、娱乐与自我反思，不代表客观事实或未来必然结果。涉及医疗、法律、财务、安全、升学就业等重要决定时，请以现实证据和专业意见为准，不以占卜结果替代决策。

## 技术栈

Vue 3 · TypeScript（strict）· Vite · Vue Router · Pinia · Vitest · Dexie(IndexedDB) · lunar-javascript · vite-plugin-pwa。

## 安装与开发



```
npm install

npm run dev        # 电脑开发，默认 http://localhost:5173

npm run test       # 运行 Vitest

npm run validate   # 静态数据校验

npm run build      # 类型检查 + 生产构建

npm run preview    # 预览生产构建
```

## 手机使用



1. 局域网：`npm run dev -- --host`，手机同局域网访问 `http://电脑IP:5173`。

2. PWA：将 `dist` 部署到 HTTPS 后，手机浏览器 "添加到主屏幕" 即可离线使用。详见 `docs/MOBILE_INSTALL.md`。

## 功能



* 当前时间自动起卦（梅花时间起卦 meihua\_time\_v1）

* 农历 / 干支 / 节气 / 月建 / 旬空

* 本卦 / 互卦 / 变卦 / 动爻 / 体用五行

* 六爻高级排盘：八宫、世应、纳甲、六亲、六神、伏神、神煞

* 0–100 传统规则评分 + 五档（大凶 / 凶 / 平 / 吉 / 大吉）+ 评分明细

* 本地历史记录（IndexedDB）、导出 / 导入 JSON

* 知识库浏览

## 目录



```
src/data/       经典资料层（八卦/64卦/八宫/纳甲/六亲/六神/神煞）

src/engine/     确定性规则引擎（历法/起卦/梅花/六爻/评分/解释）

src/components/  组件

src/views/      页面

src/db/         Dexie 历史

docs/           文档

tests/          Vitest
```

## 三层架构



1. **经典资料层** `src/data/`：卦、卦辞、爻辞、术数基础表（原文与现代解读分字段）。

2. **确定性规则引擎层** `src/engine/`：历法、起卦、八宫、世应、纳甲、六亲、六神、伏神、旬空、神煞、评分。AI 绝不参与卦象与评分基础数据。

3. **解释层** `src/engine/interpretation/`：只读结构化结果，模板化生成现代中文。

规则版本：`RULESET_VERSION=1.0.0`，数据集版本 `DATASET_VERSION=1.0.0`，每条历史记录均保存版本，算法升级不改变旧结果。

## 完成报告

### 1. 创建了什么

Vue 3 + TypeScript (strict) + Vite + Pinia + Vue Router + Vitest + Dexie + lunar-javascript + vite-plugin-pwa 的完整 PWA 工程。三层架构严格分离：`src/data/`（经典资料层，只读常量带 source）、`src/engine/`（确定性规则引擎）、`src/engine/interpretation/`（本地模板化解读）。AI 不参与卦象 / 干支 / 动爻 / 评分基础数据。

### 2. 目录结构（关键部分）



```
src/data/      trigrams, hexagrams(64卦), palaces, najia, sixRelations, sixSpirits, shensha, solarTerms

src/engine/    calendar/, hexagram/, meihua/, liuyao/ (layout, hiddenSpirits, score), scoring/, interpretation/, orchestrator.ts

src/db/        Dexie 历史（增删/搜索/导出/导入，存 ruleVersion + datasetVersion）

src/views/     Home / Divination / Result / History / Knowledge / Settings / About

tests/         4 个测试文件；docs/ 7 份文档；public/icons/ PWA 图标
```

### 3. 核心规则



* **梅花时间起卦&#x20;**`meihua_time_v1`：A = 年支 + 农历月 + 日，B = + 时支，上卦 / 下卦 / 动爻按资料 5.2；体用、互卦、变卦。

* **六爻**：八宫表、世应表、纳甲表驱动；六亲以宫五行为我；六神按日干；旬空由日柱查六旬；伏神从本宫纯卦定位；神煞（驿马 / 桃花 / 华盖 / 天乙贵人，低权重可关闭）。

* **评分**：`score = clamp(0,100, 50 + Σdelta)`，五档 0–19 大凶 / 20–39 凶 / 40–59 平 / 60–79 吉 / 80–100 大吉，每项加减分都生成 `ScoreEvidence{id,title,delta,reason,sourceRule}`，结果页可展开 "评分依据"。

### 4. 测试结果

`npm run test` → **38 个用例全部通过**（八卦编码、64 卦唯一 / 组合、动爻变卦、互卦、八宫、世应、纳甲、六亲、六神、旬空、梅花固定样例与确定性、评分边界）。`npm run validate` → 数据校验通过。

### 5. build 结果

`npm run build` → 成功（vue-tsc 类型检查 + vite 生产构建），生成 `dist/sw.js`、`manifest.webmanifest`、21 项离线缓存。

### 6. 电脑启动



```
cd F:\豆包\Projects\智能推理与预测

npm run dev      # http://localhost:5173
```

### 7. 手机测试



* 局域网：`npm run dev -- --host`，手机同 Wi-Fi 访问 `http://电脑IP:5173`。

* PWA：`dist` 部署到 HTTPS 后，手机浏览器 "添加到主屏幕" 即可离线安装（详见 `docs/MOBILE_INSTALL.md`）。

### 8. 待办 TODO



* **六十四卦经典卦辞 / 爻辞**：资料库未逐字提供，按要求结构已就位、原文字段留空并标 `needsVerify`，未凭记忆冒充原文；待联网用 ctext / 维基文库逐字核对后补录并升 `DATASET_VERSION`（清单见 `docs/DATA_SOURCES.md`）。

* **六爻起卦 v1** 以 "梅花卦结构作六爻输入" 的综合实验模式呈现（UI 已标注）；三枚钱法 / 纯手动录入 UI 为二期。

* 旺衰为可解释简化版，未做完整冲合刑害加权；分享长图、Capacitor 打 APK 为二期。

### 9. 经典文本核验状态



* **已核验**：八卦 / 64 卦结构、上下卦组合、八宫归属、世应、纳甲、六亲、六神、旬空（均有测试锁定）。

* **未核验（已标记）**：64 卦卦辞与 384 爻辞原文 ——`judgmentClassic` / `lineTextsClassic` 留空、`needsVerify=true`，待逐字核对。

结果页与关于页均已固定写明 "传统文化研究与娱乐用途；重要现实决定请依据事实和专业意见"。

## Git 提交

后续有改动时，直接：



```
git add -A

git commit -m "说明本次改动"

git push
```

远程仓库：`https://github.com/YuqiWang-code/oraculum`（main 分支）。