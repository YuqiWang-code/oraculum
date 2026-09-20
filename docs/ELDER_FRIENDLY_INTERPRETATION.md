# 长辈友好现实解读设计（ELDER_FRIENDLY_INTERPRETATION）

> 版本：v4.3.0
> 模块：`src/engine/realWorldInterpretation/`、`src/local-data/interpretation/elderFriendly_*.json`
> 关联文档：[LOCAL_MODEL_RESEARCH.md](./LOCAL_MODEL_RESEARCH.md)、[LOCAL_INTERPRETATION_REVIEW.md](./LOCAL_INTERPRETATION_REVIEW.md)、[V43_AUDIT.md](./V43_AUDIT.md)

## 一、设计目标

让**完全不懂《易经》、不知道"体用/互卦/变卦/用神"是什么**的老人，打开结果页就能直接看懂：

- 现在到底是什么情况
- 这件事接下来该怎么做
- 最需要当心什么
- 这件事会不会成、是偏吉还是偏凶

不要求老人先学任何术语。卦名（"归妹""噬嗑""夬"）对老人没有意义，本层把它们全部翻译成生活话。

## 二、三层架构

```
PlainInterpretation.oneLiner        → 一句话（已有，第一眼）
RealWorldPlainReading               → 现实白话（v4.3 新增，默认展开）
LocalDetailedInterpretation         → 传统研究层（已有，研究模式完整显示）
```

| 层 | 定位 | 受众 | 是否默认展开 |
|---|---|---|---|
| PlainInterpretation | 一句话看懂 + reasons + realityGuard | 所有人 | 是 |
| **RealWorldPlainReading** | **完整现实白话：现在/过程/后来/怎么做/当心** | **长辈、首次使用者** | **是（简明模式）** |
| LocalDetailedInterpretation | 传统分项：本卦/动爻/互卦/变卦/体用/用神/评分证据 | 懂《易经》、想研究的人 | 否（研究模式展开） |

三层**只读**已有结果，互不替代，互不改写：

- 不重新起卦
- 不改 Rating / evidence delta
- 不调用任何模型（见 [LOCAL_MODEL_RESEARCH.md](./LOCAL_MODEL_RESEARCH.md)）
- 不联网、无 `Math.random`

## 三、RealWorldPlainReading 数据结构

对应源码 `src/engine/realWorldInterpretation/types.ts`：

```typescript
interface RealWorldPlainReading {
  headline: string               // 大字标题：一句话点题（18-24px 大字）
  currentSituation: string       // 现在是什么情况（长辈能直接懂）
  why: {
    base: string                  // 本卦说明什么
    moving: string[]              // 动爻说明什么（可能多条）
    mutual?: string               // 互卦说明什么（梅花用）
    changed?: string              // 变卦说明什么
    bodyUse?: string              // 体用说明什么（梅花用）
    rating?: string               // 评分说明什么
  }
  howToAct: string[]             // 接下来怎么做——具体行动列表
  watchOutFor: string[]          // 最需要注意什么
  timeline?: {
    now: string                   // 现在
    turningPoint?: string         // 转折点（动爻）
    middle?: string               // 中间过程（互卦）
    later?: string                // 后续（变卦）
  }
  realityGuard?: string           // 现实提醒（RealityGuard 触发时）
  disclaimer: string              // 免责声明
}
```

### 字段职责

- **headline**：整张卡片最大的字，一句话说清"这卦在劝你干嘛"。不出现卦名、不出现术语。
- **currentSituation**：把"本卦 + 当前状态"翻译成生活话。对应卦级数据 `realLifeNow`。
- **why**：逐条交代"为什么这么看"，但每条都用白话，不出现"用神""世爻"。研究模式下这一层可以折叠。
- **howToAct**：**必须是动作**，不是态度。写"先放一放三天再决定"，不写"宜守静"。
- **watchOutFor**：1-3 条，写"什么情况别做"。
- **timeline**：四段式时间线，对应数据流里的本卦→动爻→互卦→变卦。
- **realityGuard**：复用 PlainInterpretation 的 RealityGuard 触发（身体需求 high / 重要现实问题 medium），原话透传。
- **disclaimer**：固定文案，强调"这是传统参考，不是确定命运"。

## 四、数据流：卦象 → 现实白话

