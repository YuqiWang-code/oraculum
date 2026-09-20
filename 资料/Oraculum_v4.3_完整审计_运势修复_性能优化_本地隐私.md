# Oraculum v4.3 完整审计：运势修复、性能优化与本地隐私

> 仓库：`https://github.com/YuqiWang-code/oraculum`
>
> 审计 main：`24f8573e686baccd8b6f6986d9690627ed837bab`
>
> 当前版本：APP 4.3.0 / RULESET 4.1.0 / DATASET 3.0.0 / LOCAL_KNOWLEDGE 1.2.0 / FORTUNE_RULESET 1.0.0 / FORTUNE_DATASET 1.0.0
>
> 正式站：`https://oraculum-3g8.pages.dev`
>
> 审计日期：2026-09-20

---

# 0. 审计范围与一个重要限制

本次完整审查了 main 分支当前 v4.3 的主要运行链路：

- 首页
- 问卦
- 结果
- 历史
- 知识
- 设置
- 新增“运势”
- IndexedDB / Dexie
- PWA / Workbox
- 长辈友好 local-data
- 八字 / 大运 / 流年
- 京房八宫 / 《易隐》十六变
- 现实白话层
- tests/fortune

我也尝试直接读取正式站：

```text
https://oraculum-3g8.pages.dev/
https://oraculum-3g8.pages.dev/fortune
https://oraculum-3g8.pages.dev/knowledge
```

但当前审计环境无法抓取 `pages.dev`（工具返回 cache miss / inaccessible），因此**不能诚实地声称我已经在正式网页里亲自点击并输入了示例**。

所以本文把：

```text
源码可确定问题
```

与：

```text
需要豆包/浏览器真人 smoke 验证的问题
```

严格分开。

这比假装“已经点过网站”更可靠。

---

# 1. 总体结论

v4.3 的方向是对的：

- “一句话看懂”与“现实白话解读”已经建立；
- 64卦 + 384爻长辈数据已加入；
- 运势页已经有 UI 骨架；
- 八字、流年、京房十六变都有确定性代码与测试；
- 历史仍然是本地 IndexedDB；
- 没有恢复 AI / 后端。

但是：

> **运势页目前更像“排出来了”，还没有真正做到“解释清楚了”。**

而且八字模块里存在几处必须先修的**真实正确性问题**，不能只继续补文案。

优先级建议：

```text
P0 正确性
→ P1 运势解释层
→ P1 性能
→ P2 UI/产品细节
```

---

# 2. P0：八字“公历/农历”切换目前实际上没有真正接入核心计算

文件：

```text
src/components/fortune/BirthInputCard.vue
src/engine/fortune/bazi/index.ts
```

UI 允许：

```text
公历
农历
```

但是 `computeBaziOverview()`、`computeDaYun()`、`computeLiuNian()` 内部无论 `calendarType` 是什么，都直接：

```ts
Solar.fromYmd(...)
Solar.fromYmdHms(...)
```

因此：

```text
用户选择“农历”
↓
代码仍把输入数字当成公历日期
```

这是实际 bug。

有趣的是 `JingFang16Card` 的“出生时刻起卦”反而单独处理了农历转公历，所以现在同一份出生资料：

```text
八字模块
和
京房实验起卦模块
```

可能使用的是两个不同日期。

## 修复

建立唯一入口：

```ts
normalizeBirthProfileToSolar(profile)
```

公历：

```ts
Solar.fromYmd / fromYmdHms
```

农历：

```ts
Lunar.fromYmd / fromYmdHms
→ getSolar()
```

之后：

```text
computeBaziOverview
computeDaYun
computeLiuNian
出生时刻梅花实验起卦
```

全部复用同一个 normalize helper。

### 农历闰月也必须补

6tail 官方文档明确：

```text
Lunar.fromYmd(...)
月份 1–12
闰月使用负数，例如闰二月 = -2
```

来源：

`https://6tail.cn/calendar/lunar.new.html`

所以 BirthProfile 需要：

```ts
lunarLeapMonth?: boolean
```

并使用：

```text
LunarYear.fromYear(year).getLeapMonth()
```

只在该年确实有对应闰月时允许选择“闰”。

---

# 3. P0：大运“顺/逆”显示逻辑是错的，而且当前测试把 bug 锁死了

