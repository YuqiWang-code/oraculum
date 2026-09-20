# Oraculum v4.3.0 审计报告（基于 v4.2.0 基准 997121f）

> 审计时间：2026-09-20
> 基准 commit：`997121fdaf692c142097e5ccd5922af07630cd34`
> 当前版本：APP 4.2.0 / RULESET 4.1.0 / DATASET 3.0.0 / LOCAL_KNOWLEDGE 1.1.0

## 一、当前数据流一句话总结

```
起卦（梅花/六爻）→ Rating 评分 → PlainSemanticFrame（语义框架）
  → PlainInterpretation（一句话看懂 + reasons + realityGuard）
  → LocalDetailedInterpretation（传统综合解读 + 分项 + 有利/制约 + 行动提示）
  → ResultView 渲染
```

- `PlainInterpretation`：第一眼一句话，含 `oneLiner` / `stance` / `reasons[]` / `realityGuard` / `disclaimer`
- `LocalDetailedInterpretation`：传统研究层，含 `overview` / `base` / `movingLines[]` / `mutual?` / `changed?` / `bodyUse?` / `synthesis` / `favorable[]` / `constraints[]` / `actionTips[]`
- `LiuYaoAnalysis`（`analyze.ts`）：六爻统一事实源，含用神/角色/旺衰/日冲/合/变爻/三合/旬空/进退/飞伏

## 二、哪些"白话"只是古文直译

以下字段本质是"古文改简体 + 稍微顺句"，老人仍看不懂：

| 位置 | 字段 | 问题 |
|------|------|------|
| `localMeaning.plainJudgment` | 卦辞白话 | 如乾："大通顺。利于守正。"——仍含"守正"术语 |
| `localMeaning.plainTuan` | 彖传白话 | 基本是逐句翻译，保留"乾元""太和"等概念 |
| `localMeaning.plainDaXiang` | 大象传白话 | 如"天道运行刚健不息，君子因此自强不息"——仍是文言风格 |
| `lines[].plainText` | 爻辞白话 | 如"潜伏的龙，暂时不宜行动"——保留"龙"的比喻 |
| `lines[].plainXiaoXiang` | 小象白话 | 逐字翻译，如"因为阳气还在下位" |
| `LocalInterpretationSection.plainExplanation` | 分项白话 | 由上述数据组合，仍偏术语 |

## 三、哪些已是真正现代释义

| 位置 | 字段 | 评价 |
|------|------|------|
| `localMeaning.coreMeaning` | 卦核心含义 | 较好，如乾："代表刚健、创造、主动进取。但'利贞'强调…" |
| `localMeaning.asBaseHexagram` | 作为本卦解释 | 较好，有现实指向 |
| `localMeaning.asMutualHexagram` | 作为互卦解释 | 较好 |
| `localMeaning.asChangedHexagram` | 作为变卦解释 | 较好 |
| `localMeaning.cautions[]` | 注意事项 | 较好，如"刚健过头容易变成冒进" |
| `lines[].coreMeaning` | 爻核心含义 | 较好，如"力量尚在潜藏阶段，不宜贸然行动" |
| `lines[].cautionMeaning` | 爻警示 | 较好 |
| `PlainInterpretation.oneLiner` | 一句话看懂 | v4.2 新增，方向正确，质量较好 |
| `LocalDetailedInterpretation.actionTips[]` | 现实行动提示 | 能懂，但偏通用 |

## 四、哪些仍含传统术语

- "体用""世应""用神""元神""忌神""六亲""六神""纳甲""纳支"
- "守正""中正""刚健""柔顺""得位""失位""乘""承""比""应"
- "大运""流年""十神""天干地支""五行生克"
- "游魂""归魂""本宫""一世~五世"
- 卦名本身（如"归妹""噬嗑""夬"）对老人无意义

## 五、哪些地方不适合长辈阅读

1. **ResultView 传统分项卡**："白话"标签下实际是古文直译，老人看不懂
2. **综合解读 `synthesis`**：术语拼接，如"大蓄德行—舆说輹—出嫁归宿—文饰修饰"
3. **评分依据**：大量规则名和 delta 数字，无白话解释
4. **六爻规则状态**：本宫/世爻/应爻/评分分类，纯研究层
5. **经典证据**：原文直接展示，无翻译
6. **字号偏小**：正文 14px，`plain-oneliner` 19px，对长辈不够大
7. **`muted` 类大量使用**：低对比度文字，长辈阅读困难

## 六、哪些旧字段会继续保留作研究层

以下字段在 v4.3 中**不删除、不修改**，继续作为研究模式数据：

- `classic.judgment` / `classic.tuan` / `classic.daXiang` / `classic.sourceRefs`
- `localMeaning.plainJudgment` / `plainTuan` / `plainDaXiang`（古文直译，标签改为"古文直译"并默认折叠）
- `lines[].classicText` / `xiaoXiang` / `plainText` / `plainXiaoXiang`
- `LocalDetailedInterpretation` 全部字段
- `LiuYaoAnalysis` 全部字段
- `Rating` / `ScoreEvidence` / `RatingBreakdown`
- 起卦算法、评分算法、六爻排盘算法

## 七、v4.3 新增层定位

```
PlainInterpretation.oneLiner      → 第一眼一句话（已有，保留）
RealWorldPlainReading              → 完整现实白话（新增，默认展开）
LocalDetailedInterpretation        → 传统研究层（已有，研究模式完整显示）
```

三层职责分离，互不替代。新增层只读已有结果，不重新起卦、不改评分。
