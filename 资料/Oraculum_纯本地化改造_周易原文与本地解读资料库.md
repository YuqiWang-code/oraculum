# Oraculum 纯本地化改造：周易原文、本地解释数据与无 AI 架构资料库

> 仓库：`https://github.com/YuqiWang-code/oraculum`
> 审查基准：最新提交 `df0e9368dbce6c627383c8836230375007fc1e76`
> 审查日期：2026-09-18
> 建议放置：`F:\豆包\Projects\智能推理与预测\资料\Oraculum_纯本地化改造_周易原文与本地解读资料库.md`

## 0. 改造目标

本轮不再继续 Timing Engine、QuestionIntent 或 AI 相关功能。

新的方向是：

> **彻底删除项目中的 AI / LLM / 云端 API，把 Oraculum 改造成纯本地、离线、确定性、可复现的传统文化问卦 PWA。**

同时重写当前过于笼统的“核心解读”。

当前类似：

```text
本卦「随」指向随时、顺应、跟随；
互卦「渐」提示过程中的状态；
动爻使本卦变为「兑」，代表此事的发展趋向。
```

问题是：
- 主要依赖 `editorialKeywords`，不是经典原文；
- 没显示《周易》卦辞、《彖传》《象传》；
- 动爻原文没有进入核心解读；
- “互卦表示过程”说了等于没说，没说明过程是什么；
- “变卦表示趋势”也没有具体说明趋势；
- `classicEvidence` 已经存在，但本地 interpretation 没真正利用。

新的结果应该固定为：

```text
本卦：原文 → 白话 → 当前主旨
动爻：原文 → 白话 → 当前变化点
互卦：原文 → 白话 → 中间过程
变卦：原文 → 白话 → 后续趋向
体用：五行关系
综合：把以上结构组合
```

运行时不联网、不调用任何大模型。

---

## 1. 最新仓库现状

截至 `df0e9368...`，项目已经有：
- Vue 3 + TypeScript + Vite + PWA；
- 梅花易数多种起卦；
- 六爻纳甲；
- 64 卦卦辞；
- 384 爻辞；
- 用九 / 用六；
- `ClassicEvidence`；
- 六爻 `changedHexagram`；
- 六爻高级规则基础模块；
- `RatingBreakdown`；
- IndexedDB 历史。

同时仍保留整套 AI 相关结构：
- `server/`
- `src/components/ai/`
- `src/services/ai.ts`
- `src/types/ai.ts`
- `aiSessions`
- OpenAI SDK
- Express / express-rate-limit / dotenv
- AI 设置、token、provider、health、follow-up、moderation

既然决定以后不用 AI，建议彻底移除。

---

## 2. 经典解释链应该怎么做

推荐固定为：

```text
《周易》卦辞 / 爻辞
↓
《彖传》《象传》
↓
《梅花易数》本卦/互卦/变卦角色
↓
Oraculum 本地白话释义
↓
结合问题类别做确定性模板组合
```

`editorialKeywords` 仍可保留为搜索标签，但不能承担主要解释。

---

## 3. 本卦、互卦、变卦的传统角色

《梅花易数》卷三“体用互变之诀”中有：

> “用为占之即应，互为中间之应，变为事占之终应。”

可规范成：

- 本卦：当前基础格局 / 主旨
- 用卦：眼前最直接的作用关系
- 互卦：事情中间过程 / 内在演变
- 变卦：后段 / 最终趋向

《梅花易数》卷二又说：

> “体为主，用为事。”

因此：
- 体卦 = 问卦主体
- 用卦 = 所问之事 / 外部作用

来源：
- https://ctext.org/wiki.pl?chapter=830866&if=gb
- https://zh.wikisource.org/zh-hans/梅花易数/卷二

---

## 4. 黄金样例：随 → 六二动 → 互渐 → 变兑

### 4.1 本卦「随」

《周易》：

```text
随：元亨。利贞。无咎。
```

《彖传》：

```text
随，刚来而下柔，动而说，随。
大亨贞，无咎，而天下随时，随之时义大矣哉！
```

《象传》：

```text
泽中有雷，随；君子以向晦入宴息。
```

来源：
- https://zh.wikisource.org/zh-hans/周易/随
- https://ctext.org/book-of-changes/sui1/zh

**Oraculum 本地释义建议：**

“随”不是无条件跟随，而是顺应时势、条件和对象的变化，同时仍以“贞”——保持原则与正当性——作为边界。《彖传》强调“随时”，所以核心不只是跟随别人，更是根据时机调整行动。

