# Oraculum v4.3：长辈友好现实解读 + 京房十六卦变 / 运势模块联合调研

> 仓库：`https://github.com/YuqiWang-code/oraculum`
>
> 当前 main：`997121fdaf692c142097e5ccd5922af07630cd34`
>
> 当前版本：APP 4.2.0 / RULESET 4.1.0 / DATASET 3.0.0 / LOCAL_KNOWLEDGE 1.1.0
>
> 正式站：`https://oraculum-3g8.pages.dev`

本文合并两项调研：

1. 如何把现有卦辞、彖传、象传、动爻、互卦、变卦进一步变成“完全没有《易经》基础的老人也能马上看懂”的现实白话。
2. “运势”栏目如何引入八字大运流年、京房八宫、后世《易隐》“十六变卦”和身命三限，同时避免把不同体系混成一套“伪古法”。

---

## 一、v4.2.0 目前真正的问题

当前 ResultView 已有“一句话看懂”，方向正确；但详细层仍存在三类问题：

- “白话”大量还是“古文改成简体 + 稍微顺句”，普通人仍看不懂；
- “综合解读”仍偏术语拼接，如“大蓄德行—舆说輹—出嫁归宿—文饰修饰”；
- “现实行动提示”能懂，但过于通用，没有把本卦、动爻、互卦、变卦、体用真正翻译成“为什么”和“怎么做”。

因此 v4.3 不应只继续加一句话，而应新增一个醒目的：

> **现实白话解读**

推荐信息层级：

```text
本次所问
↓
一句话看懂
↓
现实白话解读
  ① 现在是什么情况
  ② 为什么这么看
  ③ 接下来怎么做
  ④ 最需要注意什么
↓
卦象
↓
传统详细解读
↓
评分 / 经典证据 / 起卦依据
```

---

## 二、现实白话解读的数据结构

建议：

```ts
export interface RealWorldPlainReading {
  headline: string
  currentSituation: string
  why: {
    base: string
    moving: string[]
    mutual?: string
    changed?: string
    bodyUse?: string
    rating?: string
  }
  howToAct: string[]
  watchOutFor: string[]
  timeline?: {
    now: string
    turningPoint?: string
    middle?: string
    later?: string
  }
  realityGuard?: string
  disclaimer: string
}
```

三层职责要分开：

```text
PlainInterpretation.oneLiner
= 第一眼一句话

RealWorldPlainReading
= 完整现实白话

LocalDetailedInterpretation
= 传统研究层
```

---

## 三、“这份工作该不该接”应达到的效果

假设：

```text
本卦：大畜
二爻动
互卦：归妹
变卦：贲
评分：48 · 平
体生用：自身付出较多
```

推荐现实白话不是“卦义复述”，而是：

### 一句话

```text
这份工作可以认真考虑，但不适合因为表面条件不错就马上答应；先把薪资、职责、成长空间和实际工作强度问清楚，再决定更稳妥。
```

### 现在怎么看

```text
这件事不是明显的“必须接”，也不是“完全不能接”，更像是目前信息还没有完全核实，先看清条件再决定。
```

### 为什么

```text
大畜：
有积累、储备、把能力做厚的意味。放到工作问题里，这份机会可能有学习和长期积累价值，但不能只看眼前。

二爻：
像车子暂时停下来。现实上更适合解释成“先停一下，把关键条件核实完”，而不是冲动接受。

归妹：
重点不是字面“嫁人”，而是关系和位置是否合适。放到工作里，就是岗位、团队、领导、职责边界到底匹不匹配。

贲：
有呈现、包装、外在美化的意味。后面可能越看越吸引人，但要区分“包装得好”和“实际真的好”。

体生用：
你为这件事可能需要投入较多时间、精力和适应成本，所以不仅问“能不能做”，还要问“值不值得投入”。
```

### 怎么做

```text
1. 问清薪资、绩效和试用期。
2. 对照招聘文案与实际职责。
3. 问清直属领导、团队规模、加班和成长空间。
4. 关键条件仍模糊时，不要因为对方催促就当天决定。
5. 条件核实后，如果投入成本能接受、长期确实有积累价值，再考虑接。
```

### 注意

```text
最需要防的是“岗位包装得很好，但实际职责、成本或发展空间没有想象中好”。

卦象只作为传统文化的思路整理；是否接受工作仍应以合同、薪资、职责、团队和个人目标为准。
```

---

## 四、本卦 / 动爻 / 互卦 / 变卦也要真正“说人话”

每张卡建议改成：

```text
【人话解释】
这段古文放到现代生活里，大概在说什么。

【放到你这个问题里】
结合用户刚问的问题，它具体提醒什么。

【查看《周易》原文】
折叠
```

例如“归妹”：

