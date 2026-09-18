# Oraculum v3.4 Phase 1：六爻规则内核、经典证据与 AI 证据闭环调研

> 仓库：`https://github.com/YuqiWang-code/oraculum`  
> 审查基准：提交 `d1e5728a77c3235228e640fd45b658779e08ff11`  
> 审查日期：2026-09-18  
> 建议放置：`F:\豆包\Projects\智能推理与预测\资料\Oraculum_v3.4_Phase1_六爻规则内核与证据闭环调研.md`

---

# 0. 本轮定位

v3.4 Phase 0 已经修了：

- placeholder；
- production token fail-closed；
- iflytek-spark 不再调用 OpenAI moderation；
- health 增加 `safetyMode`；
- APP/RULESET 版本升级。

但是最新代码仍没有进入“高级规则真正落地”的阶段。

本轮建议只做：

> **v3.4 Phase 1：工程闭环 + 经典证据闭环 + 六爻高级规则内核 + RatingBreakdown**

本轮**不要同时做 QuestionIntent / Timing Engine / person_return / event_timing**。

原因：

```text
Timing Engine
依赖
↓
用神角色
↓
旺衰
↓
暗动/日破
↓
空破合冲
↓
动变
↓
进退/三合/飞伏
```

如果底层状态没有稳定，先写 Timing Engine 只会重复返工。

---

# 1. 最新 commit 的实际剩余工程问题

## 1.1 LLM 参数仍未 provider-neutral

当前 `server/ai/interpret.ts` 仍读取：

```ts
process.env.OPENAI_MAX_OUTPUT_TOKENS
```

而 `.env.example` 已改成：

```env
LLM_MAX_OUTPUT_TOKENS=2500
LLM_TIMEOUT_MS=45000
```

所以 Phase 0 只是改了环境变量名称，并没有让调用真正使用新配置。

应建立：

```ts
getLlmConfig()
```

单一读取点。

---

## 1.2 timeout 仍未真正使用

当前 Chat Completions 调用没有把 `LLM_TIMEOUT_MS` 应用于实际请求。

应该：
- 使用 OpenAI SDK 支持的 request timeout / signal；
- 或 `AbortController`；
- 超时统一转换成 `AI_TIMEOUT`。

---

## 1.3 `LLM_API_MODE` 仍可能让 health 与真实调用不一致

当前 `getApiMode()` 读取任意：

```env
LLM_API_MODE=responses
```

但 `runInterpret()` 无论如何仍然调用：

```ts
client.chat.completions.create(...)
```

因此：

```text
配置值 ≠ 实际 adapter
```

Phase 1 应让 health 报告“真实 adapter 的能力”，而不是直接相信 env 字符串。

当前 Spark：
```text
apiMode = chat-completions
```

固定即可。

---

## 1.4 Spark `provider-built-in` safety 仍未真正归一化错误

当前非 OpenAI provider 的 `moderate()`：

```ts
return { ok: true }
```

真正依赖 Spark 主接口自身审核。

这是可以接受的 provider 策略，但目前 `interpret.ts` / `app.ts` 把 Provider 拒绝基本统一变成：

```text
502 AI_ERROR
```

也就是说：
- 正常 Provider 故障；
- 内容审核拒绝；
- 额度不足；
- 参数错误；

用户看到的错误可能一样。

Phase 1 建议增加：

```text
normalizeProviderError()
```

至少分类：
- `AI_CONTENT_SAFETY`
- `AI_TIMEOUT`
- `AI_RATE_LIMIT`
- `AI_AUTH`
- `AI_PROVIDER_ERROR`

---

## 1.5 `AiHealth` 前端类型仍落后

后端 health 已返回：

```text
provider
model
apiMode
structuredOutputMode
safetyMode
```

但 `src/types/ai.ts` 当前只有：

```ts
enabled
model?
```

应同步。

---

## 1.6 `classicEvidence` 已进 Record，但没真正进入 AI snapshot

`DivinationRecord.classicEvidence` 已有。

但 `sanitizeRecord()` 仍手工发送：
- 本卦名称；
- 卦辞；
- 单个梅花动爻文字；
- 六爻结构。

没有统一发送：

```ts
rec.classicEvidence
```

因此“经典证据单一事实源”尚未完成。

---

## 1.7 六爻 classic selector 注释与实际实现不一致

注释：

```text
本卦卦辞 + 所有动爻爻辞 + 变卦卦辞
```

实际没有：
```text
变卦卦辞
```

应先让 `LiuYaoResult` 有完整：

```ts
changedHexagram
```

再由 selector 使用。

---

## 1.8 AI evidenceIds 没有服务端真实性验证

Zod 目前只验证：

```text
evidenceIds 是 string[]
```