**作为本卦：**

当前事情的主旨偏向“顺势而行、因时调整”。重点不是强行推进，而是判断什么值得跟随、何时调整，同时不能因为顺应环境而失去原则。

---

### 4.2 动爻「随·六二」

爻辞：

```text
六二：系小子，失丈夫。
```

小象：

```text
系小子，弗兼与也。
```

来源：
https://zh.wikisource.org/zh-hans/周易/随

**Oraculum 本地释义建议：**

六二的重点是“选择与牵系”。如果注意力被较近、较小或次要的对象牵住，可能因此失去更重要、更成熟或更值得坚持的目标。《象传》“弗兼与也”强调很多选择不能兼得，需要分清主次。

**作为动爻：**

这是当前格局的关键变化点：顺势不等于什么都跟随，应避免因为眼前较小、较近或短期的选择，而放弃更重要的长期方向。

---

### 4.3 互卦「渐」

卦辞：

```text
渐：女归吉，利贞。
```

《彖传》：

```text
渐之进也。
进得位，往有功也。
进以正，可以正邦也。
止而巽，动不穷也。
```

《象传》：

```text
山上有木，渐；君子以居贤德，善俗。
```

来源：
- https://zh.wikisource.org/zh-hans/周易/渐
- https://ctext.org/book-of-changes/jian3/zhs

**Oraculum 本地释义建议：**

“渐”的核心是逐步推进、依次前进。古义以婚嫁依礼而行为典型象征，但一般事件中不应机械理解为婚姻。

**作为互卦：**

《梅花易数》把互卦视为“中间之应”，所以这里表示事情中间过程更偏向循序渐进，不适合突然跳跃。过程需要顺序、耐心和阶段性的积累。

---

### 4.4 变卦「兑」

卦辞：

```text
兑：亨。利贞。
```

《彖传》：

```text
兑，说也。刚中而柔外，说以利贞，是以顺乎天，而应乎人。
```

《象传》：

```text
丽泽，兑；君子以朋友讲习。
```

来源：
- https://zh.wikisource.org/zh-hans/周易/兑
- https://ctext.org/book-of-changes/dui1/zhs

**Oraculum 本地释义建议：**

“兑”的核心是悦、交流、和顺、沟通。但《彖传》并不是单纯强调“开心”，而强调“刚中而柔外”：内在要有原则，外在可以柔和沟通。

**作为变卦：**

后段更可能进入沟通、协商、表达、关系互动或较为舒展的状态，但仍应保持正当和真实，不能为了讨好而失去原则。

---

### 4.5 综合示例

本地模板应能组合出类似：

```text
本卦“随”说明当前要顺应时机，但不能失去原则。

六二动提醒本次变化的关键在取舍：
不要因为眼前较小或次要的选择，失去更重要的目标。

互卦“渐”说明事情中段更偏向循序渐进，
过程需要时间、步骤和持续积累。

变卦“兑”说明后段趋向沟通、协商或关系舒展，
但仍应保持内在原则。

因此本次卦象可以概括为：
“顺势—取舍—渐进—沟通”。
```

不能把这段整体硬编码；应该由本地知识数据 + 确定性模板组合。

---

## 5. 还需要补齐哪些本地经典数据

当前已有：
- 64 卦卦辞
- 384 爻辞
- 用九 / 用六

建议一次性联网核对后固化到本地：
- 64 卦《彖传》
- 64 卦《大象传》
- 384 条《小象传》

运行时完全离线。

---

## 6. 新建本地知识目录

建议：

```text
src/local-data/
├─ classics/
│  ├─ zhouyi.ts
│  ├─ tuan.ts
│  ├─ daxiang.ts
│  ├─ xiaoxiang.ts
│  └─ sources.ts
├─ interpretation/
│  ├─ hexagramMeanings.ts
│  ├─ lineMeanings.ts
│  ├─ trigramMeanings.ts
│  ├─ roleMeanings.ts
│  └─ categoryHints.ts
├─ meihua/
│  ├─ roles.ts
│  └─ bodyUseMeanings.ts
└─ index.ts
```

严格区分：
- `classics/` = 古籍原文
- `interpretation/` = Oraculum 自己的现代释义

---

## 7. 推荐数据类型

