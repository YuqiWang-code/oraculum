# 智能推理与预测

一个**移动端优先**的传统文化问卦 / 解卦 PWA：梅花易数时间起卦 + 六爻纳甲排盘。

核心计算完全本地、确定性、可复现，不依赖云端 AI，支持离线使用。

> **免责声明**
>
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