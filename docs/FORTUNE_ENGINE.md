# 运势引擎设计（FORTUNE_ENGINE）

> 版本：v4.3.0
> 模块：`src/engine/fortune/`
> 版本号：`FORTUNE_RULESET_VERSION = '1.0.0'`、`FORTUNE_DATASET_VERSION = '1.0.0'`
> 关联文档：[JINGFANG_16_SOURCE_NOTES.md](./JINGFANG_16_SOURCE_NOTES.md)、[FORTUNE_RULE_CONFLICTS.md](./FORTUNE_RULE_CONFLICTS.md)、[LOCAL_MODEL_RESEARCH.md](./LOCAL_MODEL_RESEARCH.md)

## 一、模块定位

运势引擎是 v4.3 新增的**研究层**，与问卦引擎（梅花/六爻）**并列但不耦合**：

- 问卦引擎：回答"**这件事**现在起一卦会怎样"。
- 运势引擎：研究"**这个人**的八字结构 + 京房八宫/《易隐》十六变阶段"。

它**不是**问卦引擎的替代品，也**不**给"今年必发财""哪年结婚"这类确定预测。所有输出都标注来源层，历史术语保护，不伪造精度。

## 二、分层架构

```
┌─────────────────────────────────────────────────┐
│  A. 八字 / 大运 / 流年                            │
│     依赖 lunar-javascript（当前 ^1.6.13）         │
│     输出：四柱、起运、大运、流年、五行、纳音       │
├─────────────────────────────────────────────────┤
│  B. 京房八宫 / 《易隐》十六变                    │
│     纯本地查表 + FLIP_SEQUENCE 确定性翻爻         │
│     输出：17 个阶段（本宫 + 16 次变化）           │
├─────────────────────────────────────────────────┤
│  C. 《易隐》身命三限（研究模式，v1 仅框架）       │
│     v1 只留类型和占位，不实现具体起限算法          │
│     原因：起限方法流派分歧大，见 FORTUNE_RULE_CONFLICTS │
└─────────────────────────────────────────────────┘
```

三层共享同一个 `FortuneSourceLayer` 来源标注（见 [JINGFANG_16_SOURCE_NOTES.md](./JINGFANG_16_SOURCE_NOTES.md)），不共享计算逻辑。

## 三、版本号

```typescript
// src/engine/fortune/types.ts
export const FORTUNE_RULESET_VERSION = '1.0.0'
export const FORTUNE_DATASET_VERSION = '1.0.0'
```

- `FORTUNE_RULESET_VERSION`：八字排盘、大运顺逆、十六变翻爻序列等**规则算法**版本。
- `FORTUNE_DATASET_VERSION`：十六变阶段现代白话、来源注释等**静态数据**版本。
- 两个版本号写入每一次运势计算结果，未来升级不影响旧结果展示（与问卦引擎的 `RULESET_VERSION` / `DATASET_VERSION` 思路一致，见 [ARCHITECTURE.md](./ARCHITECTURE.md)）。

## 四、BirthProfile 与精度处理

```typescript
export type BirthPrecision =
  | 'year_month'    // 只有年月 → 年月二柱
  | 'date'          // 年月日 → 三柱，时柱未知
  | 'exact_time'    // 完整年月日时 → 四柱 + 大运 + 流年

export interface BirthProfile {
  id?: string
  calendarType: 'solar' | 'lunar'
  year: number
  month: number
  day?: number
  hour?: number
  minute?: number
  timezone: string
  precision: BirthPrecision
  traditionalGenderParam: 'male' | 'female' | 'unspecified'
  saveLocally: boolean
}
```

### 输入精度诚实原则

**不伪造缺失的时柱。**

| precision | 输出柱数 | 不做什么 |
|---|---|---|
| `year_month` | 仅年柱 + 月柱 | 不称"完整八字"；不算大运/流年 |
| `date` | 年柱 + 月柱 + 日柱 | **不**把 `hour` 偷偷填 00:00 来凑时柱；不算大运/流年 |
| `exact_time` | 完整四柱 + 大运 + 流年 | 全部计算 |

对应源码 `computeBaziOverview` 的分支：

- `year_month`：用 `Solar.fromYmd(year, month, 1)` 取年月柱，`precisionNote` 写明"仅提供出生年月"。
- `date`：用 `Solar.fromYmd(year, month, day)` 取三柱，`precisionNote` 写明"时柱未知"。
- `exact_time`：用 `Solar.fromYmdHms(year, month, day, hour, minute, 0)`。

### traditionalGenderParam

传统大运顺逆需要性别（阳男阴女顺排、阴男阳女逆排）。项目不根据姓名、外貌、身份证号猜测：

| 输入 | genderCode | 行为 |
|---|---|---|
| `'male'` | `1` | 阳男，大运顺排 |
| `'female'` | `0` | 阴女，大运逆排 |
| `'unspecified'` | — | **不猜**，不计算起运、不输出大运/流年 |

UI 上性别字段必须让用户主动选；用户选"不愿透露"就走 `unspecified`，后端返回空数组并提示"传统大运需要性别参数"。

## 五、lunar-javascript API 使用说明

当前锁定版本：`^1.6.13`（见 `package.json`）。**不自动升级**，避免 API 行为变化。

### 八字计算流程