```ts
export interface LocalHexagramKnowledge {
  kingWen: number
  name: string

  classic: {
    judgment: string
    tuan: string
    daXiang: string
    sourceRefs: string[]
  }

  localMeaning: {
    plainJudgment: string
    plainTuan: string
    plainDaXiang: string
    coreMeaning: string
    keyThemes: string[]
    asBaseHexagram: string
    asMutualHexagram: string
    asChangedHexagram: string
    cautions: string[]
  }

  lines: [
    LocalLineKnowledge,
    LocalLineKnowledge,
    LocalLineKnowledge,
    LocalLineKnowledge,
    LocalLineKnowledge,
    LocalLineKnowledge
  ]
}

export interface LocalLineKnowledge {
  index: 1 | 2 | 3 | 4 | 5 | 6
  classicText: string
  xiaoXiang: string
  plainText: string
  plainXiaoXiang: string
  coreMeaning: string
  favorableMeaning?: string
  cautionMeaning?: string
}
```

`classic` 字段来自公开古籍。

`localMeaning` 必须明确标注：

> Oraculum 项目现代释义

不能冒充古籍。

---

## 8. 不要运行时“生成白话”

既然决定不用 AI，推荐：

```text
开发阶段：
64 卦 + 384 爻逐条整理成固定本地数据

运行阶段：
纯查表 + 确定性模板
```

不要继续靠 keywords 临时拼句，否则仍会出现“互卦提示过程中的状态”这种空洞文案。

---

## 9. 固定解释模板

### 本卦

```text
本卦「{name}」——当前主旨

原文：{judgment}
彖曰：{tuan}
象曰：{daXiang}

白话：{plain}
本次作为本卦：{asBaseHexagram}
```

### 动爻

```text
动爻：第 {n} 爻

爻辞：{classicText}
象曰：{xiaoXiang}

白话：{plainText}
本次变化提示：{coreMeaning}
```

### 互卦

```text
互卦「{name}」——中间过程

根据《梅花易数》“互为中间之应”。

原文：...
白话：...
本次作为互卦：{asMutualHexagram}
```

### 变卦

```text
变卦「{name}」——后续趋向

根据《梅花易数》“变为事占之终应”。

原文：...
白话：...
本次作为变卦：{asChangedHexagram}
```

---

## 10. 新的纯本地 interpretation engine

建议：

```text
src/engine/localInterpretation/
├─ types.ts
├─ selectKnowledge.ts
├─ interpretBaseHexagram.ts
├─ interpretMovingLines.ts
├─ interpretMutualHexagram.ts
├─ interpretChangedHexagram.ts
├─ interpretBodyUse.ts
├─ composeMeihuaInterpretation.ts
└─ composeLiuyaoInterpretation.ts
```

输入：
- `MeihuaResult`
- `LiuYaoResult`
- `ClassicEvidence`
- `Rating`
- `RatingBreakdown`
- `CalendarContext`
- `QuestionCategory`

输出：

```ts
interface LocalDetailedInterpretation {
  overview: string
  base: LocalInterpretationSection
  movingLines: LocalInterpretationSection[]
  mutual?: LocalInterpretationSection
  changed?: LocalInterpretationSection
  bodyUse?: LocalInterpretationSection
  synthesis: string
  favorable: string[]
  constraints: string[]
  actionTips: string[]
}
```

---

## 11. 彻底删除 AI

目标不是隐藏 AI 按钮，而是整个代码库不再有大模型调用能力。

至少删除：
- `server/`
- `src/components/ai/`
- `src/services/ai.ts`
- `src/types/ai.ts`
- AI settings / token / provider / health / follow-up / moderation
- AI session

---

## 12. package.json 清理

全局确认没有其他用途后删除：
- `openai`
- `express`
- `express-rate-limit`
- `dotenv`
- `@types/express`
- `@types/express-rate-limit`
- `concurrently`

`zod` 只有在确认其他本地校验不再使用时才删除。

删除 scripts：
- `dev:server`
- `dev:full`
- `build:server`
- `start`
- `ai:smoke`（若存在）

最终 `build` 回到纯前端：

```text
vue-tsc --noEmit && vite build
```

---

## 13. `.env`

如果不再有任何 secret 功能：
- 删除 `.env.example`
- README 删除所有 API Key 配置
- 本地 `.env` 如果只用于 AI，提示用户自行删除
- 绝不打印、提交真实 key

---

## 14. IndexedDB 删除 `aiSessions`

当前 DB 已有 `aiSessions`。

应新增 Dexie schema version，例如：

