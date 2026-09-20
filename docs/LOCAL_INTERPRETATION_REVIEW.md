# 本地解读回顾（LOCAL_INTERPRETATION_REVIEW）

> 版本：v4.3.0
> 关联文档：[V43_AUDIT.md](./V43_AUDIT.md)、[ELDER_FRIENDLY_INTERPRETATION.md](./ELDER_FRIENDLY_INTERPRETATION.md)、[LOCAL_INTERPRETATION_ENGINE.md](./LOCAL_INTERPRETATION_ENGINE.md)、[PLAIN_INTERPRETATION_ENGINE.md](./PLAIN_INTERPRETATION_ENGINE.md)
> 本文档同时保留 v4.2 阶段对 `hexagramMeanings*.json` 的直译问题审查记录（见附录 A）。

## 一、v4.2 现有解读层回顾

v4.2 有两层解读：

```
PlainInterpretation          → 一句话看懂 + reasons + realityGuard + disclaimer
LocalDetailedInterpretation  → 传统分项（本卦/动爻/互卦/变卦/体用/综合/有利/制约/行动提示）
```

### PlainInterpretation（v4.2 已有，质量较好）

| 字段 | 评价 |
|---|---|
| `oneLiner` | 第一眼一句话，方向正确，质量较好 |
| `stance` / `reasons[]` | 3-5 条理由，现实化 |
| `realityGuard` | 身体需求 high / 重要现实问题 medium，触发明确 |

### LocalDetailedInterpretation（v4.2 已有，研究层）

| 字段 | 评价 |
|---|---|
| `overview` | 一句话概览，可用 |
| `base` / `movingLines[]` / `mutual?` / `changed?` / `bodyUse?` | 分项卡，结构完整 |
| `synthesis` | 数据+模板拼接，但术语偏多 |
| `favorable[]` / `constraints[]` / `actionTips[]` | 现实化程度不一 |

## 二、哪些是古文直译，哪些是真正现代释义

### 古文直译（v4.2 实际是"古文改简体"）

| 位置 | 字段 | 问题 |
|---|---|---|
| `localMeaning.plainJudgment` | 卦辞白话 | 如乾："大通顺。利于守正。"——仍含"守正"术语 |
| `localMeaning.plainTuan` | 彖传白话 | 逐句翻译，保留"乾元""太和"等概念 |
| `localMeaning.plainDaXiang` | 大象传白话 | 如"天道运行刚健不息，君子因此自强不息"——仍是文言风格 |
| `lines[].plainText` | 爻辞白话 | 如"潜伏的龙，暂时不宜行动"——保留"龙"的比喻 |
| `lines[].plainXiaoXiang` | 小象白话 | 逐字翻译，如"因为阳气还在下位" |
| `LocalInterpretationSection.plainExplanation` | 分项白话 | 由上述数据组合，仍偏术语 |

### 真正现代释义（v4.2 已经较好）

| 位置 | 字段 | 评价 |
|---|---|---|
| `localMeaning.coreMeaning` | 卦核心含义 | 较好，有现实指向 |
| `localMeaning.asBaseHexagram` | 作为本卦解释 | 较好 |
| `localMeaning.asMutualHexagram` | 作为互卦解释 | 较好 |
| `localMeaning.asChangedHexagram` | 作为变卦解释 | 较好 |
| `localMeaning.cautions[]` | 注意事项 | 较好 |
| `lines[].coreMeaning` | 爻核心含义 | 较好 |
| `lines[].cautionMeaning` | 爻警示 | 较好 |
| `PlainInterpretation.oneLiner` | 一句话看懂 | 方向正确 |
| `LocalDetailedInterpretation.actionTips[]` | 现实行动提示 | 能懂，但偏通用 |

## 三、v4.3 改进

### 1. 新增 elderFriendly 数据层

写入 `src/local-data/interpretation/elderFriendly_XX_YY.json`，按周文王序 8 批 × 8 卦。

卦级 5 个字段：

- `elderFriendlySummary`：一句话总结这卦讲什么
- `realLifeNow`：现在是什么情况
- `realLifeProcess`：中间过程会怎样
- `realLifeLater`：后续会怎样
- `commonMisunderstanding`：老人最容易误解的点