```typescript
import { Solar } from 'lunar-javascript'

// 1. 公历对象
const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0)

// 2. 转农历
const lunar = solar.getLunar()

// 3. 八字对象
const ec = lunar.getEightChar()

// 4. 四柱干支
const yearGz   = `${ec.getYearGan()}${ec.getYearZhi()}`
const monthGz  = `${ec.getMonthGan()}${ec.getMonthZhi()}`
const dayGz    = `${ec.getDayGan()}${ec.getDayZhi()}`
const hourGz   = `${ec.getTimeGan()}${ec.getTimeZhi()}`

// 5. 起运（genderCode: 1=男, 0=女）
const yun = ec.getYun(genderCode)
const startYear   = yun.getStartYear()
const startSolar  = yun.getStartSolar().toYmd()

// 6. 大运
const allDaYun = yun.getDaYun()
for (const dy of allDaYun) {
  const gz       = dy.getGanZhi()
  const startAge = dy.getStartAge()
  const endAge   = dy.getEndAge()
  // 跳过空干支（童限等非真正大运）
  if (!gz || gz.trim() === '') continue
}

// 7. 流年（每步大运下）
for (const dy of allDaYun) {
  const liuNians = dy.getLiuNian()
  for (const ln of liuNians) {
    const year  = ln.getYear()
    const age   = ln.getAge()
    const gz    = ln.getGanZhi()
  }
}
```

### 注意点

- `getYun(genderCode)` 的 `genderCode`：**1 = 男，0 = 女**（lunar-javascript 约定）。项目 `traditionalGenderParam` 与之对应：`male → 1`、`female → 0`。
- `getDaYun()` 返回的第一步可能是空干支（童限），**必须跳过**空串，否则会出现"空干支大运"。
- `getStartAge()` / `getEndAge()` 是**虚岁**，UI 上必须标注"虚岁"，不混作周岁。
- 时区由 `BirthProfile.timezone` 决定（默认 `Asia/Shanghai`），不直接用 UTC。

## 六、十六变引擎

详见 [JINGFANG_16_SOURCE_NOTES.md](./JINGFANG_16_SOURCE_NOTES.md)。这里只列接口：

```typescript
export const FLIP_SEQUENCE = [1,2,3,4,5,4,3,2,1,2,3,4,5,4,3,2] as const

// 输入：本宫六爻（自下而上 [初,二,三,四,五,上]，1=阳 0=阴）
// 输出：17 个状态（初始本宫 + 16 次变化）
export function transformSixteen(
  baseLines: [0|1,0|1,0|1,0|1,0|1,0|1]
): SixteenTransformResult
```

乾宫 golden sequence（必须精确，回归测试锁定）：

```
乾 姤 遁 否 观 剥 晋 旅 鼎 大有 离 噬嗑 颐 益 无妄 同人 乾
```

## 七、《易隐》身命三限（v1 仅框架）

- 类型占位在 `types.ts`，**v1 不实现具体起限算法**。
- 原因：起限方法流派分歧大（见 [FORTUNE_RULE_CONFLICTS.md](./FORTUNE_RULE_CONFLICTS.md)），贸然选一派会误导用户。
- v1 UI 上"身命三限"只显示一段说明文字："《易隐》身命三限起限方法流派分歧，本版本暂不展示具体推算。"
- 后续版本如果实现，必须先在 FORTUNE_RULE_CONFLICTS 里选定一派并标注来源。

## 八、禁止事项（硬约束）

1. **禁止伪精确命运分**：不输出"你今年运势 87 分""婚姻运 92 分"这类数字。
2. **禁止死亡年龄预测**：不预测寿元、不预测哪年有生死关。
3. **禁止十六变按年龄平均**：不把"本宫~冢墓"机械对应成 0-80 岁每卦 5 年。十六变是**结构研究层**，不是人生时间表。
4. **禁止根据八字凭空映射本命卦**：不按"卦命诀"把八字直接换算成"你本命卦是 XX"。本命卦只提供三种来源方式（见 [FORTUNE_RULE_CONFLICTS.md](./FORTUNE_RULE_CONFLICTS.md)）。
5. **禁止伪造时柱**：缺时辰就显示三柱或二柱，不填 00:00。
6. **禁止猜测性别**：`unspecified` 就不算大运。
7. **禁止把历史术语当现实术语**："绝命""棺椁""冢墓"必须显示历史术语保护提示（见 [JINGFANG_16_SOURCE_NOTES.md](./JINGFANG_16_SOURCE_NOTES.md)）。

## 九、隐私与持久化

- **默认不保存出生档案**。`BirthProfile.saveLocally` 默认 `false`。
- 只有用户在 UI 上**主动勾选**"保存出生资料到本机"，才写入 IndexedDB。
- 出生档案与问卦记录**分表存储**（不复用 `DivinationRecord`），删除历史问卦记录不影响出生档案；删除出生档案不影响问卦记录。
- 导出/导入功能默认**不包含**出生档案，需要用户单独勾选。
- 不把出生资料上报任何服务器（整个 PWA 本就无后端 AI 调用，见 [LOCAL_MODEL_RESEARCH.md](./LOCAL_MODEL_RESEARCH.md)）。

## 十、模块文件清单

```
src/engine/fortune/
├─ index.ts                  # 统一导出
├─ types.ts                  # BirthProfile / FortuneSourceLayer / 版本号
├─ bazi/
│  └─ index.ts               # computeBaziOverview / computeDaYun / computeLiuNian
└─ jingfang16/
   ├─ index.ts               # 统一导出
   ├─ types.ts               # FLIP_SEQUENCE / SixteenStage / TransformStep
   ├─ stages.ts              # SIXTEEN_STAGES（17 个阶段定义）
   ├─ transform.ts           # transformSixteen / getPalaceBaseLines
   └─ sourceNotes.ts         # SOURCE_LAYER_NOTES / 来源说明 / 历史术语保护
```
