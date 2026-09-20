# Oraculum v4.4 审计复核报告

> 基准 commit：`24f8573e686baccd8b6f6986d9690627ed837bab`
> 审计文档：`资料/Oraculum_v4.3_完整审计_运势修复_性能优化_本地隐私.md`
> 复核日期：2026-09-20
> 实际安装 lunar-javascript：`1.7.7`（package.json 声明 `^1.6.13`，lock 锁定 1.7.7）

---

## 审计问题逐项核实

### §2 P0：公历/农历切换未接入核心计算 — **成立**

- `src/engine/fortune/bazi/index.ts`：`computeBaziOverview`（L32-127）、`computeDaYun`（L134-172）、`computeLiuNian`（L179-227）全部直接使用 `Solar.fromYmd` / `Solar.fromYmdHms`，完全忽略 `profile.calendarType`。
- `src/components/fortune/JingFang16Card.vue` L142-151：Source B 单独写了农历转公历（`Lunar.fromYmd` → `getSolar()`），与八字模块使用不同日期。
- **结论**：农历输入被当作公历日期处理，是实际 bug。

### §3 P0：大运顺逆逻辑错误 — **成立**

- `src/engine/fortune/bazi/index.ts` L95：`const direction: '顺' | '逆' = genderCode === 1 ? '顺' : '逆'`
- 同文件 L147：`computeDaYun` 中同样的错误逻辑。
- 底层 `ec.getYun(genderCode)` 内部按阴阳男女计算，但 UI 方向又按单纯性别重写，导致计算层与显示层矛盾。
- **结论**：男=顺、女=逆是错的；正确规则为阳男阴女=顺，阴男阳女=逆。

### §4 示例验证 — **成立**

- 2005-12-23 08:37 年柱乙酉，乙为阴干。
- 当前代码：男→顺（错），女→逆（错）。
- 正确：男（阴男）→逆，女（阴女）→顺。

### §5 P0：year_month 用1号伪造月柱 — **成立**

- `src/engine/fortune/bazi/index.ts` L38：`const solar = Solar.fromYmd(year, month, 1)`
- 注释明确写"用年月日中的日=1来获取年月柱"。
- 同月节令前年柱/月柱可能不同，2月涉及立春。
- **结论**：用1号代替未知生日是伪精确。

### §6 P0：农历无闰月 UI — **成立**

- `src/components/fortune/BirthInputCard.vue`：农历只有年/月/日数字输入，无"普通月/闰月"选择。
- `BirthProfile` 类型（`src/engine/fortune/types.ts` L14-28）无 `lunarLeapMonth` 字段。
- **结论**：农历闰月无法表达。

### §7 P0：日期无真实校验 + silent failure — **成立**

- `BirthInputCard.vue` L43：day 输入仅 `min="1" max="31"`，不校验真实日期。
- `src/views/FortuneView.vue` L65-69：`catch { overview.value = null }` — silent failure，用户看不到错误原因。
- 同文件 L76-79：daYun/liuNian 也用 silent catch。
- **结论**：2025-02-31 可通过表单，底层异常被吞掉。

### §8 P0：保存本地档案未实际保存 — **成立**

- `src/db/index.ts` L106-110：`saveFortuneProfile()` 已实现。
- `src/views/FortuneView.vue` L63-84：`onCompute()` 中完全没有调用 `saveFortuneProfile()`。
- `BirthInputCard.vue` L86-90：checkbox 存在但只 emit profile，profile.saveLocally 未被消费。
- **结论**：checkbox 是纯 UI，实际不保存。

### §9 P1：顺逆 UI 暗示吉凶 — **成立**

- `src/components/fortune/BaziOverviewCard.vue` L42：`:class="overview.qiYun.direction === '顺' ? 'label-good' : 'label-bad'"`
- `src/components/fortune/DaYunTimeline.vue` L26：`:class="e.direction === '顺' ? 'shun' : 'ni'"`
- 同文件 CSS L105-106：`.dot.shun { background: var(--good); } .dot.ni { background: var(--bad); }`
- **结论**：顺=绿色好、逆=红色坏，是概念错误。

