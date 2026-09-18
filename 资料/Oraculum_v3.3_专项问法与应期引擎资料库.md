# Oraculum v3.3 专项问法、六爻高级规则与传统“应期”引擎资料库

> 仓库：`https://github.com/YuqiWang-code/oraculum`  
> 审查基准：提交 `4c1b161d4fed601591dcc28056a6224e951bb692`  
> 审查日期：2026-09-18  
> 建议放置：`F:\豆包\Projects\智能推理与预测\资料\Oraculum_v3.3_专项问法与应期引擎资料库.md`

## 0. 本轮建议

v3.2 之后，不建议先做 APK、分享长图或更多装饰功能。下一阶段应定为：

> **Oraculum v3.3：专项问法 + 六爻高级规则 + 传统应期候选窗口 + AI 证据链闭环**

目标不是让软件“更神秘”，而是让它做到：不同类型的问题走不同确定性路径；六爻规则从“基础冲合空破”升级为更完整的证据引擎；“什么时候回来 / 什么时候有结果”由确定性规则生成传统候选时间窗口；“成功率多高”继续明确区分传统评分与现实可行性；所有重要结论都能追溯到规则 ID、经典原文或结构化 evidence。

---

# 1. 最新仓库审查：v3.2 仍有几个需要先修的问题

## 1.1 AI follow-up 请求 schema 不一致

前端 `src/services/ai.ts` 已经发送：

```ts
{ record, messages }
```

不再单独传 `question`。但是 `server/ai/schema.ts` 的 `FollowUpRequestSchema` 仍要求 `question`。

这会导致当前追问请求可能直接被 Zod 判定为 `BAD_REQUEST`。

### 修法

删除 `question` 字段，并要求：

```ts
messages.length >= 1
messages.at(-1)?.role === 'user'
```

最后一条消息即当前追问。

---

## 1.2 health 的 apiMode 与真实代码不一致

`server/openaiClient.ts` 固定：

```ts
apiMode: 'responses'
```

但 `server/ai/interpret.ts` 实际调用：

```ts
client.chat.completions.create(...)
```

因此真实模式是：

```text
OpenAI-compatible Chat Completions
```

不是 Responses API。

当前 Provider 是讯飞星火 MaaS：

```text
https://maas-api.cn-huabei-1.xf-yun.com/v2
```

讯飞官方文档也给出 OpenAI SDK + `chat.completions.create()` 调用方式。

参考：
- https://www.xfyun.cn/doc/spark/推理服务-http.html
- https://www.xfyun.cn/doc/spark/TokenPlan.html

health 应如实显示：

```json
{
  "provider": "iflytek-spark",
  "apiMode": "chat-completions"
}
```

---

## 1.3 当前并不是真正 API 层 Structured Outputs

当前实际链路是：

```text
system prompt 要求 JSON
→ 模型返回文本
→ extractJson()
→ JSON.parse()
→ Zod parse
```

这是：

```text
JSON prompt + post validation
```

如果 Spark 服务支持 JSON Mode，可以升级成：

```text
JSON Mode + Zod
```

但不要继续在文档中写“Responses + Structured Outputs”，除非真实协议就是如此。

---

## 1.4 梅花动爻经典文本没有真正进入 AI snapshot

`sanitizeRecord.ts` 读取：

```ts
meihua.movingLineIndex0
```

但真实字段叫：

```ts
movingIndex0
```

所以 `movingLineClassicText` 当前大概率为空。

应改为：

```ts
ben.lineTextsClassic[Number(meihua.movingIndex0)]
```

并加测试。

---

## 1.5 classicEvidence 已建文件，但没有真正进入 DivinationRecord

已有：

```text
src/engine/classics/selectClassicEvidence.ts
```

但 `orchestrator.ts` 没有把它保存到记录里。

因此建议：

```ts
DivinationRecord {
  classicEvidence: ClassicEvidence[]
}
```

梅花和六爻都在 orchestrator 生成并保存。

---

## 1.6 六爻 classic selector 注释说有变卦卦辞，实际没有

当前 `selectLiuyaoClassicEvidence()` 只选：
- 本卦卦辞；
- 所有动爻爻辞。

并没有从全部动爻构造完整变卦，因此缺少：

```text
ZHOUYI_BIAN_JUDGMENT
```

应从本卦 lines + movingMask 一次性翻转全部动爻，得到六爻变卦，并加入变卦卦辞。

---

## 1.7 RatingBreakdown “定义了，但未真正使用”

