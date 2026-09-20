# Oraculum「通俗一句话解读」引擎：网络调研与设计方案

> 项目：`https://github.com/YuqiWang-code/oraculum`
>
> 当前架构：Vue 3 + TypeScript + Vite + PWA，纯本地、离线、确定性，不使用云端 AI。
>
> 目标：把卦辞、彖传、象传、动爻、互卦、变卦以及已有评分，转换成普通人一眼能懂的现代口语，并在结果页最上方给出一句类似：
>
> `该去就去，别硬憋；这卦更像提醒你先暂时离开一下，把眼前的小牵绊处理好，办完就回来。`

## 1. 结论：不需要训练模型

这个功能完全可以不训练模型。

对 Oraculum 当前项目，最佳方案不是重新接 AI，也不是训练一个新模型，而是：

```text
已有 64 卦 / 384 爻本地知识
+
问题意图识别
+
卦象语义结构化
+
确定性“口语化模板”
+
现实场景保护规则
=
一句话通俗解读
```

原因：

1. Oraculum 已经有大量结构化本地数据：64 卦卦辞、彖传、大象、384 爻辞、小象、`coreMeaning`、`themeKeyword`、本卦/互卦/变卦角色释义、评分和 evidence。
2. 用户真正缺的是“古文说了什么”和“放到我这个问题里，最简单一句话是什么”。
3. 这可以拆成语义取值、场景映射、模板组合，不需要大模型。
4. 当前产品强调纯本地、PWA、iPhone 8 等老设备也能用、离线可用，因此规则化本地生成更适合。

## 2. 为什么不建议现在训练模型

“训练模型”至少有三种不同含义：

### 从头训练语言模型
没有必要，成本、数据量、训练硬件和部署复杂度都远超需求。

### 微调已有语言模型
也不是当前优先方案。只有未来积累了大量高质量“卦象输入 → 人工通俗解读”配对数据，并且愿意承担模型权重和推理环境成本，才值得考虑。

### 直接调用现成大模型
这不需要训练，只需现成模型 + 结构化卦象 + Prompt。但 Oraculum 已主动删除 AI/后端，而且你之前遇到 API 不稳定，因此没必要回到这条路。

## 3. 浏览器本地 LLM 为什么也不适合 Oraculum

Hugging Face Transformers.js 官方说明：
- 可以在浏览器运行预训练模型；
- 默认可通过 WASM 在 CPU 执行；
- 也可以使用 WebGPU；
- 对资源受限的浏览器建议使用量化模型。

来源：
https://huggingface.co/docs/transformers.js/en/index

WebLLM 可以在浏览器本地运行 LLM，但依赖 WebGPU：
https://github.com/mlc-ai/web-llm

问题：
- Safari / iOS 的 WebGPU 支持是版本相关的；
- 旧设备兼容性不能保证；
- 浏览器端 LLM 需要额外下载模型权重；
- 会增加首屏下载、缓存、内存和启动时间；
- WebLLM 社区已有 iOS Safari 加载较大模型后页面被系统终止的案例。

来源：
https://huggingface.co/docs/transformers.js/guides/webgpu
https://github.com/mlc-ai/web-llm/issues/753

对于希望 iPhone 8 也能用的轻量 PWA，不建议为了“一句话解释”塞进浏览器 LLM。

## 4. DeepSeek 示例中一个重要问题

遁卦六二：

```text
六二：执之用黄牛之革，莫之胜说。
```

《象传》：

```text
执用黄牛，固志也。
```

可核对：
https://ctext.org/book-of-changes/dun/zhs

因此只解释为“被黄牛皮绳绑住，无法解脱”太字面，容易误导。

《象传》强调的是“固志”：
- 立场牢固
- 意志坚定
- 不轻易改变

新的通俗引擎必须使用：

```text
爻辞 + 小象 + 本地 coreMeaning
```

共同生成现代释义，不能只逐字翻译。

## 5. “别硬憋”来自现实问题，不来自古籍

“该去就去，别硬憋”不是《周易》原文，而是来自：

```text
用户现实问题 = 上厕所
```

所以系统必须分两层：

### 传统象意层

```text
遁 = 暂退 / 离开 / 顺时而退
六二 = 稳住立场 / 有所牵系
姤 = 相遇 / 临时接触
```

### 现实常识层

```text
用户明确说“想上厕所”
→ 有明显生理需要就先处理
→ 不应该让卦象阻止正常身体需求
```

最终一句话是两层组合，不能把现实常识伪装成古籍结论。

## 6. 推荐功能名称

