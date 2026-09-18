# Oraculum（智能推理与预测）

Oraculum **v4.0.0**

一个**移动端优先**的传统文化问卦 / 解卦 PWA。梅花易数多种起卦 + 六爻纳甲排盘，64 卦完整本地经典解读。

**核心计算和解读完全本地。无需后端。无需 API Key。无需 AI。支持离线。**

> **免责声明**
> 本应用用于传统文化研究、娱乐与自我反思，不代表客观事实或未来必然结果。涉及医疗、法律、财务、安全、升学就业等重要决定时，请以现实证据和专业意见为准，不以占卜结果替代决策。

## 运行方式



```
npm install

npm run dev        # 开发服务器，默认 http://localhost:5173

npm run build      # 类型检查 + 生产构建，输出 dist/

npm run preview    # 预览生产构建
```

## 测试与校验



```
npm run test       # 运行 Vitest 单元测试

npm run test:watch # 监视模式

npm run validate   # 本地数据完整性校验

npm run lint       # ESLint 检查

npm run format     # Prettier 格式化
```

## 起卦方式



| 方式         | 规则版本                        | 性质                 |
| ---------- | --------------------------- | ------------------ |
| 六源合参       | six\_source\_hybrid\_v1     | 本项目实验（非古籍原法）       |
| 梅花・秒级时间    | meihua\_time\_second\_v2    | 现代扩展（秒参与算法）        |
| 梅花・随机数     | meihua\_random\_numbers\_v1 | 现代数字化（crypto 安全随机） |
| 梅花・摇骰      | meihua\_dice\_v1            | 现代交互               |
| 六爻・三枚钱     | liuyao\_three\_coins\_v1    | 传统实践（真实六爻）         |
| 梅花・文字      | meihua\_text\_count\_v1     | 传统（长文本字数）          |
| 梅花・外应      | meihua\_external\_omen\_v1  | 传统 + 规范化           |
| 梅花・时间 (v1) | meihua\_time\_v1            | 旧法保留兼容             |

## 功能



* 梅花易数多种起卦：时间、随机数、摇骰、文字、外应

* 六爻纳甲排盘：八宫、世应、纳甲、六亲、六神、伏神、神煞

* 64 卦完整本地经典解读：卦辞、彖传、大象传、384 爻辞、384 小象传

* 本地确定性解读引擎：本卦 → 动爻 → 互卦 → 变卦 → 体用 → 综合

* 0–100 传统规则评分 + 五档（大凶 / 凶 / 平 / 吉 / 大吉）+ 评分明细

* 六爻规则状态：用神、元神 / 忌神、旺衰、暗动 / 日破、合绊、回头生克、三合、进退、飞伏

* 本地历史记录（IndexedDB）、导出 / 导入 JSON

* 知识库浏览：卦辞、彖传、大象、爻辞、小象、Oraculum 现代释义、来源

* PWA 离线支持：起卦、历法、梅花、六爻、本地解读、历史、知识库全部离线工作

## 技术栈

Vue 3 · TypeScript（strict）· Vite · Vue Router · Pinia · Dexie(IndexedDB) · lunar-javascript · vite-plugin-pwa · Vitest

## 版本



| 版本标识                      | 值     | 说明                                |
| ------------------------- | ----- | --------------------------------- |
| APP\_VERSION              | 4.0.0 | 应用版本（v4 为纯本地化改造）                  |
| RULESET\_VERSION          | 4.0.0 | 起卦算法与评分规则版本                       |
| DATASET\_VERSION          | 3.0.0 | 经典数据集版本（卦辞 / 爻辞 / 彖传 / 大象 / 小象完整） |
| LOCAL\_KNOWLEDGE\_VERSION | 1.0.0 | 本地现代释义版本                          |

每条历史记录均保存版本号，算法升级不改变旧结果。

## 目录结构



```
src/

├─ data/           经典资料层（八卦/64卦/八宫/纳甲/六亲/六神/神煞/历法）

├─ engine/         确定性规则引擎

│  ├─ calendar/    历法

│  ├─ casting/    起卦

│  ├─ meihua/      梅花易数

│  ├─ liuyao/     六爻纳甲排盘

│  ├─ scoring/    评分

│  ├─ localInterpretation/  本地确定性解读引擎

│  └─ orchestrator.ts       总编排

├─ local-data/     本地经典文本 + Oraculum 现代释义

│  ├─ classics/    古籍原文（周易卦辞/彖传/大象/小象）

│  ├─ interpretation/  Oraculum 现代释义

│  └─ meihua/      梅花体用角色与含义

├─ components/     组件

├─ views/          页面

├─ db/             Dexie 历史（IndexedDB）

├─ router/         路由

├─ stores/         Pinia 状态

├─ types/         类型定义

└─ utils/          工具函数

docs/              文档

tests/             Vitest 测试
```

## 三层架构



1. **经典资料层** `src/data/` + `src/local-data/classics/`：卦、卦辞、爻辞、彖传、大象传、小象传、术数基础表。古籍原文与现代释义严格分字段。

2. **确定性规则引擎层** `src/engine/`：历法、起卦、八宫、世应、纳甲、六亲、六神、伏神、旬空、神煞、评分。全部离线、确定性、可复现。

3. **本地解读层** `src/engine/localInterpretation/`：只读结构化结果，查本地知识数据 + 套确定性模板生成现代中文。运行时不联网、不调用大模型。

## 手机使用



1. **局域网**：`npm run dev -- --host`，手机同局域网访问 `http://电脑IP:5173`。

2. **PWA**：将 `dist` 部署到 HTTPS 后，手机浏览器 "添加到主屏幕" 即可离线使用。详见 `docs/MOBILE_INSTALL.md`。

## 文档



* [本地解读引擎](docs/LOCAL_INTERPRETATION_ENGINE.md)

* [本地知识数据](docs/LOCAL_KNOWLEDGE_DATA.md)

* [经典文本来源](docs/CLASSIC_TEXT_SOURCES.md)

* [AI 移除迁移说明](docs/AI_REMOVAL_MIGRATION.md)

## Git 提交



```
git add -A

git commit -m "说明本次改动"

git push
```

远程仓库：`https://github.com/YuqiWang-code/oraculum`（main 分支）。