当前代码：

```ts
const genderCode = traditionalGenderParam === 'male' ? 1 : 0
const yun = ec.getYun(genderCode)

const direction: '顺' | '逆' =
  genderCode === 1 ? '顺' : '逆'
```

这实际上等于：

```text
男 = 顺
女 = 逆
```

传统算法以及 6tail 自己的实现并不是这样。

6tail `Yun` 官方同源实现：

```java
boolean yang = 0 == lunar.getYearGanIndexExact() % 2;
boolean man = 1 == gender;
forward = (yang && man) || (!yang && !man);
```

即：

```text
阳男、阴女 → 顺
阴男、阳女 → 逆
```

来源：

`https://github.com/6tail/lunar-java/blob/master/src/main/java/com/nlf/calendar/eightchar/Yun.java`

## 非常关键的后果

当前真正的大运序列：

```ts
ec.getYun(genderCode)
```

内部很可能已经按阴阳男女算对了。

但是 UI 的：

```text
顺行 / 逆行
```

却又按“男/女”重新写错。

所以会发生：

```text
底层大运序列按逆排
但界面显示“顺行”
```

这是解释层与计算层互相矛盾。

## 当前测试也错

`tests/fortune/bazi.test.ts` 当前断言：

```text
male -> 顺
female -> 逆
```

这不是正确 golden。

必须删除并改成四组：

```text
阳男 -> 顺
阴男 -> 逆
阳女 -> 逆
阴女 -> 顺
```

并尽量直接以 library 的：

```text
yun.isForward()
```

为唯一事实源。

如果当前 JS 1.7.7 API 暴露 `isForward()`，直接使用。

若没有，再按和上游完全一致的年干阴阳算法实现，不允许凭 UI 性别判断。

---

# 4. 一个可以立刻抓出上面 bug 的示例

官方 `lunar-javascript` 测试样例：

```text
2005-12-23 08:37
八字：
乙酉 戊子 辛巳 壬辰
```

2005 年年干：

```text
乙 = 阴干
```

所以：

```text
男性 → 阴男 → 逆
女性 → 阴女 → 顺
```

当前 Oraculum：

```text
男 → UI 写顺
女 → UI 写逆
```

恰好完全反过来。

这个例子必须加入 v4.4 browser smoke。

---

# 5. P0：只有“年月”时，当前月柱是靠“假设当月1号”算出来的

当前：

```ts
precision === 'year_month'
```

会：

```ts
Solar.fromYmd(year, month, 1)
```

再拿这个 1 号算年柱/月柱。

这不满足“信息不足不伪造”的设计原则。

八字月柱以节令为界。

例如同一个公历月份中：

```text
节前
节后
```

月柱可能不同。

2 月还涉及立春附近年柱变化。

因此：

```text
只知道 2024 年 2 月
```

并不足以唯一确定传统年/月柱。

## 推荐

### 只有年月

不要再显示：

```text
年月二柱 = 某某 某某
```

改成：

```text
出生日期不足，无法精确确定节令年柱/月柱。
```

可以选做：

```text
扫描该月全部日期
→ 如果整月柱完全一致才显示
→ 如果有两种可能则显示“可能 A / B”
```

但 v4.4 最稳妥的是：

> 只有年月时只展示输入资料，不生成伪精确月柱。

---

# 6. P0：农历无闰月 UI，农历输入目前无法正确表达真实生日

当前：

```text
农历年 / 月 / 日
```

只有月数字。

但农历存在：

```text
普通四月
闰四月
```

二者不能混。

修复后：

```text
历法 = 农历
↓
查询 LunarYear.getLeapMonth()
↓
若该年有闰月
↓
在月份旁显示“普通 / 闰月”
```

非法闰月要阻止提交。

---

# 7. P0：出生日期输入只检查 1–31，没有校验真实日期

当前：

```text
2025-02-31
```

可以通过表单基本校验。

然后底层可能抛异常。

`FortuneView.vue` 又使用：

```ts
catch {
  overview.value = null
}
```

用户最后看到的可能只是：

```text
结果不见了
```

没有错误说明。

## 修复

必须有：

```ts
validateBirthProfile()
```

返回结构化错误：

```ts
{
  ok: false,
  field: 'day',
  message: '2025年2月没有31日'
}
```

