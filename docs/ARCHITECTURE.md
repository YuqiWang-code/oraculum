# 架构说明

## 三层分离

```
输入(时间/问题/类别)
   │
   ▼
[经典资料层]  src/data/*.ts   八卦/64卦/八宫/纳甲/六亲/六神/神煞（只读常量，带 source）
   │
   ▼
[确定性规则引擎] src/engine/
   ├─ calendar/      封装 lunar-javascript → CalendarContext
   ├─ hexagram/      编码、动爻变卦、互卦
   ├─ meihua/        时间起卦 meihua_time_v1、体用
   ├─ liuyao/        排盘 layout、伏神、评分
   ├─ scoring/       五档映射 buildRating
   └─ interpretation/ 模板化现代解读（只读结构化结果）
   │
   ▼
[UI] src/views, src/components   不写算法，只渲染
   │
   ▼
[持久化] src/db (Dexie/IndexedDB)  保存 ruleVersion + datasetVersion
```

## 数据流

1. 用户在 `DivinationView` 输入问题，提交 `DivinationInput`。
2. `orchestrator.runMeihuaTime` / `runLiuyao` 串起：历法 → 起卦 → 排盘 → 评分 → 解读。
3. 产出 `DivinationRecord`，含输入、历法、卦象、评分证据链、现代解读、两个版本号。
4. `ResultView` 渲染；`saveRecord` 写入 IndexedDB。
5. 历史记录按 `createdAt` 倒序，可搜索/导出/导入。

## 关键原则

- 卦象、干支、动爻、评分基础数据**只由 TypeScript 纯函数生成**，AI/语言模型不参与。
- 经典原文（judgmentClassic / lineTextsClassic）与现代解读严格分字段。
- 每个加减分都生成 `ScoreEvidence{id,title,delta,reason,sourceRule}`，可解释。
- 同输入 + 同 ruleVersion 必得同结果（有测试锁定）。
