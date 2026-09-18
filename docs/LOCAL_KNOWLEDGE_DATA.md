# 本地知识数据

> 版本：LOCAL_KNOWLEDGE_VERSION 1.0.0 · 严格区分古籍原文与 Oraculum 现代释义

## 目录结构

```
src/local-data/
├─ classics/                    古籍原文（public domain）
│  ├─ zhouyi.ts                 64 卦卦辞 + 384 爻辞 + 用九/用六
│  ├─ tuan.ts                   64 卦《彖传》
│  ├─ daxiang.ts                64 卦《大象传》
│  ├─ xiaoxiang.ts              384 条《小象传》
│  └─ sources.ts                 每条文本的来源 URL
├─ interpretation/              Oraculum 现代释义（非古籍）
│  ├─ hexagramMeanings.ts        64 卦完整现代释义 Part 1
│  ├─ hexagramMeaningsPart2.ts  64 卦完整现代释义 Part 2
│  ├─ lineMeanings.ts            爻位通用含义
│  ├─ trigramMeanings.ts         八卦现代释义
│  ├─ roleMeanings.ts            卦象角色（本卦/互卦/变卦）通用说明
│  └─ categoryHints.ts           问题类别行动提示
├─ meihua/
│  ├─ roles.ts                   梅花易数体用互变角色定义
│  └─ bodyUseMeanings.ts         体用五行关系含义
├─ types.ts                      数据类型定义
└─ index.ts                      统一导出 + getHexagramKnowledge()
```

## 数据类型

### LocalHexagramKnowledge（单卦完整知识）

```typescript
interface LocalHexagramKnowledge {
  kingWen: number                    // 周文王序 1-64
  name: string                       // 卦名（简体）

  classic: {                         // 古籍原文层
    judgment: string                 // 卦辞
    tuan: string                     // 彖传
    daXiang: string                  // 大象传
    sourceRefs: string[]             // 来源 URL
  }

  localMeaning: {                    // Oraculum 现代释义层（非古籍）
    plainJudgment: string            // 卦辞白话
    plainTuan: string                // 彖传白话
    plainDaXiang: string             // 大象传白话
    coreMeaning: string              // 核心含义
    keyThemes: string[]              // 主题关键词（搜索标签用）
    asBaseHexagram: string           // 作为本卦（当前主旨）的解释
    asMutualHexagram: string         // 作为互卦（中间过程）的解释
    asChangedHexagram: string        // 作为变卦（后续趋向）的解释
    cautions: string[]              // 注意事项
  }

  lines: [                           // 六爻知识（自下而上）
    LocalLineKnowledge, ... 6 items
  ]
}
```

### LocalLineKnowledge（单爻知识）

```typescript
interface LocalLineKnowledge {
  index: 1 | 2 | 3 | 4 | 5 | 6       // 爻位 1=初 ... 6=上
  classicText: string                // 爻辞原文
  xiaoXiang: string                  // 小象传原文
  plainText: string                  // Oraculum 现代释义——爻辞白话
  plainXiaoXiang: string             // Oraculum 现代释义——小象白话
  coreMeaning: string                // 此爻核心含义
  favorableMeaning?: string          // 有利面（可选）
  cautionMeaning?: string             // 警示面（可选）
}
```

## 数据完整性

| 数据项 | 数量 | 状态 |
|---|---|---|
| 卦辞 | 64 | 完整 |
| 爻辞 | 384 | 完整 |
| 用九 / 用六 | 2 | 完整（乾坤） |
| 彖传 | 64 | 完整 |
| 大象传 | 64 | 完整 |
| 小象传 | 384 | 完整 |
| Oraculum 现代释义——卦 | 64 | 完整 |
| Oraculum 现代释义——爻 | 384 | 完整 |
| sourceRefs | 64 卦 | 每卦至少 1 条维基文库 URL |

## 严格区分原则

- **`classics/`** 目录下的所有文本为古籍原文，来源已标注，属于公共领域（PD-old）。
- **`interpretation/`** 目录下的所有文本为 **Oraculum 现代释义**，是本项目对古籍的现代白话解读与应用提示，**不是古籍原文**。
- 两者在 UI 中明确分区展示，现代释义区域标注"Oraculum 现代释义"。

## 查找 API

```typescript
import { getHexagramKnowledge } from './local-data'

const knowledge = getHexagramKnowledge(17) // 随卦
// 未收录时返回 undefined，引擎会使用降级模板
```