### §10 P1：起运信息过度简化 — **成立**

- `src/engine/fortune/types.ts` L94-98：`qiYun` 只有 `startAge`、`startDate`、`direction`。
- `bazi/index.ts` L93-94：只读 `getStartYear()` 和 `getStartSolar()`，未读 `getStartMonth/getStartDay/getStartHour`。
- **结论**：8年0月20天只显示"8岁"。

### §11 P1：DaYunEntry.startDate 半实现 — **成立**

- `src/engine/fortune/types.ts` L67：`startDate?: string`
- `DaYunTimeline.vue` L37：`v-if="expandedEntry.startDate"` 尝试显示
- `bazi/index.ts` L161-168：`computeDaYun` push 时未赋值 `startDate`
- **结论**：UI 看起来支持，数据根本没有。

### §12 P1：lunar-javascript 版本不真实 — **成立**

- `package.json` L19：`"lunar-javascript": "^1.6.13"`
- `npm ls lunar-javascript` 实际输出：`lunar-javascript@1.7.7`
- `bazi/index.ts` L233-235：`getLunarVersion()` 返回 `'^1.6.13'`
- **结论**：依赖声明、实际安装、代码报告三者不一致。

### §13 P1：晚子时日界未打通 — **成立**

- `src/db/index.ts` L128：`dayBoundaryRule: 'midnight'` 默认设置存在。
- `bazi/index.ts`：完全没有调用 `ec.setSect()`，也没有读取 dayBoundaryRule。
- `BaziOverview` 类型无 `daySect` / `dayBoundaryLabel` 字段。
- **结论**：23:00-23:59 出生者日柱日界与全局设置不一致。

### §14 P1：时区字段语义不清 — **部分成立**

- `BirthProfile.timezone` 存在，但八字计算直接使用用户填写的年月日时，不做时区转换。
- `BirthInputCard.vue` L74-83：label 仅为"时区"，无说明。
- **结论**：用户可能误以为切换时区会自动校正出生时刻。

### §15 P1：五行统计实现可疑 — **成立**

- `bazi/index.ts` L105-112：`const wuxing = ec.getWuXing()` 后强制 `as Record<string, number>`，外包 try/catch 静默吞错。
- 6tail EightChar 标准 API 主要为 `getYearWuXing()/getMonthWuXing()/getDayWuXing()/getTimeWuXing()`，无标准 `getWuXing()` 返回计数 Record。
- **结论**：五行统计可能根本不工作，且失败时静默。

### §16 流年只有排年表无分析 — **成立**

- `bazi/index.ts` L214-220：`computeLiuNian` 只填 year/age/daYunGanzhi/liuNianGanzhi/sourceLayer。
- `LiuNianList.vue` L35：`{{ e.plainReading ?? neutralReading(e) }}` — 永远走 fallback。
- **结论**：流年列表只是排年表。

### §17 大运只有时间轴无解释 — **成立**

- `DaYunTimeline.vue` L33-41：展开详情只有干支/年龄/顺逆/起运公历（未赋值）。
- 无十神、无地支关系、无 focus/why/howToAct/watchOut。
- **结论**：用户看到干支不知道什么意思。

### §18 十六变解释是阶段固定模板 — **成立**

- `JingFang16Card.vue` L70：`{{ s.stage.modernNote }}` — 只由 stage index 决定。
- 不管乾宫一世=姤还是坤宫一世=复，"一世"解释几乎相同。
- 无 transition（上一卦→当前卦）、无 flippedLine 显示、无当前卦 elderFriendly。
- **结论**：17个节点解释没有差异化。

### §19 归魂翻爻文字错误 — **成立**

- `src/engine/fortune/jingfang16/types.ts` L8：`FLIP_SEQUENCE = [1,2,3,4,5,4,3,2,1,2,3,4,5,4,3,2]`
- 第9次变化（index 8）= 1（初爻），对应 stage index 9 = 归魂。
- `src/engine/fortune/jingfang16/stages.ts` L72：归魂 modernNote = "三爻再变"
- **结论**：应为"初爻再变"，当前是错的。