没有验证：
```text
这个 ID 是否真实存在于本次 snapshot
```

Prompt 约束不等于真实性校验。

需要建立：

```ts
collectAvailableEvidenceIds()
validateEvidenceIds()
```

---

## 1.9 README / Result / Knowledge / TESTING 仍明显过期

最新 commit 中仍有：
- README `Oraculum v3.1.0`
- README `RULESET_VERSION=1.0.0`
- README “38 tests”
- README “经典原文未核验”
- `docs/TESTING.md` 写 72 tests
- ResultView 写“经典原文待联网逐字核验”
- KnowledgeView 同样写“待核验”

本轮必须同步。

---

## 1.10 DB export 仍硬编码旧 APP 版本

`src/db/index.ts` 当前：

```ts
appVersion: '3.1.0'
```

应直接：

```ts
APP_VERSION
```

避免以后再次漂移。

---

# 2. 六爻规则的工程核心：先建立“角色 + 状态”，再评分

当前代码主要是：

```text
找到用神
→ 看月日五行
→ 旬空/月破/日冲/日合固定加减
→ 总分
```

这不够。

更合理的结构：

```text
LiuYaoResult
↓
UsefulGodSelection
↓
LineRole[]
↓
LineStrengthState[]
↓
StructuralRelations[]
↓
ScoreEvidence[]
↓
RatingBreakdown
```

这样后续 Timing Engine 才能复用同一组状态。

---

# 3. 用神、元神、忌神、仇神

《增删卜易》明确：

- 用神：本次所问的主事爻；
- 元神：生用神者；
- 忌神：克用神者；
- 仇神：克元神且生忌神者。

来源：
https://zh.wikisource.org/zh-hans/增删卜易

《元神忌神衰旺章》进一步强调：

> 元神虽然能生用神，但元神本身必须有力量，才能真正发挥作用。

来源：
https://zh.wikisource.org/zh-hans/增删卜易/10

所以不应该简单：

```text
存在元神 = +分
存在忌神 = -分
```

而要：

```text
元神有力 → 生用神才有效
忌神有力 → 克用神才有效
```

建议：

```ts
type LineRole =
  | 'useful'
  | 'source'
  | 'taboo'
  | 'enemy'
  | 'shi'
  | 'ying'
  | 'neutral'
```

---

# 4. 月建与日辰

《月将章》把月建作为一月的主要纲领，并明确：

- 能生扶衰弱爻；
- 能冲克强旺爻；
- 月建冲爻为月破；
- 可作用飞神、伏神。

来源：
https://zh.wikisource.org/zh-hans/增删卜易/16

《日辰章》则把日辰视为六爻的主宰之一。

来源：
https://zh.wikisource.org/zh-hans/增删卜易/17

工程上建议：

```ts
interface LineStrengthState {
  lineIndex: number
  branch: string

  monthState:
    | 'month_value'
    | 'month_same_element'
    | 'month_generated'
    | 'month_controlled'
    | 'month_combined'
    | 'month_broken'
    | 'neutral'

  dayState:
    | 'day_value'
    | 'day_same_element'
    | 'day_generated'
    | 'day_controlled'
    | 'day_combined'
    | 'day_clashed'
    | 'neutral'

  isKong: boolean
  moving: boolean

  strengthScore: number
  strengthLevel: 'weak' | 'balanced' | 'strong'
}
```

### 重要

`strengthScore` 是 Oraculum 的现代工程权重。

古籍没有给出统一的：
```text
月生 +5
日生 +4
```

因此：
- 权重要写成项目规则；
- sourceRule 与传统来源分开；
- docs 明确“结构来自传统，数值权重属于项目现代评分模型”。

---

# 5. 日冲：暗动、日破、冲空必须分开

《日辰章》明确：

- 旺相静爻被日冲 → 暗动；
- 衰弱静爻被日冲 → 日破；
- 空爻被日冲 → 冲空而起；
- 合住遇日冲 → 冲开。

来源：
https://zh.wikisource.org/zh-hans/增删卜易/17

《暗动章》又单独重申：

```text
静爻旺相，日冲为暗动
静爻休囚，日冲为破
```

来源：
https://zh.wikisource.org/zh-hans/增删卜易/22

推荐：

```ts
type DayClashState =
  | 'none'
  | 'hidden_movement'
  | 'day_break'
  | 'clash_empty'
  | 'break_combine'
```

### 评分建议

不要直接在 `evaluateDayClash` 里写死吉凶。

先返回结构。

然后：
- 如果是元神暗动且生用 → 正向；
- 忌神暗动且克用 → 负向；
- 用神本身日破 → 负向；
- 冲空可能是“恢复可用”，不应简单负分。

---