FortuneView 增加：

```text
fortuneError
```

禁止 silent catch。

---

# 8. P0：勾选“保存本地档案”目前没有实际保存

BirthInputCard 有：

```text
保存本地档案
```

DB 也已经有：

```text
fortuneProfiles
saveFortuneProfile()
```

但是 `FortuneView.onCompute()` 当前没有调用：

```ts
saveFortuneProfile()
```

所以：

> 这个 checkbox 现在只是 UI，看起来能保存，实际没有保存。

## 二选一

推荐实现：

```text
用户主动勾选
→ saveFortuneProfile()
→ 运势页显示“已保存在本机”
→ 可在“本地出生档案”列表重新选择 / 删除
```

不勾选：

```text
只驻留当前内存
刷新即消失
```

---

# 9. P1：起运“顺逆”不仅算错，UI 还把“逆”画成坏事

BaziOverview：

```text
顺 -> label-good
逆 -> label-bad
```

DaYunTimeline 也用不同“好/坏感”颜色区分顺逆。

这是概念错误。

```text
顺排 / 逆排
```

只是排列方向，不是：

```text
吉 / 凶
```

## 修复

统一中性色：

```text
顺排
逆排
```

不能：

```text
顺 = 绿色好
逆 = 红色坏
```

---

# 10. P1：起运年龄信息被过度简化

6tail Yun 提供：

```text
getStartYear()
getStartMonth()
getStartDay()
getStartHour()
getStartSolar()
isForward()
```

来源：

`https://github.com/6tail/lunar-java/blob/master/src/main/java/com/nlf/calendar/eightchar/Yun.java`

当前 Oraculum 只保存：

```text
startAge = getStartYear()
```

于是本来：

```text
8年0月20天
```

会只显示：

```text
8 岁
```

## 修复

QiYun：

```ts
{
  startYears
  startMonths
  startDays
  startHours
  startDate
  direction
  yunSect
}
```

UI：

```text
起运：出生后 8年0月20天
起运公历：xxxx-xx-xx
排列：逆排
```

---

# 11. P1：大运 Entry 定义了 startDate，但实际没有填

`DaYunEntry`：

```ts
startDate?: string
```

DaYunTimeline：

```vue
<div v-if="expandedEntry.startDate">
```

但 `computeDaYun()` 并未赋值。

这是“UI 看起来支持，数据根本没有”的半实现字段。

要么正确生成每步起止公历范围，要么暂时从 UI/类型删除。

---

# 12. P1：当前代码硬编码的 lunar-javascript 版本说明不是真实安装版本

`package.json`：

```text
"lunar-javascript": "^1.6.13"
```

但当前 `package-lock.json` 实际锁定：

```text
1.7.7
```

同时：

```ts
getLunarVersion()
```

却返回：

```text
^1.6.13
```

因此页面/报告可能把“依赖声明”当成“实际运行版本”。

## 推荐

为了可复现，直接 pin：

```json
"lunar-javascript": "1.7.7"
```

然后重新：

```text
npm install
lint
test
validate
build
```

`getLunarVersion()` 统一显示：

```text
1.7.7
```

不要显示 caret 范围。

---

# 13. P1：晚子时流派没有和现有“日界规则”打通

6tail `EightChar` 有：

```text
sect = 2：23:00-23:59 日柱按当天
sect = 1：晚子时日柱按次日
```

来源：

`https://github.com/6tail/lunar-java/blob/master/src/main/java/com/nlf/calendar/EightChar.java`

Oraculum 设置已经有：

```text
00:00 现代日界
23:00 子初换日
```

但 Fortune 八字完全没使用这个设置。

因此 23:00–23:59 出生者：

```text
问卦历法设置
与
运势八字
```

可能使用不同日界。

## 推荐

Fortune 增加：

```text
八字日柱日界：
○ 00:00换日 / 晚子时仍按当天（sect=2）
○ 23:00子初换日（sect=1）
```

或者明确映射全局 `dayBoundaryRule`。

并在结果里显示采用哪个规则。

---

# 14. P1：时区字段现在语义不清楚

BirthProfile 有：

```text
timezone
```

但八字计算直接使用用户填写的年月日时，不根据 timezone 转换。

所以当前它本质上是：

```text
“这串出生钟表时间属于哪个时区”的元数据
```