不要叫“AI 解读”。

建议：

```text
一句话看懂
```

或：

```text
通俗解读
```

结果页示例：

```text
一句话看懂
该去就去，别硬憋；这卦更像提醒你先暂时离开一下，把眼前的小牵绊处理好，办完就回来。

为什么这么说？
遁：暂时退一步
六二：立场要稳
姤：中途可能有新的接触或小插曲
```

## 7. 推荐目录

```text
src/engine/plainInterpretation/
├─ types.ts
├─ classifyQuestionIntent.ts
├─ buildSemanticFrame.ts
├─ chooseActionStance.ts
├─ realityGuard.ts
├─ scenarioAdapters.ts
├─ composeOneSentence.ts
├─ composePlainExplanation.ts
└─ index.ts
```

## 8. 问题意图识别

不需要模型。

```ts
type PlainQuestionIntent =
  | 'should_do'
  | 'when'
  | 'will_happen'
  | 'how_to'
  | 'person_relation'
  | 'body_need'
  | 'lost_item'
  | 'generic'
```

示例：

```text
该不该 / 要不要 / 可以不可以
→ should_do

什么时候 / 何时 / 多久
→ when

会不会 / 能不能成功
→ will_happen

怎么 / 如何 / 怎么办
→ how_to

厕所 / 上厕所 / 方便 / 尿急
→ body_need
```

`body_need` 优先级高于 `should_do`。

识别不可靠时回退 `generic`，不要强行分类。

## 9. SemanticFrame

```ts
interface PlainSemanticFrame {
  question: string
  category: QuestionCategory
  intent: PlainQuestionIntent

  rating: {
    score: number
    label: string
    tendency:
      | 'positive'
      | 'slightly_positive'
      | 'neutral'
      | 'slightly_negative'
      | 'negative'
  }

  base: {
    name: string
    theme: string
    plainMeaning: string
  }

  moving: {
    lineIndex: number
    theme: string
    plainMeaning: string
  }[]

  mutual?: {
    name: string
    theme: string
    plainMeaning: string
  }

  changed?: {
    name: string
    theme: string
    plainMeaning: string
  }

  bodyUse?: {
    favorable: boolean
    plainMeaning: string
  }

  evidence: string[]
}
```

只读取当前本地确定性结果。

## 10. ActionStance

```ts
type ActionStance =
  | 'do'
  | 'do_cautiously'
  | 'small_step'
  | 'wait'
  | 'avoid'
  | 'neutral'
```

不要新建第二套术数评分。

顺序：

```text
现实保护规则
↓
intent
↓
rating label / score
↓
本卦主题
↓
动爻关键约束
↓
体用
```

## 11. RealityGuard

```ts
interface RealityGuardResult {
  active: boolean
  priority: 'low' | 'medium' | 'high'
  message?: string
}
```

### 身体基本需求

如：
- 上厕所
- 喝水
- 正常吃饭
- 正常休息

不能因为卦象偏凶输出“不要去厕所”“继续憋”。

应该是：

```text
有明确身体需要就先处理；卦象只作为过程提示。
```

### 重要现实问题

医疗、较大金额、职业、出行安全、法律等：

不要说“按卦象一定应该……”。

改成：

```text
卦象倾向……，现实决定仍应依据事实、专业意见和实际条件。
```

## 12. 场景 Adapter

```ts
interface ScenarioAdapter {
  opening: Partial<Record<ActionStance, string>>
  realitySuffix?: string
}
```

### should_do

`do`：
```text
可以做，别想太多；{basePhrase}，{movingPhrase}。
```

`do_cautiously`：
```text
可以做，但别硬冲；{movingPhrase}，先把关键条件处理好再行动。
```

`small_step`：
```text
可以先试一步，别一次把决定做死；{changedPhrase}。
```

`wait`：
```text
先别急着做；现在更适合{basePhrase}，等条件清楚一点再动。
```

`avoid`：
```text
现在不太适合硬上；先把{mainConstraint}解决，再考虑下一步。
```

## 13. body_need

黄金样例：

```text
该去就去，别硬憋；这卦更像提醒你先暂时离开一下，把眼前的小牵绊处理好，办完就回来。
```

不要写成：
- 一定排队
- 一定遇熟人
- 一定有人打电话

如果姤出现，可以写：

```text
过程中可能有临时接触或小插曲
```

这只是象意，不是事实预测。

## 14. 一句话长度

建议 35–90 个汉字，最多 2 句。

下面再放“为什么这么说？”。

## 15. Reason 列表