```text
人话解释：
核心不是让你理解古代婚嫁，而是在提醒“关系和位置是否合适”。事情可以发生，但如果双方位置、条件或期待不匹配，后面容易出现问题。

放到这份工作里：
中间阶段最需要确认的是“你和这个岗位到底匹不匹配”。职位名称看起来合适，不代表实际职责、团队和发展方向真的适合你。
```

---

## 五、长辈友好 UI

建议：

- “现实白话解读”默认展开；
- 正文字号 18–20px；
- headline 20–22px；
- 行高 1.75–1.9；
- 高对比，不使用 `muted` 作为核心文字；
- 每段一个意思，避免连续术语；
- “为什么 / 怎么做 / 注意什么”明显分区；
- 经典原文默认折叠；
- 点击目标至少约 44px；
- 设置加入：
  - 简明模式（默认）
  - 研究模式

---

# 六、需要“蒸馏模型权重”吗？

## 结论：正式版不需要，也不建议

最适合 Oraculum 的不是运行时模型，而是：

```text
开发期：
强模型生成候选白话
→ Schema 校验
→ 人工/规则复核
→ 固化成本地 JSON

运行期：
纯查表 + 确定性组合
```

可以把它理解为“文本/知识蒸馏”，但不是神经网络权重蒸馏。

---

## 七、Hugging Face 上有哪些可参考模型？

### Qwen2.5-0.5B-Instruct

官方：
`https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct`

约 0.49B 参数，支持中文等多语言，Apache-2.0。

原始 safetensors 约 988MB。

Transformers.js / ONNX：
`https://huggingface.co/onnx-community/Qwen2.5-0.5B-Instruct`

其中常见文件约：

```text
q4f16 ≈ 483MB
quantized ≈ 512MB
q4 ≈ 786MB
```

### DeepSeek-R1-Distill-Qwen-1.5B

`https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B`

这是真正的蒸馏模型，但 fp 权重约 3.55GB，更不适合当前手机 PWA。

### SmolLM2-360M-Instruct

`https://huggingface.co/HuggingFaceTB/SmolLM2-360M-Instruct`

模型更小，但模型卡主要标注英语，不是中文传统文化解释的首选。

### Tianwen 社区项目

`https://huggingface.co/spaces/liuyd-dev/tianwen`

其发布资料显示：
- MiniCPM5-1B；
- LoRA；
- 58 条 teacher 蒸馏样本；
- F16 GGUF 约 2.1GB；
- Q4_K_M 约 700MB；
- 确定性排盘、模型只做叙述。

这个思路值得参考，但不代表传统资料权威，也不适合旧 iPhone 默认运行。

---

## 八、为什么旧 iPhone 更不适合浏览器 LLM

Transformers.js：
`https://huggingface.co/docs/transformers.js/en/index`

WebGPU：
`https://huggingface.co/docs/transformers.js/guides/webgpu`

官方明确说明 Safari 的 WebGPU 支持取决于版本，主要是较新的 Safari / iOS。

因此：

```text
旧 iPhone
+ 483MB~700MB 模型
+ 可能没有可用 WebGPU
```

会带来：

- 首次下载巨大；
- PWA 缓存占用巨大；
- 内存压力；
- CPU 推理慢；
- 稳定性下降。

所以正式版不要加权重。

---

## 九、推荐“开发期文本蒸馏”字段

卦级：

```ts
interface ElderFriendlyHexagramMeaning {
  elderFriendlySummary: string
  realLifeNow: string
  realLifeProcess: string
  realLifeLater: string
  commonMisunderstanding?: string
}
```

爻级：

```ts
interface ElderFriendlyLineMeaning {
  elderFriendlyMeaning: string
  realLifeAction: string
  realLifeCaution?: string
}
```

所有现代释义要检查：

```text
不得用“一定、必然、百分百、命中注定”
不得编造现实事件
不得把健康/法律/财务问题说成确定结论
不得把“凶”直接翻译成现实灾难
不得把历史术语“绝命/棺椁”等解释成现实死亡
```

---

# 十、第二项：京房体系必须先分清文本层级

中国社科院哲学所对京房易学的研究指出，京房体系核心包括：

```text
八宫
飞伏
纳甲
纳支
阴阳五行
```

资料：
`https://philosophy.ac.cn/kygz/xszm/zgzx/202401/t20240110_5726928.html`

《京氏易传》：
`https://ctext.org/jingshi-yizhuan/zhs`
`https://zh.wikisource.org/zh-hans/京氏易傳`

八宫每宫核心结构：

```text
本宫
一世
二世
三世
四世
五世
游魂
归魂
```

例如乾宫：

```text
乾 → 姤 → 遁 → 否 → 观 → 剥 → 晋（游魂）→ 大有（归魂）
```

---

# 十一、“京房十六变卦”是后世扩展层