| 术数概念 | 在现实白话里对应 | 取自哪份数据 |
|---|---|---|
| 本卦 | **当前状态** | 卦级 `realLifeNow` |
| 动爻 | **转折点 / 现在最该处理的事** | 动爻 `realLifeAction` + `realLifeCaution` |
| 互卦 | **中间过程** | 卦级 `realLifeProcess` |
| 变卦 | **后续趋向** | 卦级 `realLifeLater` |
| 体用（梅花） | **投入产出 / 你 vs 事情的关系** | `bodyUseMeanings` 白话模板 |
| Rating（五档 + score） | **整体倾向：偏成 / 偏阻 / 看时机** | 不抄分数，只翻译成"这卦偏顺/偏拖/看你怎么做" |
| QuestionCategory | **行动建议方向** | `categoryAdapters.ts` 按类别选 howToAct 模板 |

### 组合规则（确定性）

1. `headline` 由 `Rating.tendency` + `QuestionCategory` + 卦级 `elderFriendlySummary` 的首句组合。
2. `currentSituation` = 卦级 `realLifeNow`，若动爻明确则把动爻的 `realLifeAction` 拼到末尾。
3. `timeline.now` = `realLifeNow`；`timeline.turningPoint` = 动爻 `elderFriendlyMeaning`；`timeline.middle` = `realLifeProcess`；`timeline.later` = `realLifeLater`。
4. `howToAct` 优先取动爻 `realLifeAction`，不足时用 `categoryAdapters` 按类别补 2-3 条通用行动。
5. `watchOutFor` 优先取动爻 `realLifeCaution`，不足时用卦级 `commonMisunderstanding`。
6. `why.rating` 永远不写具体分数，只写"这卦整体偏顺/偏拖/要看你怎么选"。

## 五、长辈友好 UI 规范

| 项 | 规范 |
|---|---|
| 正文字号 | **≥ 18px**（不是 v4.2 的 14px） |
| 标题字号 | headline 18-24px |
| 行高 | **line-height 1.75 – 1.9**（不是 1.5） |
| 字色 | 正文 #1f2329 或更深；**禁止使用 `muted` 类**（v4.2 大量低对比文字） |
| 对比 | 正文与背景对比度 ≥ 7:1（WCAG AAA） |
| 移动端 | 320px 宽度下**不横向溢出**，长词自动断行 |
| 卡片间距 | 卡片之间 ≥ 16px 呼吸空间 |
| 可点区域 | 折叠/展开按钮高度 ≥ 44px（手指可点） |
| 不出现 | 卦名裸用、术语裸用、delta 数字、规则名、评分公式 |
| 折行 | 长句子允许折成 2-3 行，不强迫一行 |

## 六、本地数据字段

### 卦级（每个卦 5 个字段）

写入 `src/local-data/interpretation/elderFriendly_XX_YY.json`（按周文王序分批，见 [LOCAL_LANGUAGE_DATA_DISTILLATION.md](./LOCAL_LANGUAGE_DATA_DISTILLATION.md)）：

| 字段 | 含义 | 字数 |
|---|---|---|
| `elderFriendlySummary` | 一句话总结这卦讲什么（不出现卦名解释） | 60-120 汉字 |
| `realLifeNow` | 现在是什么情况 | 40-100 汉字 |
| `realLifeProcess` | 中间过程会怎样 | 40-100 汉字 |
| `realLifeLater` | 后续会怎样 | 40-100 汉字 |
| `commonMisunderstanding` | 老人最容易误解的点（一句话澄清） | 20-60 汉字 |

### 爻级（每爻 3 个字段）

```typescript
{
  elderFriendlyMeaning: string,   // 这一爻在生活里意味着什么（40-90 汉字）
  realLifeAction: string,         // 这一爻对应的具体做法（20-60 汉字）
  realLifeCaution: string         // 这一爻要当心什么（20-60 汉字）
}
```

示例（遁卦六二，对应已修订的数据）：

```json
{
  "elderFriendlyMeaning": "像用黄牛皮绳把自己牢牢捆住一样，立场和决定稳稳固固，外人动摇不了你。关键不是被绑住逃不掉，而是你自己选择坚守，心里有主心骨。小象说\u201c固志也\u201d。",
  "realLifeAction": "拿定主意的事就坚持下去，别人劝你改、撺掇你换方向，你心里有数就行，不必跟着乱变。",
  "realLifeCaution": "这里的\u201c绑住\u201d是自己站稳，不是被逼得动弹不得。别把好端端的坚持当成了走投无路。"
}
```

## 七、禁词列表与检查机制