不是：

```text
“自动把一个 UTC instant 转成出生地时间”
```

建议 UI 改成：

```text
出生时区（用于记录出生地当地时间）
```

并说明：

```text
八字按你填写的当地钟表时间排盘。
```

不要让用户误以为切换时区就会自动校正出生时刻。

“真太阳时”属于另一套复杂问题，本轮不要加入。

---

# 15. P1：五行统计实现很可疑，catch 会把问题悄悄吞掉

当前：

```ts
const wuxing = ec.getWuXing()
```

然后强制 cast：

```ts
as Record<string, number>
```

但 6tail 的 `EightChar` 官方 API主要是：

```text
getYearWuXing()
getMonthWuXing()
getDayWuXing()
getTimeWuXing()
```

并没有看到一个“直接返回五行计数 Record”的标准 `getWuXing()`。

现在代码又：

```ts
try/catch
```

所以方法不存在时只会悄悄不显示“五行统计”。

## 修复

先在当前实际 `lunar-javascript 1.7.7` 本地运行确认 API。

推荐项目自己明确计数：

```text
四柱天干 + 四柱地支
→ 显式 GAN_ELEMENT / ZHI_ELEMENT
→ 木火土金水计数
```

并说明：

```text
这是八个表层干支的五行数量，不等于命局旺衰。
```

不要把“数量多”直接解释成“强”。

---

# 16. 运势解释现在为什么“看起来没做完”

这是用户当前最直观的问题。

## 流年

`LiuNianEntry` 已定义：

```ts
structureHint?
clashHarmonyHint?
plainReading?
```

但是 `computeLiuNian()` 只填：

```text
year
age
daYunGanzhi
liuNianGanzhi
sourceLayer
```

所以 UI 的：

```vue
e.plainReading ?? neutralReading(e)
```

几乎永远走 fallback：

```text
传统记号：流年XX，行XX大运。
这只是干支层面的粗略标签……
```

也就是说：

> **流年列表目前只是“排年表”，没有真正分析。**

---

# 17. 大运也只是“排时间轴”，没有解释这个十年为什么不同

当前 DaYunTimeline 展开只有：

```text
干支
年龄
顺逆
起运日期（实际还没填）
```

没有：

```text
这步大运相对日主是什么十神？
和原局哪些支相合 / 相冲？
相对上一运结构发生了什么变化？
这个十年传统上更强调什么主题？
为什么？
```

所以用户看到“甲子、乙丑……”也不知道是什么意思。

---

# 18. 十六变的解释是“阶段固定模板”，没有解释实际卦变

当前：

```text
SIXTEEN_STAGES[index].modernNote
```

只由：

```text
本宫 / 一世 / 二世 / ...
```

决定。

因此不管：

```text
乾宫一世 = 姤
坤宫一世 = 复
```

“一世”的解释几乎是同一段。

UI 虽然显示：

```text
阶段名 + 卦名
```

但没有把：

```text
上一卦 → 这一卦
翻了哪一爻
这一卦到底在说什么
```

组合起来。

这就是“每个变化、解释都没有做好”的直接原因。

---

# 19. 十六变还有一个明确的文字错误

FLIP_SEQUENCE：

```ts
[1,2,3,4,5,4,3,2,1,2,3,4,5,4,3,2]
```

第 9 次变化（进入归魂）翻的是：

```text
初爻
```

但 `stages.ts` 的“归魂”文案写：

```text
三爻再变
```

这是错误的。

必须改成：

```text
初爻再变
```

并新增：

```text
stage modernNote 中提到的爻位
必须和 FLIP_SEQUENCE[index-1] 一致
```

自动测试。

---

# 20. “身命卦研究模式 A”目前是一个未实现的按钮

JingFang16Card：

```text
A. 身命卦研究模式
```

但选择 A 后：

```ts
result.value = null
```

UI 自己告诉用户：

```text
请去问卦页起卦，再回 C 手动选宫
```

因此 A 并不是实际功能。

## 推荐直接实现

用户选择 A：

```text
读取本机最近问卦记录
↓
让用户手动选择其中一条
↓
显示：
问题 / 时间 / 卦名 / 所属宫
↓
明确点击“以此作为研究身命卦”
↓
取该卦 palace
↓
生成十六变
```