爻级 3 个字段：

- `elderFriendlyMeaning`：这一爻在生活里意味着什么
- `realLifeAction`：这一爻对应的具体做法
- `realLifeCaution`：这一爻要当心什么

数据生成流程见 [LOCAL_LANGUAGE_DATA_DISTILLATION.md](./LOCAL_LANGUAGE_DATA_DISTILLATION.md)。

### 2. 新增 RealWorldPlainReading 引擎

`src/engine/realWorldInterpretation/`：

- 只读已有术数结果，不重新起卦、不改评分。
- 输出 `headline` / `currentSituation` / `why` / `howToAct` / `watchOutFor` / `timeline` / `realityGuard` / `disclaimer`。
- 完整数据结构见 [ELDER_FRIENDLY_INTERPRETATION.md](./ELDER_FRIENDLY_INTERPRETATION.md) 第三节。

### 3. 三层架构

```
PlainInterpretation.oneLiner        → 一句话（已有）
RealWorldPlainReading               → 现实白话（v4.3 新增，默认展开）
LocalDetailedInterpretation         → 传统研究层（已有，研究模式完整显示）
```

## 四、传统分项卡改造

### 标签改名

| 旧标签（v4.2） | 新标签（v4.3） |
|---|---|
| "白话解释" | **"古文直译"** |
| "本次角色" | **"放到你这个问题里"** |

### 默认折叠

- `plainExplanation`（古文直译）在 v4.3 **默认折叠**，研究模式下也折叠，需要用户点开。
- 原因：审计确认这些字段实际是古文直译，不是现代释义（见 [V43_AUDIT.md](./V43_AUDIT.md) 第二节）。

### 人话解释

- 分项卡新增"人话解释"区块，直接读 `RealWorldPlainReading` 对应字段。
- "放到你这个问题里"：把 `roleExplanation` 从"互卦代表中间过程"这类通用话，改成"放到你这次问的事里，中间这段会是……"。

## 五、数据兼容性

### 旧字段全部保留

v4.3 **不删除、不修改**以下旧字段：

- `classic.judgment` / `classic.tuan` / `classic.daXiang` / `classic.sourceRefs`
- `localMeaning.plainJudgment` / `plainTuan` / `plainDaXiang`
- `lines[].classicText` / `xiaoXiang` / `plainText` / `plainXiaoXiang`
- `LocalDetailedInterpretation` 全部字段
- `LiuYaoAnalysis` 全部字段
- `Rating` / `ScoreEvidence` / `RatingBreakdown`
- 起卦算法、评分算法、六爻排盘算法

旧记录（v4.2 起卦并存入 IndexedDB）打开时：

- 旧字段照常显示（标签改为"古文直译"并默认折叠）。
- 新增的 `RealWorldPlainReading` 字段如果缺失，前端**就地用已有数据生成 fallback**（只读，不重算卦），不写回数据库。

### 新字段可选注入

- `DivinationRecord` 新增可选字段 `realWorldPlainReading?`。
- 旧记录没有这个字段也不报错。
- 新起卦时才写入。

## 六、阅读模式迁移

### 设置项改名

| 旧字段（v4.2） | 新字段（v4.3） | 取值 |
|---|---|---|
| `resultDisplayMode` | `readingMode` | `'simple'`（简明模式，默认）/ `'research'`（研究模式） |

### 取值迁移

- v4.2 `resultDisplayMode: 'full_with_plain'` → v4.3 `readingMode: 'simple'`
- v4.2 `resultDisplayMode: 'detailed_only'` → v4.3 `readingMode: 'research'`
- 迁移在设置加载时一次性完成，不写回数据库，只在内存中映射。

### 两模式显示内容

| 模式 | 显示 |
|---|---|
| `simple`（默认） | headline + currentSituation + howToAct + watchOutFor + timeline + disclaimer |
| `research` | simple 全部 + LocalDetailedInterpretation 完整分项 + 经典原文 + 评分证据 + 六爻规则状态 |

---

## 附录 A：v4.2 阶段 `hexagramMeanings*.json` 直译问题审查记录

