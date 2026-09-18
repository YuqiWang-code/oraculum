# Oraculum v3.4：六爻高级规则、专项问法、应期候选与 AI 证据闭环资料库

> 仓库：`https://github.com/YuqiWang-code/oraculum`
> 审查基准：提交 `b720c69e3f7198ad72864984cab096ca23f0fad5`
> 审查日期：2026-09-18
> 建议放置：`F:\豆包\Projects\智能推理与预测\资料\Oraculum_v3.4_六爻高级规则_应期专项_AI闭环资料库.md`

## 0. 结论

v3.3 实际完成了 provider-neutral、follow-up schema、`movingIndex0`、`classicEvidence` 入 Record 和版本号更新，但上一轮真正计划的六爻高级规则、RatingBreakdown、QuestionIntent、Timing Engine、专项流程和 AI evidenceIds 服务端校验仍未实现。

下一步建议直接进入：

**Oraculum v3.4：先做 v3.3 可靠性热修，再完成六爻高级规则 + 专项问法 + 确定性传统应期候选 + AI 证据闭环。**

不要先做 APK、分享长图或主题皮肤。

---

## 1. 最新仓库审查：需要先修的真实问题

### 1.1 “80 tests passed”与当前 commit 不一致

当前 `.env.example` 已经是：

```env
LLM_API_KEY=YOUR_LLM_API_KEY_HERE
```

但 `tests/server/ai.test.ts` 仍断言：

```ts
expect(ex).toContain('YOUR_ARK_API_KEY_HERE')
```

所以一个 fresh checkout 按当前 commit 运行，这个测试应失败。后续完成报告必须以**最终工作树/最终 commit**上的测试结果为准。

### 1.2 新 placeholder 会被误判为真实 key

`getApiKey()` 没有排除：

```text
YOUR_LLM_API_KEY_HERE
```

因此只复制 `.env.example` 也可能让 `/api/ai/health` 误报 enabled=true。

建议统一：

```ts
function isPlaceholderSecret(v?: string) {
  if (!v) return true
  return /^(YOUR_|CHANGE_ME|REPLACE_ME|<)/i.test(v.trim())
}
```

### 1.3 production fail-closed 仍只检查旧 `OPENAI_API_KEY`

`server/start.ts` 生产检查仍看 `OPENAI_API_KEY`，而主配置已改成 `LLM_API_KEY`。生产只配置 `LLM_API_KEY` 时，AI_ACCESS_TOKEN 的强制检查可能被绕过。

应改为：

```ts
if (NODE_ENV === 'production' && isConfigured()) {
  assertValidAccessToken()
}
```

### 1.4 当前 moderation 与讯飞 Spark provider 不匹配

现代码：

```ts
getOpenAI().moderations.create({
  model: 'omni-moderation-latest'
})
```

但 client 的 baseURL 是讯飞 MaaS。讯飞官方资料说明：
- 星火主接口本身有输入/输出内容审核；
- 讯飞还有独立“大模型安全护栏 API”，使用另一套鉴权；
- 常规 MaaS OpenAI-compatible 文档并没有说明可以直接调用 OpenAI `omni-moderation-latest`。

因此现在很可能出现：

```text
health 正常
→ interpret 前先调用 /moderations
→ Spark 不支持
→ catch
→ fail-closed
→ AI 请求全部被拦
```

当前报告只 smoke 了 `/api/ai/health`，并没有证明真实 AI 解读成功。

官方资料：
- https://www.xfyun.cn/doc/spark/接口说明.html
- https://www.xfyun.cn/doc/spark/SparkAssistantAPI.html
- https://www.xfyun.cn/doc/spark/safety.html

建议改成 provider-aware safety adapter：

```text
server/safety/
├─ types.ts
├─ openaiModeration.ts
├─ iflytekSafety.ts
└─ index.ts
```

OpenAI 官方 provider 才调用 OpenAI moderation；讯飞默认使用 provider 内置审核，可选单独接讯飞 Safety Guard。

### 1.5 `LLM_MAX_OUTPUT_TOKENS` / `LLM_TIMEOUT_MS` 没真正生效