```ts
interface PlainReason {
  id: string
  source:
    | 'base_hexagram'
    | 'moving_line'
    | 'mutual_hexagram'
    | 'changed_hexagram'
    | 'body_use'
    | 'rating'
    | 'reality'
  label: string
  explanation: string
}
```

最多 3–5 条。

## 16. 需要新增 64×384 数据吗？

不需要重新写全部。

当前已经有：
- `hexagram.localMeaning`
- `line.coreMeaning`
- `line.themeKeyword`

先复用。

只有少数仍太书面的爻，再逐步增加：

```ts
colloquialAction?: string
```

不用一次重写 384 条。

## 17. 保持确定性

同一个：
- question
- category
- hexagram
- moving line
- rating
- ruleset

必须生成完全一样的一句话。

不要：
- `Math.random()`
- 随机模板
- 网络请求

## 18. 不得推翻评分

通俗解释层不能：
- 改 score
- 改 label
- 改本卦
- 改动爻
- 改互卦
- 改变卦
- 改用神

只读已有结果。

## 19. 最终类型

```ts
interface PlainInterpretation {
  oneLiner: string
  stance: ActionStance
  reasons: PlainReason[]
  realityGuard?: string
  disclaimer: string
}
```

## 20. 遁六二推荐输出

问题：

```text
我该不该去上厕所？
```

输入：

```text
本卦：遁
动爻：六二
互卦：姤
变卦：姤
评分：77 吉
```

一句话：

```text
该去就去，别硬憋；这卦更像提醒你先暂时离开一下，把眼前的小牵绊处理好，办完就回来。
```

为什么：

```text
遁：有暂退、离开当前状态的意味。
六二：小象强调“固志”，重点是把自己的决定稳住。
姤：中后段有相遇、临时接触或小插曲的象意。
77·吉：整体倾向偏顺。
```

## 21. 六爻也支持

六爻一句话只抽：
- 最强正面 evidence
- 最强制约 evidence
- 总体 stance

不要把所有六爻术语塞进一句话。

例如：

```text
可以推进，但别一口气压满；当前有助力，不过主要卡点还在时机和执行条件，先解决最关键的一项再往前。
```

## 22. UI

ResultView 最上方增加：

```text
本次所问
↓
一句话看懂
↓
综合解读
↓
分项解读
↓
评分
...
```

卡片：

```text
一句话看懂

该去就去，别硬憋；……

为什么这么说？ ▼
```

展开：
- 3–5 条 reasons
- realityGuard
- disclaimer

不要重复完整经文。

## 23. 版本建议

如果只增加解释层：

```text
APP_VERSION = 4.2.0
RULESET_VERSION = 4.0.0
LOCAL_KNOWLEDGE_VERSION = 1.1.0
```

不要升 `RULESET_VERSION`。

## 24. 测试

至少：
1. should_do 分类
2. when 分类
3. body_need 分类
4. generic fallback
5. body_need 优先覆盖 should_do
6. 遁六二黄金样例
7. 遁六二 reason 包含“固志”
8. 不以“无法解脱”作为唯一解释
9. 吉 + caution -> do_cautiously
10. neutral -> small_step/neutral
11. negative -> wait/avoid
12. body_need 不输出“继续憋”
13. oneLiner 长度符合范围
14. 同输入同输出
15. 不含随机数
16. reasons 可追溯到本地数据
17. 不改变 rating
18. 不改变 hexagram
19. 姤不自动等价成“排队”
20. 姤不自动等价成“遇熟人”
21. 高风险类别有 realityGuard
22. 梅花支持
23. 六爻支持
24. 断网可生成
25. 旧历史无 plainInterpretation 时仍可打开

## 25. 网络资料

《周易·遯》：
https://ctext.org/book-of-changes/dun/zhs

Transformers.js：
https://huggingface.co/docs/transformers.js/en/index

WebGPU：
https://huggingface.co/docs/transformers.js/guides/webgpu

WebLLM：
https://github.com/mlc-ai/web-llm

iOS Safari 大模型内存案例：
https://github.com/mlc-ai/web-llm/issues/753

## 26. 最终推荐

当前 Oraculum 最合适的是：

> 不训练模型、不重新接云端 AI，增加一个纯本地 deterministic “一句话看懂”引擎。

它的职责只是：

```text
把已经算出的传统结构
翻译成现代人能快速理解的语言
```

这样可以同时保留：
- 纯本地
- 离线
- iPhone 8 兼容
- 无 API 成本
- 可复现
- 无模型连接失败