`RatingBreakdown` 类型已经存在，`buildRating()` 也接受 breakdown，但当前 `scoreLiuyao()` 最后仍然：

```ts
return buildRating(ev)
```

所以实际记录里没有 breakdown。

v3.3 应真正聚合：
- usefulGod
- shiYing
- monthDay
- movement
- conflictHarmony
- classicTheme
- auxiliary

---

## 1.8 ResultView 和文档仍有 v1/v2 残留

当前 ResultView 仍写：

> 经典原文待联网逐字核验

但 v3.2 已补齐 64 卦卦辞、384 爻辞、用九、用六。

同时：
- ResultView 只显示卦辞，不显示动爻原文和变卦卦辞；
- KnowledgeView 底部仍写“待核验”；
- `docs/DATA_SOURCES.md` 仍写 `needsVerify=true`；
- README 后半还残留 RULESET=1.0.0、38 tests、三枚钱“二期”等旧内容；
- `package.json` 仍为 1.0.0；
- `.env.example` 仍以火山方舟为默认注释，但实际 Provider 是讯飞星火。

这些都应该在 v3.3 Phase 0 先清干净。

---

# 2. 六爻规则调研：下一阶段最值得实现什么

以下主要参考《增删卜易》《黄金策》《梅花易数》等公有领域资料。不同流派之间并不总完全一致，所以软件应采用：

```text
传统来源 + 项目规则版本 + 保守实现
```

不要声称存在唯一绝对算法。

---

# 3. 用神必须成为专项问法核心

《增删卜易·用神章》按所问对象区分六亲：

- 父母、师长、文书、房屋、舟车等 → 父母爻；
- 官职、功名、丈夫等 → 官鬼爻；
- 财货、妻、受我驱使者等 → 妻财爻；
- 子女、晚辈、医药等 → 子孙爻；
- 兄弟姐妹、同类等 → 兄弟爻。

来源：
https://zh.wikisource.org/zh-hans/增删卜易/8

因此 v3.3 应新增：

```ts
type QuestionIntent =
  | 'person_return'
  | 'event_timing'
  | 'task_success'
  | 'relationship_contact'
  | 'lost_item'
  | 'travel'
  | 'career'
  | 'study'
  | 'finance'
  | 'generic'
```

并加入：

```ts
type SubjectRelation =
  | 'parent_elder'
  | 'partner_spouse'
  | 'sibling'
  | 'child_junior'
  | 'friend_colleague_other'
  | 'not_applicable'
```

对于一般他人，项目可用“应爻”作为规范化 fallback，但必须标明这是项目规则。

---

# 4. 月建与日辰必须状态化

《增删卜易》把月建视为一月之纲，日辰视为六爻主宰。

来源：
- https://zh.wikisource.org/zh-hans/增删卜易/16
- https://zh.wikisource.org/zh-hans/增删卜易/17

推荐建模：

```ts
interface LineStrengthState {
  lineIndex: number
  branch: string

  monthState:
    | 'value'
    | 'same_element'
    | 'generated'
    | 'controlled'
    | 'broken'
    | 'neutral'

  dayState:
    | 'value'
    | 'same_element'
    | 'generated'
    | 'controlled'
    | 'clash_active'
    | 'day_broken'
    | 'combined'
    | 'neutral'

  isKong: boolean
  moving: boolean
  strengthScore: number
}
```

---

# 5. “日冲统一 -3”需要升级

《增删卜易·日辰章》明确区分：

```text
旺相静爻遇日冲 → 暗动
衰弱静爻遇日冲 → 日破
```

来源：
https://zh.wikisource.org/zh-hans/增删卜易/17

因此应先算 strength，再判断：
- 旺静 + 日冲 → 暗动；
- 衰静 + 日冲 → 日破；
- 空爻 + 日冲 → 冲空 / 填实候选。

不能在不知道旺衰状态时直接统一扣分。

---

# 6. 六合不能统一 +3

《增删卜易·六合章》区分：

```text
静爻逢合 → 合起
动爻逢合 → 合绊
爻与爻合 → 合好
动爻化合 → 化扶
```

来源：
https://zh.wikisource.org/zh-hans/增删卜易/19

建议：

```ts
type CombineState =
  | 'static_activated'
  | 'moving_bound'
  | 'mutual_support'
  | 'transformed_support'
```

尤其对时间问题：
- 合住 / 合绊常常意味着等待“冲开”；
- 这是 timing trigger，而不一定是单纯正分。

---

# 7. 六冲也不能一概视为坏