`.env.example` 已使用 `LLM_*`，但 `server/ai/interpret.ts` 仍读取旧 `OPENAI_MAX_OUTPUT_TOKENS`，timeout 也没有真正接入。

应建立统一 `getLlmConfig()`。

### 1.6 `LLM_API_MODE` 可能让 health 和真实调用不一致

当前可配置：

```env
LLM_API_MODE=responses
```

但 `runInterpret()` 仍固定：

```ts
client.chat.completions.create(...)
```

所以 health 可能显示 responses，而实际仍是 Chat Completions。

v3.4 建议：Spark adapter 固定 `chat-completions`。以后若支持 Responses，另写真实 adapter。

### 1.7 当前 Spark-X2.5 不应贸然启用 JSON Mode

讯飞当前文档支持 `response_format: {"type":"json_object"}`，但官方列出的支持模型主要是 DeepSeek、GLM、Kimi、Qwen 系列，并未明确把 Spark-X2.5 列入。

因此当前模型继续用：

```text
json-prompt-zod
```

更稳妥，除非服务卡或实测明确支持 JSON Mode。

官方：
https://www.xfyun.cn/doc/spark/推理服务-http.html

### 1.8 `classicEvidence` 已进 Record，但 AI snapshot 没直接使用它

`DivinationRecord.classicEvidence` 已存在，但 `sanitizeRecord.ts` 仍在手工拼经典字段。六爻 snapshot 没真正发送统一的 classicEvidence。

应让 orchestrator 成为经典证据唯一事实源：

```ts
classicEvidence: rec.classicEvidence?.map(...)
```

### 1.9 六爻 classic selector 仍缺完整变卦卦辞

`selectLiuyaoClassicEvidence()` 注释写“本卦 + 动爻 + 变卦”，代码实际只有本卦和动爻。

应从本卦六爻 + moving mask 构造完整变卦，加入：

```text
ZHOUYI_BIAN_JUDGMENT
```

### 1.10 AI `evidenceIds` 仍只有 Prompt 约束，没有服务端验证

当前 Zod 只是 `string[]`，服务端没有核对 ID 是否真的存在。

需要：

```ts
validateEvidenceReferences(result, snapshot)
```

允许的 ID 只能来自：
- `rating.evidence[].id`
- `classicEvidence[].id`
- `timingResult.triggers[].id`
- 起卦证据稳定 ID

### 1.11 `AiHealth` 前端类型落后

后端已返回：
- provider
- apiMode
- structuredOutputMode

但 `src/types/ai.ts` 的 `AiHealth` 仍只有 `enabled/model`。

### 1.12 ResultView / Knowledge / docs 仍明显过期

最新版仍残留：
- “经典原文待联网逐字核验”
- README `RULESET_VERSION=1.0.0`
- README `DATASET_VERSION=1.0.0`
- 38 tests
- `docs/TESTING.md` 72 tests
- 三枚钱“二期”等旧描述

### 1.13 `npm run lint` 目前没有可靠配置

`package.json` 有 lint script，但没有显式 ESLint / Vue / TS lint 依赖，也没有清晰 eslint config。v3.4 应正式配置 ESLint，再把 lint 作为验收项。

### 1.14 DB export 仍有旧版本硬编码

`src/db/index.ts` 仍有：

```text
appVersion: '3.1.0'
```

应引用 `APP_VERSION`。

---

# 2. 六爻高级规则调研

## 2.1 日辰：暗动与日破必须区分

《增删卜易·日辰章》明确：
- 旺相静爻受日冲 → 暗动；
- 衰弱静爻受日冲 → 日破；
- 冲空可起；
- 冲合可开。

来源：
https://zh.wikisource.org/zh-hans/增删卜易/17

《暗动章》再次说明：
https://zh.wikisource.org/zh-hans/增删卜易/22

推荐：

```ts
type DayClashState =
  | 'none'
  | 'hidden_movement'
  | 'day_break'
  | 'clash_empty'
```

不再统一 `day clash = -3`。

## 2.2 六合必须状态化

《增删卜易·六合章》区分：

```text
静而逢合 = 合起
动而逢合 = 合绊
爻与爻合 = 合好
动化合 = 化扶
```