必须用户主动确认，不能偷偷使用最近记录。

---

# 21. 出生时刻起卦 B 需要显示“中间过程”

当前 B：

```text
出生时间
→ meihua_time_v1
→ 得到某卦
→ 取该卦所属宫
→ 直接显示宫本卦十六变
```

但 UI 最后只看到：

```text
基准卦：乾/坤/...
```

应该显示：

```text
出生时刻实验起卦：XX卦
所属：XX宫
十六变研究基准：XX宫纯卦
```

并继续保留：

```text
Oraculum 项目规范 / 实验
```

避免用户误以为出生时刻直接得出的就是宫本卦。

---

# 22. v4.4 推荐的“大运 / 流年解释引擎”

不要做“好坏概率”。

建立：

```text
src/engine/fortune/analysis/
├─ tenGod.ts
├─ branchRelations.ts
├─ analyzeDaYun.ts
├─ analyzeLiuNian.ts
├─ plainReading.ts
└─ types.ts
```

类型示例：

```ts
interface FortuneStructureEvidence {
  id: string
  sourceLayer: 'bazi-yun' | 'oraculum-normalization'
  title: string
  detail: string
  kind:
    | 'ten_god'
    | 'branch_clash'
    | 'branch_combine'
    | 'dayun_liunian'
    | 'natal_relation'
}

interface DaYunAnalysis {
  ganzhi: string
  stemTenGod: string
  relations: FortuneStructureEvidence[]
  focus: string[]
  why: string[]
  howToAct: string[]
  watchOut: string[]
}

interface LiuNianAnalysis {
  year: number
  ganzhi: string
  daYunGanzhi: string
  stemTenGod: string
  relations: FortuneStructureEvidence[]
  focus: string[]
  why: string[]
  howToAct: string[]
  watchOut: string[]
}
```

---

# 23. v4.4 流年 V1 只做透明、可追溯的结构

推荐先做：

### 日主 vs 流年天干

明确得到十神：

```text
比肩 / 劫财
食神 / 伤官
正财 / 偏财
正官 / 七杀
正印 / 偏印
```

需要显式五行 + 阴阳映射并写全测试。

### 地支关系

先只做来源相对清楚、代码已有基础的：

```text
六合
六冲
```

对：

```text
流年支 vs 原局年/月/日/时支
大运支 vs 原局
流年支 vs 大运支
```

生成 evidence。

三合、刑、害、破可以以后单独版本化，避免一次塞太多流派规则。

### 不打分

输出：

```text
今年更值得关注：
为什么：
怎么做：
注意什么：
```

不输出：

```text
88分
发财概率
升职概率
```

---

# 24. 十六变每一步应该怎么解释

新增：

```ts
interface JingFangStepReading {
  transition: string       // 乾 → 姤
  flippedLine: number      // 初爻
  stageMeaning: string     // 一世阶段说明
  hexagramMeaning: string  // 姤的长辈友好解释
  structuralChange: string // “第1爻由阳转阴……”
  sourceNote: string
}
```

每个节点显示：

```text
第1变 · 一世
乾 → 姤
本次变化：初爻翻转

阶段是什么意思：
变化刚从底层开始。

变成“姤”后怎么看：
[直接读取 姤 的 elderFriendlySummary / realLifeNow]

这一层能说明什么：
这是卦变结构的研究解释，不自动对应某个年龄或现实事件。
```

这样 17 个节点才真正“各不相同”。

---

# 25. 历史记录：当前不同设备不会自动共享

当前业务历史：

```text
Dexie / IndexedDB
数据库名 smart-divination
```

没有：

```text
Firebase
Supabase
Cloudflare D1
KV
后端 API
账号登录
云同步
```

MDN 明确说明 IndexedDB 遵循同源原则，并存在当前浏览器的本地存储中。

来源：

`https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB`

所以当前：

```text
妈妈的 iPhone
朋友的 Android
你的电脑
```

三台设备打开同一个：

```text
oraculum-3g8.pages.dev
```

不会通过 Oraculum 自动同步历史。

Cloudflare Pages 只分发静态文件，不保存这些问卦记录。

---

# 26. 但“设备隔离”要准确理解

IndexedDB 隔离单位大致是：

```text
origin + 浏览器 profile
```

不是“真实世界中的人”。

所以：

### 不同设备