《增删卜易·六冲章》强调“冲者散”，但又要求结合：
- 所问吉凶性质；
- 用神旺衰；
- 本卦六冲还是日月冲爻；
- 六合变六冲 / 六冲变六合。

来源：
https://zh.wikisource.org/zh-hans/增删卜易/20

v3.3 至少区分：

```text
day_clash
month_break
line_to_line_clash
transformed_back_clash
hexagram_six_clash
```

---

# 8. 动爻与变爻：变爻只回头作用本位动爻

《增删卜易·动变生克冲合章》明确：

> 变出之爻能生克冲合本位动爻，不直接生克其他爻。

来源：
https://zh.wikisource.org/zh-hans/增删卜易/15

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

# 9. 回头生 / 回头克

《增删卜易·五行相克章》把“化回头克”列为用神/元神的重要克制因素。

来源：
https://zh.wikisource.org/zh-hans/增删卜易/12

爻级规则：

```text
变爻五行生本爻 → 回头生
变爻五行克本爻 → 回头克
```

优先影响：
- 用神；
- 世爻；
- 元神。

---

# 10. 三合局

四组三合：

```text
申子辰 → 水
亥卯未 → 木
寅午戌 → 火
巳酉丑 → 金
```

《增删卜易》中指出：
- 合局仍需结合用神；
- 世爻是否在局很重要；
- 局生世 / 克世意义不同；
- 行人问题中，用神在三合局内可能有“被合留”的传统解释。

来源：
https://zh.wikisource.org/zh-hans/增删卜易

v3.3 保守实现：
- 只正式识别完整三支成局；
- 半合不正式加分；
- 只有当合局与用神/世爻相关时才进入评分。

---

# 11. 进神 / 退神

《增删卜易》常见进退表：

## 进神

```text
亥→子
寅→卯
巳→午
申→酉
丑→辰
辰→未
未→戌
```

## 退神

```text
子→亥
卯→寅
午→巳
酉→申
辰→丑
未→辰
戌→未
```

来源：
https://zh.wikisource.org/zh-hans/增删卜易

不要机械解释为：
- 进 = 永远吉；
- 退 = 永远凶。

应结合动爻角色：
- 用神/元神进 → 可正向；
- 忌神进 → 可负向；
- 用神退 → 可负向；
- 忌神退 → 可缓和。

---

# 12. 伏神 / 飞神

项目现在已经能定位伏神，但还没有完整飞伏强弱。

《增删卜易》提出伏神是否“有用”与：
- 得日月生；
- 得飞神生；
- 得动爻生；
- 飞神受冲克；
- 飞神空破衰弱；
等相关。

来源：
https://zh.wikisource.org/zh-hans/增删卜易

v3.3 先实现不依赖十二长生/墓绝的部分：

```text
飞生伏
飞克伏
伏得月生
伏得日生
飞神旬空
飞神月破
飞神被有效动爻克
```

复杂墓绝、十二长生留到后续。

---

# 13. 旬空不能永远直接扣分

《增删卜易·旬空章》明确说明“空”需要区分动静、旺衰、冲空、填实等条件。

来源：
https://zh.wikisource.org/zh-hans/增删卜易/26

推荐：

```ts
type KongState =
  | 'static_weak_empty'
  | 'moving_empty'
  | 'supported_empty'
  | 'clashed_empty'
  | 'month_broken_empty'
```

v3.3 先做到：
- 动空与静空分开；
- 冲空生成 timing trigger；
- 出旬生成 timing trigger；
- 旺弱状态影响评分。

---

# 14. “应期”最适合做候选窗口，不应该生成单个神奇精确日期

《黄金策》《增删卜易》中常见应期思路包括：

```text
合住 → 待冲开
空 → 待填实 / 冲空 / 出旬
月破 → 待填实或合
休囚 → 待生扶 / 旺相
动爻/变爻 → 可参考逢值
进神 → 可参考逢值/合
退神 → 可参考逢值/冲
```

并有“远事定年月，近事应日时”的原则。

来源：
- https://zh.wikisource.org/zh-hans/黄金策
- https://zh.wikisource.org/zh-hans/增删卜易

软件不应输出：

```text
“他会在 9 月 25 日 18:43 回家”
```

而应该输出：

```text
传统候选窗口 1：9/22–9/23
依据：用神出空 + 逢值
传统规则权重：中

候选窗口 2：9/28 左右
依据：合绊逢冲
传统规则权重：低/中
```

并显示：

> 这是传统规则生成的象意候选，不是现实事实预测。

---

# 15. 行人 / “什么时候回家”有专项传统规则