# 6. 六合：合起 / 合绊 / 合好 / 化扶

《六合章》明确区分：

- 静爻逢合 → 合起；
- 动爻逢合 → 合绊；
- 爻与爻合 → 合好；
- 动爻化合 → 化扶。

来源：
https://zh.wikisource.org/zh-hans/增删卜易/19

所以当前：

```ts
日合 = +3
```

必须移除。

推荐：

```ts
type CombineState =
  | 'static_activated'
  | 'moving_bound'
  | 'line_mutual_support'
  | 'transformed_support'
```

之后由：
```text
LineRole + intent
```
决定效果。

---

# 7. 动爻与变爻：只回头作用本位

《动变生克冲合章》非常明确：

> 变出的爻可以生、克、冲、合本位动爻，不直接作用其他爻。

来源：
https://zh.wikisource.org/zh-hans/增删卜易/15

这特别适合程序化。

推荐：

```ts
interface TransformRelation {
  lineIndex: number
  originalBranch: string
  changedBranch: string
  relation:
    | 'back_generate'
    | 'back_control'
    | 'back_combine'
    | 'back_clash'
    | 'same'
    | 'neutral'
}
```

---

# 8. 回头生 / 回头克

如果：
```text
changedElement 生 originalElement
```

则：
```text
back_generate
```

如果：
```text
changedElement 克 originalElement
```

则：
```text
back_control
```

《增删卜易》将动化回头生、回头克视为重要结构。

来源：
https://zh.wikisource.org/zh-hans/增删卜易/10
https://zh.wikisource.org/zh-hans/增删卜易/15

### 权重

同一结构发生在：
- 用神；
- 元神；
- 忌神；
- 普通爻；

意义不同。

因此 transform 层只描述结构，不直接决定最终总分。

---

# 9. 三合局

《增删卜易》列出四组：

```text
申子辰 → 水
巳酉丑 → 金
寅午戌 → 火
亥卯未 → 木
```

并强调三合成局的吉凶取决于“成了什么局、服务于什么问题”。

来源：
https://zh.wikisource.org/zh-hans/增删卜易

例如：
- 求财得到财局，与求财相关；
- 若合出兄弟局，则可能与耗财含义相关。

所以不能：

```text
三合 = +5
```

推荐：

```ts
interface SanHeGroup {
  branches: [string, string, string]
  element: Element
  participantLineIndexes: number[]
  includesMonth: boolean
  includesDay: boolean
  containsUseful: boolean
  containsSource: boolean
  containsTaboo: boolean
}
```

本阶段只正式实现：
```text
完整三支
```

半合只：
```text
experimental / display-only
```

---

# 10. 旬空状态化

《旬空章》反对把所有空亡机械视为完全无用。

来源：
https://zh.wikisource.org/zh-hans/增删卜易/26

其中特别包含：
- 动空；
- 冲空；
- 填空；
- 旺而空；
- 月破之空。

推荐：

```ts
type KongState =
  | 'none'
  | 'static_weak_empty'
  | 'moving_empty'
  | 'supported_empty'
  | 'clashed_empty'
  | 'broken_empty'
```

本阶段仍不做所有复杂古法，只做可测试的核心状态。

---

# 11. 进神 / 退神

传统常用进神表：

```text
亥→子
寅→卯
巳→午
申→酉
丑→辰
辰→未
未→戌
```

退神表：

```text
子→亥
卯→寅
午→巳
酉→申
辰→丑
未→辰
戌→未
```

《元神忌神衰旺章》把元神化进神视为元神有力条件之一，把衰弱元神化退神视为无力条件。

来源：
https://zh.wikisource.org/zh-hans/增删卜易/10

因此：

```text
进神 = 好
退神 = 坏
```

不成立。

必须结合 LineRole。

---

# 12. 飞神 / 伏神

当前代码已有伏神定位。

《月将章》明确提到：
- 用神伏藏；
- 被飞神压住；
- 月建可以冲克飞神；
- 也可以生助伏神。

来源：
https://zh.wikisource.org/zh-hans/增删卜易/16

Phase 1 建议只实现：

```text
flying_generates_hidden
flying_controls_hidden
hidden_generated_by_month
hidden_generated_by_day
flying_is_kong
flying_is_yuepo
```

不要本轮加入：
- 十二长生；
- 墓绝；
- 胎养；
- 复杂飞伏流派细则。

---

# 13. RatingBreakdown 必须来自证据，而不是另算一套

当前：

```text
buildRating(evidence)
```

推荐改成：

```text
ScoreEvidence[]
↓
bucket
↓
aggregateBreakdown()
↓
buildRating(evidence, breakdown)
```

建议 bucket：

