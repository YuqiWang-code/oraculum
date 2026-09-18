# 本地确定性解读引擎

> 版本：LOCAL_KNOWLEDGE_VERSION 1.0.0 · 纯本地、离线、无大模型

## 设计原则

- **运行时不联网**：不发起任何 HTTP 请求，不调用任何 LLM / AI API。
- **确定性**：相同输入永远产生相同输出，可复现、可测试。
- **数据驱动**：所有解读内容来自 `src/local-data/` 预整理的本地知识数据，运行时只做查找和模板拼接。
- **古籍与释义分离**：经典原文（卦辞、彖传、大象、爻辞、小象）与 Oraculum 现代释义严格分字段，不混淆。

## 目录结构

```
src/engine/localInterpretation/
├─ types.ts                              输出类型定义
├─ selectKnowledge.ts                    本地知识查找 + 降级模板
├─ interpretBaseHexagram.ts              本卦解读
├─ interpretMovingLines.ts                动爻解读
├─ interpretMutualHexagram.ts            互卦解读
├─ interpretChangedHexagram.ts            变卦解读
├─ interpretBodyUse.ts                   体用五行解读
├─ composeMeihuaInterpretation.ts        梅花易数完整解读组合
└─ composeLiuyaoInterpretation.ts        六爻完整解读组合
```

## 输入

| 输入 | 类型 | 说明 |
|---|---|---|
| 梅花卦象 | `MeihuaResult` | 本卦、互卦、变卦、动爻、体用关系 |
| 六爻排盘 | `LiuYaoResult` | 本卦、变卦、动爻列表、用神、六亲、六神等 |
| 评分 | `Rating` | 总分、五档标签、评分证据列表 |
| 问题类别 | `QuestionCategory` | 事业/感情/财务/出行等 |

## 输出

```typescript
interface LocalDetailedInterpretation {
  overview: string                    // 一句话概览
  base: LocalInterpretationSection    // 本卦（当前主旨）
  movingLines: LocalInterpretationSection[]  // 动爻列表
  mutual?: LocalInterpretationSection  // 互卦（中间过程）
  changed?: LocalInterpretationSection // 变卦（后续趋向）
  bodyUse?: LocalInterpretationSection // 体用（五行关系）
  synthesis: string                   // 综合段落（数据+模板组合）
  favorable: string[]                 // 有利信号
  constraints: string[]                // 制约/警示信号
  actionTips: string[]                // 行动提示
  usefulGodReason?: string             // 用神理由（六爻用）
}
```

每个解读区块：

```typescript
interface LocalInterpretationSection {
  role: 'base' | 'moving_line' | 'mutual' | 'changed' | 'body_use'
  title: string
  classicTexts: ClassicTextRef[]   // 经典原文（卦辞/彖传/爻辞/小象）
  plainExplanation: string         // Oraculum 现代释义——白话
  roleExplanation: string          // 该卦象在本次问卦中的角色说明
}
```

## 梅花易数六部分解读

依据《梅花易数》：**体为主，用为事，互为中间之应，变为事占之终应。**

| 顺序 | 部分 | 角色 | 数据来源 |
|---|---|---|---|
| 1 | 本卦 | 当前主旨 | `localMeaning.asBaseHexagram` |
| 2 | 动爻 | 当前变化点 | `lines[].coreMeaning` |
| 3 | 互卦 | 中间过程 | `localMeaning.asMutualHexagram` |
| 4 | 变卦 | 后续趋向 | `localMeaning.asChangedHexagram` |
| 5 | 体用 | 主体与事情的五行关系 | `BODY_USE_MEANINGS` |
| 6 | 综合 | 数据+模板组合 | 各部分数据拼接 + 主题词收尾 |

综合段落不硬编码，而是从本卦、动爻、互卦、变卦的本地知识数据中分别提取句子，拼接为完整段落，最后以 `「主题词1—主题词2—主题词3—主题词4」` 收尾。

## 六爻解读

六爻解读基于：
- 本卦经典原文（卦辞 + 彖传）
- 全部动爻经典原文（爻辞 + 小象传）
- 变卦经典原文（卦辞）
- 用神 / 元神 / 忌神
- 旺衰、暗动 / 日破
- 合绊、回头生克、三合、进退、飞伏
- RatingBreakdown 评分证据

## 降级机制

当某卦未收录完整本地知识时：
1. 仍展示经典原文（卦辞 / 爻辞）
2. 使用 `editorialKeywords` 作为搜索标签
3. 白话解释显示"此卦的完整 Oraculum 现代释义尚在整理中"
4. 综合段落仍可通过降级模板生成

降级保证任何卦象都能产出结构完整的解读，不因数据缺失而崩溃。

## 测试

- 同输入同结果（确定性）
- 随→六二→互渐→变兑 黄金样例完整输出
- 离线无需 fetch
- 64 卦经典数据完整性校验