### §20 Source A 未实现 — **成立**

- `JingFang16Card.vue` L165-166：Source A 分支仅 `result.value = null`。
- L15：UI 文字告诉用户"请到问卦页起卦，再回 C 手动选宫"。
- **结论**：A 不是实际功能。

### §21 Source B 不显示中间来源链 — **成立**

- `JingFang16Card.vue` L138-163：Source B 计算后直接 `runFromBase(lines)`，只显示基准卦名。
- L47-55：source-note 区只显示 `result.baseName`，不显示出生时刻起得的卦、所属宫、十六变基准的链路。
- **结论**：用户看不到"出生时刻起得XX卦→所属XX宫→基准XX宫纯卦"的过程。

### §25 历史记录跨设备不共享 — **成立（架构正确）**

- `src/db/index.ts`：Dexie/IndexedDB，数据库名 `smart-divination`。
- 无 Firebase/Supabase/Cloudflare D1/KV/后端 API/账号登录/云同步。
- **结论**：架构正确，需在 UI 明确说明。

### §28 性能：elderFriendly 静态 import — **成立**

- `src/local-data/index.ts` L29-36：8份 elderFriendly JSON 全部静态 import。
- L64-67：模块初始化时 `Object.assign(ALL_ELDER, batch)` 合并全部。
- **结论**：拆成8份但运行时仍等于一次性全部加载。

### §30 结果页静态 import 重解释 — **需进一步核实**

- 需读取 `src/views/ResultView.vue` 和 `src/engine/orchestrator.ts` 确认。
- 审计文档称 ResultView 静态 import localInterpretation/plainInterpretation/realWorldInterpretation。

### §31 orchestrator 提前加载完整文字库 — **需进一步核实**

- 需读取 `src/engine/orchestrator.ts` 确认起卦时是否调用 interpretMeihuaPlain/interpretLiuyaoPlain。

### §32 KnowledgeView 首屏加载全部64卦 — **需进一步核实**

- 需读取 `src/views/KnowledgeView.vue` 确认。

### §33 流年 0-120 一次全部计算 — **成立**

- `src/views/FortuneView.vue` L75：`computeLiuNian(p, [0, 120])`
- 无论 UI 只显示 0-30，都先算 121 年。
- **结论**：对老手机不必要。

### §34 十六变一次展开17段长文 — **成立**

- `JingFang16Card.vue` L58-75：所有 step 直接渲染，无折叠/展开机制。
- 每个 step 都显示 modernNote 全文。
- **结论**：DOM 和长文本一次性全部渲染。

### §35 PWA precache 全部 JS — **成立**

- `vite.config.ts` L31：`globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}']`
- build 后全部 JS chunk 都匹配 precache。
- **结论**：precache 包含所有 chunk。

### §36 Vue 大型数据深响应式 — **需进一步核实**

- FortuneView L51-53：`overview`/`daYun`/`liuNian` 用 `ref`（深响应式）。
- daYun/liuNian 大数组可考虑 shallowRef。

### §38 页面级审查 — **部分核实**

- 运势页：确认最需修（正确性 bug + 解释引擎缺失）。
- 问卦/结果/知识/历史/设置页：需进一步读取确认性能问题。

---

## 总结

| 类别 | 已核实成立 | 需进一步核实 | 不成立 |
|------|-----------|-------------|--------|
| P0 正确性 | 9项（§2,3,5,6,7,8 + 示例§4） | 0 | 0 |
| P1 正确性/完整性 | 7项（§9,10,11,12,13,15 + §14部分） | 0 | 0 |
| 运势解释缺失 | 3项（§16,17,18） | 0 | 0 |
| 十六变问题 | 3项（§19,20,21） | 0 | 0 |
| 性能问题 | 4项（§28,33,34,35） | 3项（§30,31,32） | 0 |
| 隐私架构 | 1项正确（§25） | 0 | 0 |

**所有 P0 问题均已在当前代码中确认成立。** v4.4 必须先修正确性，再补解释，再做性能。