《梅花易数》“行人占”讨论体用生克与归迟、归期等传统判断。

来源：
https://ctext.org/wiki.pl?chapter=475043&if=gb

《增删卜易·行人章》则强调：
- 近可看日，远可看月；
- 亲人按关系取用神；
- 疏者可取应爻；
- 动、空、破、合、进退等都会影响传统归期判断；
- “问归期”和“问在外是否平安”最好分开。

来源：
https://zh.wikisource.org/zh-hans/增删卜易

因此 intent=`person_return` 时应额外收集：

```text
对方与你的关系
时间范围
```

---

# 16. 梅花应期应独立于六爻

《梅花易数》卷二、卷三强调：
- 卦气；
- 体用；
- 动静；
- 行坐快慢；
- 不同题材专项占法。

来源：
- https://ctext.org/wiki.pl?chapter=475043&if=gb
- https://ctext.org/wiki.pl?chapter=830866&if=gb

因此应单独实现：

```text
meihua_timing_v1
```

输入：
- 本卦；
- 体用；
- 互卦；
- 变卦；
- 动爻；
- 当前时间；
- intent。

输出：
- near / medium / far；
- 候选五行/地支时间窗；
- 快慢 evidence。

证据不足时：

```ts
applicable = false
```

不要硬给时间。

---

# 17. 专项问题引擎

v3.3 推荐先做四类。

## A. person_return

适用：

```text
他什么时候回来？
XX 什么时候回家？
某人什么时候到？
```

输入：
- subjectRelation
- timeHorizon

输出：
- returnTrend
- timingCandidates
- blockingFactors
- movementSignals

## B. event_timing

适用：

```text
什么时候出结果？
什么时候收到通知？
什么时候完成？
```

输出：
- timingCandidates
- triggerEvidence

## C. task_success

适用：

```text
我能不能完成？
这件事成不成？
完成这个任务的可能性有多高？
```

传统层继续用本地 score。

现实层可额外收集：
- deadline
- progress
- dependencies
- knownBlockers

但现实层不能把传统分数转成现实概率。

## D. lost_item

先做保守版：
- 方位象意；
- 环境象意；
- 查找提示。

不要输出 GPS 精确位置。

---

# 18. Timing Engine 推荐类型

```ts
export type TimingScale =
  | 'hours'
  | 'days'
  | 'weeks'
  | 'months'
  | 'coarse'

export interface TimingTrigger {
  id: string
  rule:
    | 'fill_empty'
    | 'clash_empty'
    | 'break_combine'
    | 'fill_month_break'
    | 'branch_value'
    | 'branch_combine'
    | 'support_useful_god'
    | 'moving_branch'
    | 'changed_branch'
    | 'advance_spirit'
    | 'retreat_spirit'
    | 'meihua_qi'
  branch?: string
  element?: Element
  weight: number
  explanation: string
  sourceRule: string
}

export interface TimingCandidate {
  id: string
  start: string
  end?: string
  scale: TimingScale
  score: number
  confidence: 'low' | 'medium'
  triggerIds: string[]
  explanation: string
}

export interface TimingResult {
  applicable: boolean
  engineVersion: string
  horizon: string
  candidates: TimingCandidate[]
  triggers: TimingTrigger[]
  disclaimer: string
}
```

不要使用 `confidence='high'`，因为这不是统计校准的预测模型。

---

# 19. 从地支 trigger 映射未来日期

推荐完全确定性：

1. 用户先选 horizon；
2. 从起卦日逐日扫描；
3. 每天用统一 calendar engine 得到 dayBranch / dayGanzhi；
4. 匹配 timing triggers；
5. 每天累积 trigger score；
6. 相邻高分日可合并成窗口；
7. 返回 top 3，而不是只挑一个。

这表示：

> “按本项目传统规则，哪些日期触发更多应期条件”。

不代表现实概率。

---

# 20. RatingBreakdown v3.3 真正落地

建议 ScoreEvidence 增加：

```ts
bucket:
  | 'usefulGod'
  | 'shiYing'
  | 'monthDay'
  | 'movement'
  | 'conflictHarmony'
  | 'classicTheme'
  | 'auxiliary'
```

最后：

```text
总分 = 50 + 各 bucket delta
```

UI 显示：

```text
用神状态
世应关系
月日环境
动变趋势
冲合空破
经典主题
辅助信息
```

---

# 21. AI 必须只解释确定性 timing

v3.3 后：

```text
AI 不再自由生成时间日期。
```

AI snapshot 直接给：

```ts
timingResult
```