```ts
this.version(3).stores({
  aiSessions: null
})
```

Dexie 官方文档明确说明：删除 object store 需要在新版本 schema 中显式设为 `null`。

来源：
https://dexie.org/docs/Tutorial/Understanding-the-basics

然后删除：
- `AiSession` type
- `aiSessions!: Table`
- `getAiSession`
- `saveAiSession`
- AI session export/import
- 删除历史时对 aiSessions 的旧级联逻辑

保留：
- history
- settings

旧历史不能丢。

---

## 15. 删除 server 后的运行方式

纯静态 PWA：

开发：
```bash
npm run dev
```

生产：
```bash
npm run build
```

生成 `dist/`，可以直接静态托管。

核心功能全部离线。

---

## 16. ResultView 建议顺序

```text
本次所问
卦象

核心解读
  本卦
  动爻
  互卦
  变卦
  体用
  综合

传统评分
  总分
  RatingBreakdown

六爻规则状态（六爻模式）
经典原文证据
起卦依据
现实行动提示
```

经典原文应直接成为核心解读的依据，而不是一个不起眼的独立卡片。

---

## 17. KnowledgeView

点击某卦可展开：
- 卦辞
- 彖传
- 大象
- 初爻～上爻
- 每爻小象
- Oraculum 现代释义
- 来源

支持搜索：
- 卦名
- 原文
- 关键词

---

## 18. 来源原则

优先级：

```text
A. 《周易》经文
B. 《彖传》《象传》
C. 《梅花易数》
D. 公有领域古注
E. Oraculum 自撰现代释义
```

不要：
- 复制现代商业算命网站
- 把现代解释冒充古籍
- 运行时联网抓文本
- 依赖大模型生成解释

---

## 19. 主要网络来源

### 周易
- 随：https://zh.wikisource.org/zh-hans/周易/随
- 随《彖传》：https://ctext.org/book-of-changes/sui1/zh
- 渐：https://zh.wikisource.org/zh-hans/周易/渐
- 渐《彖传》：https://ctext.org/book-of-changes/jian3/zhs
- 兑：https://zh.wikisource.org/zh-hans/周易/兑
- 兑《彖传》：https://ctext.org/book-of-changes/dui1/zhs

### 梅花易数
- 卷二：https://zh.wikisource.org/zh-hans/梅花易数/卷二
- 卷二 CText：https://ctext.org/wiki.pl?chapter=475043&if=en
- 卷三：https://ctext.org/wiki.pl?chapter=830866&if=gb

### 古注参考
- 《周易正义·渐》：https://zh.wikisource.org/zh-hans/周易正义/05渐
- 《周易正义·兑》：https://zh.wikisource.org/zh-hans/周易正义/06兑

---

## 20. 版本建议

这次 AI/server 整体移除属于产品架构大改，建议：

```text
APP_VERSION = 4.0.0
DATASET_VERSION = 3.0.0
LOCAL_KNOWLEDGE_VERSION = 1.0.0
```

如果起卦算法和六爻评分规则不变：

```text
RULESET_VERSION 保持 4.0.0
```

---

## 21. 验收标准

至少验证：
1. 不存在 `openai` import
2. 不存在 `/api/ai`
3. 不存在 AI 按钮
4. 不存在 AI 设置
5. package.json 无 openai / express
6. `server/` 删除
7. aiSessions DB store 已迁移删除
8. 旧 history 仍可读取
9. 离线完整可用
10. 64 卦卦辞非空
11. 64 卦彖传非空
12. 64 卦大象非空
13. 384 爻辞非空
14. 小象数据完整
15. 现代释义完整
16. 本卦原文+解释显示
17. 动爻原文+解释显示
18. 互卦原文+过程解释显示
19. 变卦原文+趋势解释显示
20. `npm run lint`
21. `npm run test`
22. `npm run validate`
23. `npm run build`

---

## 22. 最终目标

不再输出：

```text
互卦「渐」提示过程中的状态。
```

而是：

```text
互卦「渐」——中间过程

《周易》：
渐：女归吉，利贞。

《彖传》：
渐之进也……止而巽，动不穷也。

Oraculum 现代释义：
“渐”的核心是有次序地推进，而不是突然跳跃。

本次作为互卦：
《梅花易数》把互卦视为“中间之应”，
因此这里表示事情的中间过程更偏向循序渐进，
需要时间、步骤和持续积累。
```

这就是纯本地 Oraculum 应达到的解释质量。