不会共享。

### 同一设备，不同浏览器

通常也是不同存储。

### 同一设备、同一浏览器 profile，两个人轮流用

会看到同一个本地历史。

如果未来要求：

```text
同一台 iPad 上妈妈和爸爸也要分开
```

再加入：

```text
本地人物档案 / local profile
```

即可。

本轮不要上云账号。

---

# 27. 建议给“本地隐私”做成产品可见能力

History / Settings 增加：

```text
隐私与存储

✓ 问卦历史仅保存在本机浏览器
✓ 出生档案仅在勾选“保存本地档案”后保存
✓ 不上传 Cloudflare
✓ 不跨设备自动同步
✓ 导出/导入 JSON 只有用户主动操作才会移动数据
```

并提供：

```text
查看本机存储用量
清空问卦历史
清空出生档案
```

可选使用：

```ts
navigator.storage.estimate()
```

---

# 28. 性能问题：v4.3 确实新增了明显的数据负担

当前 local-data 静态导入：

```text
hexagramMeanings.json       ≈159 KB
hexagramMeaningsPart2.json  ≈138 KB

8份 elderFriendly JSON
合计约                    ≈208 KB
```

仅这部分原始 JSON 已约：

```text
≈ 500 KB
```

还没算：

```text
经典原文
Vue 代码
fortune
规则
lunar-javascript
```

真正的问题不只是“文件有500KB”，而是：

> **它们现在被静态 import，并在模块初始化时全部合并。**

`src/local-data/index.ts`：

```ts
import ELDER_01_08 from ...
...
import ELDER_57_64 from ...
```

然后：

```ts
Object.assign(ALL_ELDER, batch)
```

所以即使你把文件拆成8份：

> **从运行时角度仍然几乎等于一次性全部加载。**

---

# 29. 这也是为什么“拆成8个 JSON”还不够

真正懒加载必须：

```ts
() => import('./elderFriendly_01_08.json')
```

而不是：

```ts
import x from './elderFriendly_01_08.json'
```

推荐：

```ts
const ELDER_LOADERS = {
  0: () => import('./elderFriendly_01_08.json'),
  1: () => import('./elderFriendly_09_16.json'),
  ...
}
```

根据 King Wen：

```text
1–8 → batch0
9–16 → batch1
...
```

只加载当前结果真正需要的：

```text
本卦
互卦
变卦
```

最多通常 3 个 batch。

---

# 30. 结果页应该异步加载“重解释”

目前 `ResultView` 静态 import：

```text
localInterpretation
plainInterpretation
realWorldInterpretation
```

而它们最终会触达 local-data。

建议改为：

```text
结果基础信息立即显示
↓
异步加载当前卦需要的 knowledge batch
↓
显示“正在整理白话解读…”
↓
解读卡出现
```

不要让：

```text
64卦 + 384爻全部现代释义
```

阻塞首屏。

---

# 31. 问卦页不要因为“生成一句话”提前加载整套大数据

当前 orchestrator 在起卦时就：

```ts
interpretMeihuaPlain()
interpretLiuyaoPlain()
```

这些会依赖本地知识。

因此用户只进入问卦流程，也可能把大数据拉进当前 chunk / 运行链路。

v4.4 建议：

```text
orchestrator
只负责：
起卦 + rating + classic evidence + 轻量 summary

ResultView
负责异步加载：
一句话 / 长辈白话 / 详细解释
```

或者建立一个很小的：

```text
semantic-core.json
```

只存：

```text
64卦核心主题
384爻主题词
```

一句话引擎用它。

完整长辈释义按需加载。

---

# 32. Knowledge 页也应该真正按展开加载

现在 KnowledgeView：

```ts
knowledgeMap = computed(...)
for (const h of HEXAGRAMS) {
  getHexagramKnowledge(h.kingWen)
}
```

也就是打开“知识”时马上访问全部64卦知识。

建议：

```text
首屏只加载：
卦号 / 卦名 / 上下卦 / 关键词搜索索引

用户点开“大畜”
↓
只动态加载大畜所在 batch
```

---

# 33. 流年 0–120 岁不应该一次全部计算

FortuneView 当前：

```ts
computeLiuNian(p, [0, 120])
```

无论 UI 目前只显示：

```text
0–30
```

都先把：

```text
0–120
```