来源：
https://zh.wikisource.org/zh-hans/增删卜易/19

推荐：

```ts
type CombineState =
  | 'static_activated'
  | 'moving_bound'
  | 'line_mutual_support'
  | 'transformed_support'
```

时间类问题中，`moving_bound` 应形成“待冲开”的 timing trigger。

## 2.3 动变只回头作用本位

《增删卜易》把动爻变出的爻用于回头生、克、冲、合本位动爻。

来源：
https://zh.wikisource.org/zh-hans/增删卜易/15

推荐：

```ts
type TransformRelation =
  | 'back_generate'
  | 'back_control'
  | 'back_combine'
  | 'back_clash'
  | 'same'
  | 'neutral'
```

## 2.4 回头生 / 回头克

《各门类题头总注》把用神、元神“化回头生”等列为化吉，把回头克等列入不利结构。

来源：
https://zh.wikisource.org/zh-hans/增删卜易/26又2

## 2.5 三合

常用四组三合：

```text
申子辰 = 水
巳酉丑 = 金
寅午戌 = 火
亥卯未 = 木
```

《增删卜易》有多种三合成局实例；其他传统资料也强调三字缺一不宜直接当完整三合局。

来源：
- https://zh.wikisource.org/zh-hans/增删卜易
- https://zh.wikisource.org/zh-hans/钦定古今图书集成/博物汇编/艺术典/第598卷

v3.4 正式评分只认完整三支；半合只显示为 experimental。

## 2.6 旬空必须状态化

《旬空章》明确讨论动空、冲空、填空、旺衰等，不宜固定 `旬空=-4`。

来源：
https://zh.wikisource.org/zh-hans/增删卜易/26

推荐：

```ts
type KongState =
  | 'static_weak_empty'
  | 'moving_empty'
  | 'supported_empty'
  | 'clashed_empty'
  | 'broken_empty'
```

## 2.7 元神 / 忌神必须真正有“强弱”

《元神忌神衰旺章》强调元神本身要旺，才真正能生用神；动空也并非永远无效，可能待冲空/填实发挥作用。

来源：
https://zh.wikisource.org/zh-hans/增删卜易/10

建议明确 LineRole：

```text
useful
source
taboo
enemy
shi
ying
neutral
```

## 2.8 飞神 / 伏神

《月将章》直接讨论月建可冲克飞神、生助伏神。

来源：
https://zh.wikisource.org/zh-hans/增删卜易/16

v3.4 先实现：
- 飞生伏
- 飞克伏
- 伏得月生日生
- 飞神旬空
- 飞神月破
- 飞神被有效动爻制约

十二长生、墓绝暂缓。

## 2.9 进神 / 退神

《各门类应期总注》明确列：
- 化进神 → 逢值逢合；
- 化退神 → 逢值逢冲；

吉凶还需结合爻的角色。

来源：
https://zh.wikisource.org/zh-hans/增删卜易/26又3

不要实现成：
- 进必吉
- 退必凶

---

# 3. 确定性 Timing Engine

《增删卜易·各门类应期总注》可直接工程化的条件包括：
- 静 → 逢值/逢冲；
- 动 → 逢值/逢合；
- 合住 → 待冲开；
- 月破 → 填实/逢合；
- 旬空 → 填/冲；
- 衰弱 → 遇生/旺；
- 进神 → 逢值/合；
- 退神 → 逢值/冲；
- 近事偏日时，远事偏年月。

来源：
https://zh.wikisource.org/zh-hans/增删卜易/26又3

推荐类型：

```ts
interface TimingTrigger {
  id: string
  rule: string
  targetBranch?: string
  targetElement?: Element
  weight: number
  explanation: string
  sourceRule: string
}

interface TimingCandidate {
  id: string
  start: string
  end?: string
  score: number
  confidence: 'low' | 'medium'
  triggerIds: string[]
}

interface TimingResult {
  applicable: boolean
  engineVersion: string
  horizon: string
  candidates: TimingCandidate[]
  triggers: TimingTrigger[]
  disclaimer: string
}
```

不要支持 `confidence=high`。

日期扫描：