AI 只能：
- 解释候选窗口；
- 比较 trigger；
- 说明不确定性。

如果：

```ts
timingResult.applicable === false
```

AI 不能自己补日期。

---

# 22. evidenceIds 要覆盖 timing / likelihood

现在只有：

```text
traditionalReading.evidenceIds
```

v3.3 应增加：

```ts
timing.evidenceIds
likelihood.evidenceIds
```

服务端构造：

```text
availableEvidenceIds
```

包括：
- ScoreEvidence IDs
- ClassicEvidence IDs
- TimingTrigger IDs
- casting evidence IDs

模型返回的每个 ID 必须存在。

---

# 23. Provider 配置改为中性命名

当前变量仍叫：

```text
OPENAI_API_KEY
OPENAI_BASE_URL
OPENAI_MODEL
```

但真实 Provider 是讯飞星火。

建议：

```env
LLM_PROVIDER=iflytek-spark
LLM_API_KEY=...
LLM_BASE_URL=https://maas-api.cn-huabei-1.xf-yun.com/v2
LLM_MODEL=spark-x2.5-4b
LLM_API_MODE=chat-completions
```

兼容旧 `.env`：

```text
LLM_* 优先
OPENAI_* fallback
```

---

# 24. v3.3 暂时不要一次加入的内容

本轮不要强行做：
- 完整十二长生；
- 墓绝胎养全部细枝；
- 复杂暗动流派差异；
- 卦身；
- 太岁复杂权重；
- 大规模神煞；
- AI 自动联网搜索现实事件；
- 把结果转成真实“成功概率”。

这些可以留到 v3.4。

---

# 25. v3.3 验收目标

用户问：

> “我妈妈什么时候回家？”

应形成：

```text
intent=person_return
subjectRelation=parent_elder
horizon=30d
```

传统引擎：

```text
父母爻为用神
→ 用神旺衰
→ 空破冲合
→ 动变
→ 进退
→ 三合
→ timing trigger
→ 未来30天候选窗口 top3
```

AI 只解释，不自造日期。

用户问：

> “我完成这个任务的可能性有多高？”

应显示：

```text
传统规则倾向：72 / 100 · 吉
```

并明确：

```text
72 不是现实世界 72%。
```

只有用户提供现实进度、截止日期和障碍后，AI 才给“现实可行性：偏高 / 不确定 / 偏低”。

---

# 26. 主要资料来源

## 传统资料

1. 《增删卜易》  
   https://zh.wikisource.org/zh-hans/增删卜易

2. 《增删卜易·用神章》  
   https://zh.wikisource.org/zh-hans/增删卜易/8

3. 《增删卜易·月将章》  
   https://zh.wikisource.org/zh-hans/增删卜易/16

4. 《增删卜易·日辰章》  
   https://zh.wikisource.org/zh-hans/增删卜易/17

5. 《增删卜易·六合章》  
   https://zh.wikisource.org/zh-hans/增删卜易/19

6. 《增删卜易·六冲章》  
   https://zh.wikisource.org/zh-hans/增删卜易/20

7. 《增删卜易·动变生克冲合章》  
   https://zh.wikisource.org/zh-hans/增删卜易/15

8. 《增删卜易·卦变生克墓绝章》  
   https://zh.wikisource.org/zh-hans/增删卜易/24

9. 《增删卜易·旬空章》  
   https://zh.wikisource.org/zh-hans/增删卜易/26

10. 《黄金策》  
    https://zh.wikisource.org/zh-hans/黄金策

11. 《梅花易数》卷二  
    https://ctext.org/wiki.pl?chapter=475043&if=gb

12. 《梅花易数》卷三  
    https://ctext.org/wiki.pl?chapter=830866&if=gb

## AI Provider

13. 讯飞推理服务 HTTP 文档  
    https://www.xfyun.cn/doc/spark/推理服务-http.html

14. 讯飞星辰 MaaS Token Plan  
    https://www.xfyun.cn/doc/spark/TokenPlan.html

---

# 27. 推荐开发顺序

```text
Phase 0
修 v3.2 当前真实回归 / 文档漂移

Phase 1
六爻规则状态化
（日月旺衰 / 暗动日破 / 合绊合起 / 回头生克 / 三合 / 进退 / 飞伏）

Phase 2
问题专项化 + Timing Engine
（person_return / event_timing / task_success / lost_item）

Phase 3
AI 只读 timing/evidence + UI 证据展开
```

v3.3 的核心不是“更会算命”，而是让：

> **传统规则、确定性工程逻辑、AI解释三层真正闭环。**