全部计算出来。

这对老手机没有必要。

推荐：

```text
默认只计算当前年龄附近一段
或
默认 0–30
```

用户切换年龄范围时：

```text
按需计算 + memo cache
```

更好的 UI：

```text
0–9
10–19
20–29
...
```

一次只渲染一个十年组。

这样甚至不需要引入虚拟列表依赖。

Vue 官方也建议大型列表不要把所有 DOM 一次全部渲染，可用虚拟化/分段方式降低开销：

`https://vuejs.org/guide/best-practices/performance`

---

# 34. 十六变也不需要一次展开17段长文

默认：

```text
17个节点只显示：
阶段 + 卦名 + 箭头
```

点一个才显示：

```text
阶段意义
该卦白话
变化原因
来源
```

减少 DOM 与长文本。

---

# 35. PWA Workbox 当前把所有 JS 都纳入 precache

vite.config：

```ts
globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}']
```

也就是 build 后的全部 JS chunk 都会匹配。

Workbox 官方明确指出：如果 precache 资产太多，应通过 glob 配置排除不必要资源。

来源：

`https://developer.chrome.com/docs/workbox/precaching-with-workbox`

不过优化顺序建议：

### 第一阶段

先做：

```text
真实 dynamic import
```

即使 chunk 仍被 SW 下载：

```text
浏览器不会在首屏全部解析执行这些动态 chunk
```

这通常已经能显著减少主线程卡顿。

### 第二阶段

如果 build 分析仍显示 precache 太重，再：

```text
核心 app shell precache
重型 knowledge / elder / fortune detail → runtime cache
```

这样“首次访问某个资料页需要加载一次，之后可离线”。

不要一上来就破坏离线能力。

---

# 36. Vue 大型不可变数据使用 shallowRef / markRaw

Vue 官方性能文档还建议：

> 大型不可变数据结构可以降低深层响应式开销。

当前：

```text
daYun[]
liuNian[]
大量 knowledge object
```

都可以考虑：

```ts
shallowRef
Object.freeze
markRaw
```

不要让 Vue 对几百个深层文本字段做不必要的 reactive proxy。

官方：

`https://vuejs.org/guide/best-practices/performance`

---

# 37. v4.4 建议性能预算

新增脚本：

```text
scripts/check-bundle-size.mjs
```

每次 build 后输出：

```text
入口 JS
fortune chunk
knowledge chunk
elder batch chunks
PWA precache 总字节
```

建议先记录 v4.3 baseline，再设预算。

不要凭感觉说“卡”。

同时用 Chrome / Edge Performance：

```text
冷启动
首页
问卦
结果
运势计算
知识页
```

记录：

```text
JS parse/evaluate
long task
DOM node count
IndexedDB
```

---

# 38. 页面级审查结论

## 首页 `/`

源码链路正常。

优点：

- 日期时区已走设置；
- 最近问卦只取3条；
- 安装 / 分享仍在。

建议：

- 增加“运势”快捷入口；
- 增加“历史仅保存在本机”的简短隐私提示。

---

## 问卦 `/divination`

功能结构正常。

问题主要是性能：

- orchestrator + plain interpretation 可能提前引入较重 local-data。

建议：

- 起卦核心与解释数据解耦。

---

## 结果 `/result/:id`

v4.3 UI方向明显比 v4.2好：

- 一句话；
- 现实白话；
- 简明/研究模式；
- 原文折叠。

仍需：

- 完整“人话解释”必须读取新 elderFriendly，而不是继续显示旧 `plainExplanation`；
- copyText 当前仍主要复制旧详细解释，需要把：
  - 一句话
  - 现实白话“当前/为什么/怎么做/注意”
  放在复制结果最前面。

---

## 历史 `/history`

本地 IndexedDB，默认跨设备不共享。

建议：

- 明确显示“仅此设备/浏览器”；
- 导出 JSON 前说明“导出后文件由用户自己保管”。

---

## 知识 `/knowledge`

正确性层面正常。

性能层面是重灾区之一：

- 当前会触达完整知识对象；
- 应按卦展开动态加载。

---

## 设置 `/settings`

正常。

建议补：

```text
隐私与存储
八字日界流派
```

---

## 运势 `/fortune`

当前最需要修。

结论：