```text
起卦日
→ 逐日 buildCalendarContext()
→ dayGanzhi / dayBranch
→ 匹配 triggers
→ 累积分
→ Top3
→ 相邻日期合并为窗口
```

同输入同 ruleVersion 必须可复现。

---

# 4. 专项问法

## 4.1 person_return

《梅花易数·行人占》明确：
- 体为主；
- 用为行人；
- 体用生克用于传统归迟/归速判断。

来源：
https://ctext.org/wiki.pl?chapter=475043&if=en

输入应增加：

```text
subjectRelation
timeHorizon
```

例如“我妈妈什么时候回家”：
- intent=`person_return`
- subjectRelation=`parent_elder`
- horizon=`30d`

六爻取父母爻为用神；梅花按体/用行人规则。

## 4.2 event_timing

适用于：
- 什么时候出结果
- 什么时候通知
- 什么时候完成

只在有足够 trigger 时输出候选窗口。

## 4.3 task_success

传统层继续展示：
- score
- label
- breakdown

必须写：

```text
传统规则分数 ≠ 现实世界成功概率
```

现实层可选输入：
- deadline
- progress
- dependencies
- blockers

AI 只给“偏低/不确定/偏高”等等级，不给伪精确概率。

## 4.4 lost_item

《梅花易数·失物占》使用体用和变卦方位/物象来描述传统查找方向。

来源：
https://ctext.org/wiki.pl?chapter=475043&if=en

只输出方向和环境象意，不输出 GPS、精确地址或“必定在某处”。

---

# 5. 梅花 Timing 必须独立于六爻

《梅花易数》卷二讨论：
- 先天/后天；
- 卦气；
- 体用；
- 动静；
- 行坐快慢；
- 不同主题的专项占法。

来源：
https://zh.wikisource.org/zh-hans/梅花易数/卷二

因此应单独实现：

```text
meihua_timing_v1
```

不要把六爻的空破冲合直接套给梅花。

---

# 6. RatingBreakdown

建议 `ScoreEvidence` 增加可选 bucket：

```text
usefulGod
sourceTaboo
shiYing
monthDay
movement
conflictHarmony
classicTheme
auxiliary
```

总分继续：

```text
50 + Σdelta
```

UI 显示分项。

神煞只能进入 auxiliary。

---

# 7. AI 证据闭环

v3.4 snapshot 应包含：

```text
question
questionProfile
realityContext（可选）
calendar
castingEvidence
classicEvidence
usefulGod
rating.score/label/consistency/breakdown/evidence
timingResult
meihua / liuyao
```

AI 输出增加：

```text
traditionalReading.evidenceIds
timing.evidenceIds
likelihood.evidenceIds
```

服务端验证 ID。

如果 `timingResult.applicable=false`，AI 不得自己说“下周二”“10月5日”“三天后”等日期。

---

# 8. 版本建议

本轮会真正改变六爻评分语义和新增 Timing Engine，建议：

```text
APP_VERSION = 3.4.0
RULESET_VERSION = 4.0.0
DATASET_VERSION = 2.0.0
package.json = 3.4.0
```

旧历史保留旧 ruleVersion，不重算。

---

# 9. 本轮明确不做

暂不加入：
- 完整十二长生；
- 全套墓绝；
- 复杂三刑；
- 大量神煞；
- 卦身；
- 太岁复杂权重；
- AI 联网现实预测；
- 真实概率；
- APK / 分享长图。

---

# 10. 推荐开发顺序

```text
Phase 0：v3.3 可靠性热修
Phase 1：经典证据 / evidenceIds 闭环
Phase 2：六爻 LineRole + Strength
Phase 3：暗动/日破、六合、动变、三合、进退、飞伏、旬空
Phase 4：RatingBreakdown
Phase 5：QuestionIntent / QuestionProfile
Phase 6：Timing Engine + 日期扫描
Phase 7：person_return / event_timing / task_success / lost_item
Phase 8：AI 只读 evidence/timing
Phase 9：UI / docs / tests / production + real AI smoke
```

v3.4 的目标是：

> 传统规则 → 确定性代码 → 可追溯 evidence → 确定性候选窗口 → AI 只解释。

而不是让模型根据一个卦名自行猜日期。