```ts
type RatingBucket =
  | 'usefulGod'
  | 'sourceTaboo'
  | 'shiYing'
  | 'monthDay'
  | 'movement'
  | 'conflictHarmony'
  | 'classicTheme'
  | 'auxiliary'
```

测试必须保证：

```text
Σ breakdown
=
Σ evidence.delta
```

不要再维护一套独立 breakdown 权重，否则会出现总分和分项对不上。

---

# 14. 六爻完整变卦

当前每个动爻有：

```text
changedBranch
```

但没有整个六爻的：

```text
changedHexagram
```

应该从本卦：

```text
[初, 二, 三, 四, 五, 上]
```

一次性翻转所有 moving line。

结果保存：

```ts
LiuYaoResult.changedHexagram
```

注意区别：

```text
changedHexagram
≠
单爻 changedBranch
```

前者用于：
- 经典变卦卦辞；
- UI；
- 整体结构。

后者用于：
- 回头生克冲合；
- 进神/退神。

---

# 15. AI classicEvidence 单一事实源

现在 `classicEvidence` 已保存在 Record。

服务端 snapshot 应只读取它：

```ts
classicEvidence: [...]
```

不要再重复：

```text
自行取本卦卦辞
自行取动爻爻辞
```

否则未来 selector 修改后：
```text
UI / history / AI
```
可能各自不一致。

---

# 16. AI evidenceIds 真实性校验

建立：

```ts
collectAvailableEvidenceIds(snapshot)
```

集合至少包含：

```text
rating.evidence[].id
classicEvidence[].id
```

后续 Timing Engine 再加入：

```text
timingResult.triggers[].id
```

验证：
- AI 返回的 ID 必须在 Set 内；
- 不存在的 ID 不进入前端；
- 过滤后一个核心部分完全无证据 → 视为 invalid；
- 可重试一次；
- 不无限重试。

---

# 17. Phase 1 的完成标准

完成后至少应做到：

```text
六爻盘
↓
用神
↓
LineRole
↓
LineStrengthState
↓
日冲状态
↓
六合状态
↓
TransformRelation
↓
SanHeGroup
↓
KongState
↓
Advance/Retreat
↓
HiddenSpiritAssessment
↓
ScoreEvidence(bucket)
↓
RatingBreakdown
```

同时：

```text
本卦
+ 全部动爻
+ 完整变卦
→ classicEvidence
→ record
→ AI snapshot
```

AI：

```text
evidenceIds
→ server validation
```

---

# 18. 本阶段明确不要做

Phase 1 暂时不要实现：

- QuestionIntent；
- person_return；
- event_timing；
- task_success；
- lost_item；
- Timing Engine；
- 日期扫描；
- 完整十二长生；
- 墓绝；
- 三刑全量；
- APK。

等 Phase 1 的规则状态和 evidence 稳定后，Phase 2 再做 Timing。

---

# 19. 主要资料来源

1. 《增删卜易》总页  
   https://zh.wikisource.org/zh-hans/增删卜易

2. 《元神忌神衰旺章》  
   https://zh.wikisource.org/zh-hans/增删卜易/10

3. 《动变生克冲合章》  
   https://zh.wikisource.org/zh-hans/增删卜易/15

4. 《月将章》  
   https://zh.wikisource.org/zh-hans/增删卜易/16

5. 《日辰章》  
   https://zh.wikisource.org/zh-hans/增删卜易/17

6. 《六合章》  
   https://zh.wikisource.org/zh-hans/增删卜易/19

7. 《暗动章》  
   https://zh.wikisource.org/zh-hans/增删卜易/22

8. 《旬空章》  
   https://zh.wikisource.org/zh-hans/增删卜易/26

9. 《各门类题头总注》  
   https://zh.wikisource.org/zh-hans/增删卜易/26又2

10. 《各门类应期总注》（供 Phase 2 使用，本阶段先不开发 Timing）  
    https://zh.wikisource.org/zh-hans/增删卜易/26又3

11. 《梅花易数》卷二（Phase 2 专项问法参考）  
    https://zh.wikisource.org/zh-hans/梅花易数/卷二

---

# 20. 推荐 Phase 1 文件结构

```text
src/engine/liuyao/
├─ roles.ts
├─ strength.ts
├─ dayRelations.ts
├─ combine.ts
├─ transforms.ts
├─ sanhe.ts
├─ advanceRetreat.ts
├─ kongState.ts
├─ hiddenSpiritStrength.ts
├─ scoreLiuyao.ts
└─ ...

server/ai/
├─ evidenceValidation.ts
├─ providerError.ts
└─ ...

server/config/
└─ llm.ts
```

这一步完成后，再进入：

> **v3.4 Phase 2：QuestionIntent + Timing Engine + person_return/event_timing/task_success/lost_item。**