> 排盘骨架已完成，但解释引擎尚未完成；同时存在农历、顺逆、年月精度等正确性 bug。

---

# 39. 建议的 v4.4 开发顺序

不要先继续“补文案”。

顺序必须：

```text
Phase 0：正确性热修
  农历
  闰月
  顺逆
  年月精度
  日期校验
  lunar版本
  晚子时

Phase 1：运势分析结构
  DaYunAnalysis
  LiuNianAnalysis

Phase 2：十六变逐步真实解释
  stage + actual hexagram + transition

Phase 3：Source A 真正实现

Phase 4：保存本地档案

Phase 5：性能拆包

Phase 6：隐私 UI + 审计

Phase 7：真实浏览器 smoke
```

---

# 40. 必做浏览器示例矩阵

因为本次审计环境不能直接操作正式站，v4.4 必须由豆包 Work / 本机浏览器真实操作以下样例。

## Sample A：官方四柱 golden

```text
公历
2005-12-23
08:37
男
Asia/Shanghai
```

应：

```text
乙酉 戊子 辛巳 壬辰
```

并且：

```text
乙 = 阴年
男 = 阴男
大运方向 = 逆
```

不能再显示顺。

---

## Sample B：同一生日女性

```text
2005-12-23 08:37
女
```

应：

```text
阴女
大运方向 = 顺
```

---

## Sample C：农历 golden

6tail 官方测试有：

```ts
Lunar.fromYmdHms(2019,12,12,11,22,0)
```

对应 EightChar：

```text
己亥 丁丑 戊申 ...
```

用正式网页的“农历”输入后，必须和直接调用 Lunar 结果一致。

---

## Sample D：非法日期

```text
2025-02-31
```

必须：

```text
明确报错
```

不能白屏、空结果或 silent fail。

---

## Sample E：只有年月

```text
2024-02
```

必须明确：

```text
日期不足，节令月柱可能变化
```

不能偷偷使用2月1日并宣称是确定月柱。

---

## Sample F：23:30 出生

分别选择：

```text
00:00换日
23:00子初换日
```

必须得到可解释的日柱差异，并显示使用的规则。

---

## Sample G：农历闰月

选择一个已知闰月年份。

测试：

```text
普通月
闰月
```

必须能区分。

---

## Sample H：京房乾宫

C 手动选宫：

```text
乾
```

序列必须：

```text
乾
姤
遁
否
观
剥
晋
旅
鼎
大有
离
噬嗑
颐
益
无妄
同人
乾
```

每一步要显示自己独立的卦义解释。

---

## Sample I：身命卦 A

从本机历史选择一条。

必须：

```text
记录 -> 卦 -> 所属宫 -> 宫本卦 -> 十六变
```

全程来源可见。

---

## Sample J：隐私

设备 A 创建历史。

设备 B 打开相同网址：

```text
历史为空
```

除非 B 用户主动：

```text
导入 A 导出的 JSON
```

---

# 41. 网络资料

## 6tail / 八字

- lunar API  
  `https://6tail.cn/calendar/api.html`

- 农历实例化 / 闰月为负月份  
  `https://6tail.cn/calendar/lunar.new.html`

- Yun 顺逆与起运  
  `https://github.com/6tail/lunar-java/blob/master/src/main/java/com/nlf/calendar/eightchar/Yun.java`

- EightChar 晚子时 sect  
  `https://github.com/6tail/lunar-java/blob/master/src/main/java/com/nlf/calendar/EightChar.java`

## 浏览器本地存储

- IndexedDB  
  `https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB`

- Same-origin storage  
  `https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Same-origin_policy`

- Storage quotas  
  `https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria`

## 性能

- Vue Performance  
  `https://vuejs.org/guide/best-practices/performance`

- Workbox Precaching  
  `https://developer.chrome.com/docs/workbox/precaching-with-workbox`

---

# 42. 最终判断

当前 v4.3：

```text
问卦主功能：已经比较成熟
现实白话：方向正确
本地隐私：架构正确
运势：功能骨架完成，但还不能算“完成”
性能：v4.3 数据增加后确实有系统性优化空间
```

下一版本不应该继续增加更多术数。

> **v4.4 应定位成“运势正确性与解释完成 + 性能专项 + 本地隐私验收”。**

做完这一轮，再谈新的功能。