> 本节保留 v4.2 阶段对 `plainText` / `plainXiaoXiang` / `coreMeaning` 仅逐字直译、忽略小象传白话的问题登记。
> 本轮**只修订遁六二**，其余条目先登记，后续分批重写。

### 遁卦（kingWen=33）

#### 遁 · 六二（lines[1]）—— 已修订 ✅

- **当前问题**（修订前）：`plainText` 仅逐字重复爻辞；`plainXiaoXiang` 只标注"固志"二字；`coreMeaning` "用黄牛皮绳绑住，无法解脱"只取字面，忽略小象"固志"的主动含义。
- **修订结果**：
  - `plainText` → "用黄牛皮绳牢牢捆住，没有人能解开。比喻意志坚定、立场牢固，不轻易动摇。"
  - `plainXiaoXiang` → 点明重点在"固志"——把自己的决定和立场稳住。
  - `coreMeaning` → "意志坚定如皮革捆绑……小象强调'固志'，不是单纯被束缚。"
- **后续方向**：保持"固志"为核心，避免任何"被束缚、解不开、被困"的负面误导。

#### 遁 · 初六（lines[0]）—— 待重写

- **当前问题**：`plainText` 仅为"初六：遁尾，厉，勿用有攸往。"逐字转简体，无现代释义；`plainXiaoXiang` "《象传》：遁尾之厉，不往何灾。"只是转写；`coreMeaning` "退避落在最后，有危，不可前往。"未点出小象"不往何灾"——即只要不冒进、停住，危自解。
- **建议方向**：`coreMeaning` 补一层"退在最后本有危，但只要停住不往前赶，灾就落不到身上"；`plainText` / `plainXiaoXiang` 从转写改为白话。

#### 遁 · 九三（lines[2]）—— 待重写

- **当前问题**：`plainText` / `plainXiaoXiang` 仍为逐字转写；`coreMeaning` 虽提到"有疾惫""不可大事"，但"系遁"（被牵绊住才退）这一关键意象没有白话展开。
- **建议方向**：`plainText` 补"心里还挂着事、退不干净"；`coreMeaning` 强调"宜做小事、不宜挑大梁"。

#### 遁 · 九四（lines[3]）—— 待重写

- **当前问题**：`plainText` / `plainXiaoXiang` 逐字转写；`coreMeaning` "有所好而能退，君子吉，小人做不到。"对"好遁"（把自己喜好的东西割舍掉还能退）解释偏简略。
- **建议方向**：`plainText` 补"真心喜欢的东西也舍得放下，这才是真退"。

#### 遁 · 九五（lines[4]）—— 待重写

- **当前问题**：`plainXiaoXiang` "《象传》：嘉遁贞吉，以正志。"逐字转写；`coreMeaning` "嘉美而退，守正吉。"未点出小象"以正志"——退也要退得光明正大、出于正当志向。
- **建议方向**：`coreMeaning` 补"进退都堂堂正正，志在端正"。

#### 遁 · 上九（lines[5]）—— 待重写

- **当前问题**：`plainText` / `plainXiaoXiang` 逐字转写；`coreMeaning` "宽裕从容地退避，无不利。"未点出小象"无所疑"——心中没有疑虑才能退得彻底。
- **建议方向**：`coreMeaning` 补"心无挂碍、不再犹豫，退得干净才无不利"。

### 扫描时发现的通用问题（其他卦待抽样复核）

> 以下为按相同标准扫描时**疑似**命中"只逐字直译、忽略小象"的模式，尚未逐卦核对原文，登记为待复核队列。

- **疑似模式 A**：`plainText` 以"X：爻辞原文转简体"开头，等同把 `classicText` 转写一遍，没有白话（遁卦六爻几乎全部命中此模式）。
- **疑似模式 B**：`plainXiaoXiang` 以"《象传》："开头后只复述小象短语，未解释"为什么"。
- **疑似模式 C**：`coreMeaning` 只取爻辞字面结果，丢失小象传给出的"因 / 所以"。

后续工作建议：按 A→B→C 优先级逐卦抽查，优先修有"固定动爻 + 黄金样例"用到的爻。