禁词定义在 `src/engine/realWorldInterpretation/types.ts`：

```typescript
export const FORBIDDEN_WORDS = [
  '一定', '必然', '百分之百', '百分百', '命中注定',
  '必死', '会死亡', '某年重病', '你会死亡',
  '某年去世', '某年必患重病', '寿命到这里'
]
```

检查入口：`src/engine/realWorldInterpretation/wordingGuard.ts`

- `checkForbiddenWords(text, field)`：检查单段文本。
- `guardWording(obj, prefix)`：递归遍历整个 `RealWorldPlainReading` 对象（含数组、嵌套对象），返回 `{ passed, violations[] }`。

执行时机：

1. **开发期**：`npm run validate`（`scripts/validate-data.ts`）对所有 `elderFriendly_*.json` 跑 `guardWording`，命中即报错。
2. **运行时**：`buildMeihuaRealWorldReading` / `buildLiuyaoRealWorldReading` 组装完成后再跑一次 `guardWording`；命中则把命中字段替换为降级文案，不把含禁词的内容吐给 UI。
3. **古籍层不受此检查**：`classic.judgment` / `tuan` / `daXiang` / 爻辞 / 小象原文原样展示，禁词只针对 Oraculum 现代释义层。

## 八、工作黄金样例："这份工作该不该接"

固定输入（回归锚点，输出必须逐字一致）：

- 问题："这份工作该不该接？"
- 类别：事业工作
- 本卦：遁（kingWen=33）
- 动爻：六二（lineIndex=2）
- 互卦：姤（kingWen=44）
- 变卦：姤（kingWen=44）
- Rating ≥ 70，标签 = 吉

预期 `RealWorldPlainReading.headline`：

> 现在不是硬上的时候，先稳住自己手里的事，这份工作可以先放一放、看清楚再决定。

预期 `currentSituation`：

> 眼下这工作看着有机会，但周围环境还不太稳，有人可能劝你马上定，也有人在说闲话。你自己心里其实已经有倾向了，这时候别被人推着走。

预期 `howToAct` 至少包含：

- 把对方开的条件一条条写下来，别口头答应。
- 先跟家里人或信得过的长辈谈一谈，不急着一周内拍板。
- 如果对方催你马上签，反而要更慢一点。

预期 `watchOutFor` 至少包含：

- 别因为"看起来机会难得"就把自己底线让出去。
- 别把"现在不动"误解成"永远不接"——这卦是让你稳住，不是让你放弃。

此样例同时锁定 PlainInterpretation 一句话（见 [PLAIN_INTERPRETATION_ENGINE.md](./PLAIN_INTERPRETATION_ENGINE.md) 黄金样例），两层文案必须互不重复。

## 九、阅读模式：简明模式 vs 研究模式

| 模式 | 显示内容 | 旧字段处理 |
|---|---|---|
| **简明模式**（默认） | headline + currentSituation + howToAct + watchOutFor + timeline + disclaimer | `LocalDetailedInterpretation` 不显示；`plainExplanation` 不显示 |
| **研究模式** | 简明模式全部 + `LocalDetailedInterpretation` 完整分项 + 经典原文 + 评分证据 + 六爻规则状态 | 全部展开 |

切换字段：`readingMode: 'simple' | 'research'`（v4.3 新设置项，取代 v4.2 的 `resultDisplayMode`，迁移见 [LOCAL_INTERPRETATION_REVIEW.md](./LOCAL_INTERPRETATION_REVIEW.md)）。

`plainExplanation` 标签改造：

- v4.2 标签："白话解释"
- v4.3 标签：**"古文直译"**，并**默认折叠**（在研究模式下也折叠，需要用户点开才看）。
- 原因：审计确认 `plainJudgment` / `plainTuan` / `plainDaXiang` / `lines[].plainText` 实际是古文直译，不是现代释义（见 [V43_AUDIT.md](./V43_AUDIT.md) 第二节）。

## 十、不做的事

- 不做"按卦名生成具体情节"（不自动写"你下周会遇到一位戴眼镜的人"）。
- 不伪造日期、不预测年龄、不预测死亡、不预测重病。
- 不根据 Rating 输出"你今年必发财"这类确定命运话术。
- 不替换或删除旧字段（`plainJudgment` 等继续保留为研究层，见 [LOCAL_INTERPRETATION_REVIEW.md](./LOCAL_INTERPRETATION_REVIEW.md) 数据兼容性一节）。