今天常见的：

```text
外戒
内戒
绝命
血脉
肌肉
骸骨
棺椁
冢墓
```

完整形态见于后世《易隐》，书中托称“京房曰”。不应和汉代《京氏易传》的八宫核心完全等同。

来源梳理：
`https://www.eee-learning.com/book/5510`

《易隐》：
`https://ctext.org/wiki.pl?chapter=629103&if=gb`

建议规则来源层：

```ts
type FortuneSourceLayer =
  | 'jingfang-eight-palace'
  | 'yiyin-sixteen-extension'
  | 'yiyin-life-limit'
  | 'bazi-yun'
  | 'modern-analogy'
  | 'oraculum-normalization'
```

---

# 十二、《易隐》十六变的结构

乾宫示例：

```text
乾
→ 姤
→ 遁
→ 否
→ 观
→ 剥
→ 晋（游魂）
→ 旅（外戒）
→ 鼎（内戒）
→ 大有（归魂）
→ 离（绝命）
→ 噬嗑（血脉）
→ 颐（肌肉）
→ 益（骸骨）
→ 无妄（棺椁）
→ 同人（冢墓）
→ 乾（还原）
```

通用翻爻序列（1=初爻）：

```ts
[1,2,3,4,5,4,3,2,1,2,3,4,5,4,3,2]
```

“十六变”是 16 次变化；含初始和最终还原时看到 17 个状态。

---

# 十三、关键结论：十六变本身不是“出生日期 → 每年运势”的完整算法

目前可靠资料并不支持：

```text
出生年月日
→ 自动得到京房十六变本命卦
→ 每一变固定对应某年龄
→ 得到逐年吉凶
```

南怀瑾等现代讲解会用十六变类比人生几十岁阶段：
`https://quanxue.cn/ct_nanhuaijin/yijing/yijing21.html`

但这属于解释性类比，不应伪装成统一古法。

---

# 十四、《易隐》另有更直接的人生限运方法

《易隐·身命占》使用：

```text
世爻
身爻
本命爻
流年太岁
大限
小限
```

卷二明确有：

```text
正卦管30年
变卦管30年
互卦管30年
每爻5年
合计约90年
```

来源：
`https://ctext.org/wiki.pl?chapter=74595&if=gb`

所以如果要做“六爻体系的人生阶段”，《易隐》身命三限比“把十六变平均分年龄”更有直接文本依据。

不过具体起限、顺逆、特殊卦处理复杂，且后世版本有争议，必须单独记录来源和冲突。

---

# 十五、八字和京房/易隐要分开

用户想要：

```text
出生资料
→ 八字
→ 运势
→ 京房十六变
```

产品可以放在一个“运势”页，但算法层要分开：

```text
A. 八字 / 大运 / 流年
B. 京房八宫 / 《易隐》十六变
C. 《易隐》身命三限（研究模式）
```

不能包装成“唯一京房出生算法”。

---

# 十六、lunar-javascript 已能做八字基础

Oraculum 已依赖 `lunar-javascript`。

官方：
`https://github.com/6tail/lunar-javascript`

支持：
- 八字
- 五行
- 十神
- 节气
- 纳音

官方测试已有：

```ts
Solar.fromYmdHms(...)
  .getLunar()
  .getEightChar()

eightChar.getYun(gender)
yun.getDaYun()
daYun.getLiuNian()
```

同源实现明确：
- `gender=1` 男
- `gender=0` 女

---

# 十七、输入精度必须诚实

完整八字需要：

```text
年柱 + 月柱 + 日柱 + 时柱
```

因此建议：

```ts
type BirthPrecision =
  | 'year_month'
  | 'date'
  | 'exact_time'
```

- 只有年月：显示“年月二柱”，不能叫完整八字；
- 有年月日无时辰：显示“三柱 / 时柱未知”，不得偷偷假设 00:00；
- 完整年月日时：才做完整四柱、大运和精确起运。

---

# 十八、“从出生到死”不要作为算法目标

产品建议改成：

```text
人生阶段 0–100岁
```

可选 80 / 90 / 100 / 120 岁。

不要：
- 推算死亡年龄；
- 输出某年会死亡；
- 输出某年必得重病；
- 把“绝命、棺椁、冢墓”直接解释为现实死亡。

这些名称只作为“历史术语”展开查看，并注明：

```text
历史术语，不表示现实死亡、疾病或寿命。
```

---

# 十九、“运势”栏目推荐结构

底部导航：

```text
首页 | 问卦 | 运势 | 历史 | 知识 | 设置
```

新增 `/fortune`。

页面：

```text
出生资料
↓
八字概览
↓
大运时间轴
↓
逐年流年
↓
京房八宫 / 《易隐》十六变（研究）
↓
《易隐》身命三限（可选研究）
```

