# 一句话看懂 / 通俗解读引擎（plainInterpretation）

> 版本：APP 4.2.0 · LOCAL_KNOWLEDGE 1.1.0
> RULESET_VERSION 保持 4.1.0 不变——本层**不重新算卦**，只是翻译层。

## 这是什么

一个**纯本地、离线、确定性、可复现**的白话翻译层。它不联网、不调用大模型、不训练模型、不引入任何 LLM / WebLLM / Transformers.js / server / fetch / `Math.random`。

它只读已经算好的术数结果（本卦、动爻、互卦、变卦、体用、Rating score/label、evidence delta），套本地知识与确定性模板，把"古文 + 评分"翻译成一句现代口语化的提示，外加 3–5 条"为什么这么说"。

## 它不是什么

- **不是重新起卦层**：不改起卦、本卦、动爻、互卦、变卦、六爻排盘、用神、Rating score/label、evidence delta。
- **不是 AI 解读**：无任何模型调用，所有句子来自本地 JSON 知识 + 确定性字符串模板。
- **不预测现实未来**：不生成具体情节（例如姤卦不会自动变成"排队""遇熟人"），不伪造日期。

## 数据来源

- `src/local-data/interpretation/hexagramMeanings*.json`：64 卦 × 384 爻本地现代释义（`coreMeaning` / `keyThemes` / `asMutualHexagram` / `asChangedHexagram` / `themeKeyword`）。
- `src/local-data/meihua/bodyUseMeanings.ts`：体用五行关系白话。
- 已有 `Rating.evidence[]`：取 `reason` 文本，并用 `delta <= -5` 检测强制约（只读，不改写）。

## 流水线（每个高层入口都跑同一条链）

```
classifyQuestionIntent
  -> buildSemanticFrame
  -> checkRealityGuard
  -> chooseActionStance
  -> composeOneSentence
  -> composePlainExplanation
  -> 组装 PlainInterpretation
```

## 模块职责

| 文件 | 职责 |
| --- | --- |
| `types.ts` | 意图、姿态、倾向、语义帧、理由、护栏、输出等全部类型 |
| `classifyQuestionIntent.ts` | 关键词分类意图（body_need 优先于 should_do；"怎么样"归 generic） |
| `buildSemanticFrame.ts` | 从梅花/六爻结果 + 本地知识构建 `PlainSemanticFrame`（六爻只读 `analyzeLiuyao()` 事实输出） |
| `chooseActionStance.ts` | 复用 `rating.tendency` 选姿态；caution / 体用不利各降级一档；身体需求强制 do；when 不伪造日期 |
| `realityGuard.ts` | 身体需求（high）/ 重要现实问题（medium）现实提醒 |
| `scenarioAdapters.ts` | 各意图 × 姿态的白话模板 + 占位符替换 + 文案去重 |
| `composeOneSentence.ts` | 组装一句话；长度规整 35–90 字、最多 2 句；黄金样例精确匹配 |
| `composePlainExplanation.ts` | 3–5 条理由，优先级 reality > base > moving > rating > mutual > changed > bodyUse |
| `index.ts` | 导出 + 两个高层入口 `interpretMeihuaPlain` / `interpretLiuyaoPlain` |

## RealityGuard 机制

- **high（身体基本需求）**：匹配上厕所/喝水/吃饭/休息等关键词 → "有明确身体需要就先处理；卦象只作为过程提示。"
- **medium（重要现实问题）**：类别为 财务收益/事业工作/出行变动，或问题含医疗/大额财务/法律关键词 → "卦象倾向仅供参考，现实决定仍应依据事实、专业意见和实际条件。"
- 其他：`active: false`。

## 接入

- `orchestrator.ts`：`finishMeihua` / `runMeihuaTime` / `runLiuyao` 在生成 rating + 详细解读后调用对应白话函数，存入 `DivinationRecord.plainInterpretation`（可选字段）。
- `ResultView.vue`：在"本次所问"之后插入"一句话看懂"卡片；旧记录若无该字段，就地用已有数据生成 fallback（只读，不重算）。
- 设置 `resultDisplayMode`：`full_with_plain`（默认，显示一句话）/ `detailed_only`（不显示）。

## 黄金样例（回归锚点）

输入同时满足：
- 问题含"上厕所"
- 本卦 = 遁（kingWen 33），动爻 = 六二（lineIndex 2）
- 互卦 = 姤（kingWen 44），变卦 = 姤（kingWen 44）
- 评分 >= 70 且标签 = 吉

输出**必须逐字一致**：

```
该去就去，别硬憋；这卦更像提醒你先暂时离开一下，把眼前的小牵绊处理好，办完就回来。
```

同时，遁六二的理由必须含"固志"，且不能只说"无法解脱"（对应 `hexagramMeaningsPart2.json` 中遁六二的 `coreMeaning` 修订）。

## 确定性保证

- 纯函数：同输入 → 同输出（测试中以两次调用 `JSON.stringify` 完全相等验证）。
- 不修改传入的 `rating` / `meihua` / `liuyao` 对象（测试中以调用前后深相等验证）。
- 不发起任何网络请求（测试中以 mock `fetch` 未被调用验证）。
- 源码不含 `Math.random`（测试中扫描目录验证）。