---

# 二十、本命卦来源必须明确

不要从八字偷偷“映射出京房本命卦”。

建议三种来源：

### A. 身命卦起卦
用现有三枚钱 / 骰子 / 时间，专门起“身命卦”，再看所属八宫。

### B. 出生时刻起卦
使用当前 `meihua_time_v1`，但必须写：

```text
Oraculum 项目规范 / 实验
不是《京氏易传》明确记载的出生本命卦算法
```

### C. 手动选择宫卦
供研究使用。

---

# 二十一、十六变引擎

建议目录：

```text
src/engine/fortune/jingfang16/
├─ types.ts
├─ transform.ts
├─ stages.ts
├─ sourceNotes.ts
└─ index.ts
```

阶段：

```text
0 本宫
1 一世
2 二世
3 三世
4 四世
5 五世
6 游魂
7 外戒
8 内戒
9 归魂
10 绝命
11 血脉
12 肌肉
13 骸骨
14 棺椁
15 冢墓
16 还原
```

乾宫必须生成：

```text
乾 姤 遁 否 观 剥 晋 旅 鼎 大有 离 噬嗑 颐 益 无妄 同人 乾
```

八个宫都要测试最终还原。

---

# 二十二、年度“运势”主要来自八字流年层

推荐分工：

```text
每一年：
八字大运 / 流年

较长象征阶段：
京房八宫 / 《易隐》十六变

身命限运：
《易隐》三限研究模式
```

不要合成一个来源不明的“总命运分”。

v1 也不要做“83分好运”“升职概率72%”之类伪精确数字。

---

# 二十三、隐私

出生日期、时间等只在本地使用。

默认：

```text
本次计算，不保存
```

用户主动选择：

```text
保存本地档案
```

才写 IndexedDB。

不上传 Cloudflare，不增加账号系统。

---

# 二十四、版本建议

```text
APP_VERSION = 4.3.0
RULESET_VERSION = 4.1.0
DATASET_VERSION = 3.0.0
LOCAL_KNOWLEDGE_VERSION = 1.2.0

FORTUNE_RULESET_VERSION = 1.0.0
FORTUNE_DATASET_VERSION = 1.0.0
```

运势规则独立版本化。

---

# 二十五、最终路线

## 现实白话

```text
开发期 teacher 模型生成候选
→ 校审
→ 静态 JSON
→ 运行期确定性本地组合
```

正式 PWA 不放模型权重。

## 运势

```text
出生资料
→ lunar-javascript 八字 / 大运 / 流年

独立身命卦来源
→ 京房八宫
→ 《易隐》十六变

可选：
→ 《易隐》身命三限
```

所有体系分别标来源、分别版本化。

---

# 主要资料

### 本地模型与蒸馏
- Qwen2.5-0.5B-Instruct  
  https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct
- Qwen ONNX / Transformers.js  
  https://huggingface.co/onnx-community/Qwen2.5-0.5B-Instruct
- DeepSeek-R1-Distill-Qwen-1.5B  
  https://huggingface.co/deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B
- Transformers.js  
  https://huggingface.co/docs/transformers.js/en/index
- WebGPU  
  https://huggingface.co/docs/transformers.js/guides/webgpu
- Tianwen  
  https://huggingface.co/spaces/liuyd-dev/tianwen

### 京房 / 易隐
- 中国社科院哲学所：京房易学的阴阳五行说  
  https://philosophy.ac.cn/kygz/xszm/zgzx/202401/t20240110_5726928.html
- 《京氏易传》  
  https://ctext.org/jingshi-yizhuan/zhs
- 维基文库《京氏易传》  
  https://zh.wikisource.org/zh-hans/京氏易傳
- 十六变来源梳理  
  https://www.eee-learning.com/book/5510
- 《易隐》卷一  
  https://ctext.org/wiki.pl?chapter=629103&if=gb
- 《易隐》卷二 / 身命三限  
  https://ctext.org/wiki.pl?chapter=74595&if=gb
- 人生阶段现代类比  
  https://quanxue.cn/ct_nanhuaijin/yijing/yijing21.html

### 八字程序
- lunar-javascript  
  https://github.com/6tail/lunar-javascript
- API  
  https://6tail.cn/calendar/api.html

---

# 最终结论

**模型方面：**不需要训练或下载蒸馏权重。最适合的是“开发期模型辅助生成 + 静态数据固化”，正式 PWA 继续保持轻量、离线、旧手机兼容。

**运势方面：**可以做，但必须把八字大运流年、京房八宫、《易隐》十六变、《易隐》身命三限分层实现，不能混成“京房出生算法”。

**人生长度方面：**产品采用“0–100岁传统结构参考”，不做死亡年龄、疾病年份或寿命预测。
