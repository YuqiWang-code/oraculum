# 京房十六变来源注释（JINGFANG_16_SOURCE_NOTES）

> 版本：v4.3.0
> 模块：`src/engine/fortune/jingfang16/`
> 关联文档：[FORTUNE_ENGINE.md](./FORTUNE_ENGINE.md)、[FORTUNE_RULE_CONFLICTS.md](./FORTUNE_RULE_CONFLICTS.md)

## 一、为什么要单独写来源注释

十六变不是单一出处的古法，而是**汉代京房八宫** + **后世《易隐》扩展**两层叠加。项目必须把这两层分开标注，不能把后世扩展全部写成"京房原法"。

## 二、京房八宫核心（《京氏易传》）

出自汉代京房《京氏易传》，是八宫卦变体系的基础。每个宫从本宫卦出发，按固定顺序变出 8 个卦：

| 阶段 | 变爻规则 | 现代中性说明 |
|---|---|---|
| 本宫 | 不变 | 起始基准卦，代表当前所立的根本结构 |
| 一世 | 初爻变 | 事物刚开始变化，底层因素开始松动 |
| 二世 | 二爻变 | 变化从底层向上延伸，开始影响实际层面 |
| 三世 | 三爻变 | 变化到达内外卦交界，是结构转型的关键节点 |
| 四世 | 四爻变 | 变化进入外层，外部环境开始明显转变 |
| 五世 | 五爻变 | 变化到达尊位，是整个变化过程中最显著的阶段 |
| 游魂 | 四爻再变（回到四爻位） | 变化到极点后开始游移不定，需要反思方向 |
| 归魂 | 三爻再变 | 变化后回归根本，事物开始向原有结构收敛 |

来源：

- ctext《京氏易传》：https://ctext.org/jingshi-yizhuan/zhs
- 维基文库《京氏易傳》：https://zh.wikisource.org/zh-hans/京氏易傳

## 三、《易隐》后世扩展

《易隐》是后世托名的卜筮书，在京房八宫 8 个阶段之后继续扩展出另外 8 个阶段。书中常托称"京房曰"，但**不应与汉代《京氏易传》完全等同**。

扩展的 8 个阶段：

| 阶段 | 现代中性说明 |
|---|---|
| 外戒 | 三爻变，提醒在外在行为上有所戒慎，不宜冒进 |
| 内戒 | 二爻变，提醒在内在心态和根基上有所反省，稳住立场 |
| 绝命 | **历史术语**，不表示现实死亡。指旧结构彻底结束、新结构尚未开始的过渡状态 |
| 血脉 | **历史术语**。指新结构开始有了生命力和延续性，如同血脉开始流通 |
| 肌肉 | **历史术语**。指新结构逐渐丰满、有了实际内容和力量 |
| 骸骨 | **历史术语**。指新结构的骨架已经定型，核心框架确立 |
| 棺椁 | **历史术语**，不表示现实死亡。指一个完整周期的收尾和封装阶段 |
| 冢墓 | **历史术语**，不表示现实死亡。指旧周期彻底沉淀、成为历史记忆的阶段 |

来源：

- ctext《易隐》相关章节：https://ctext.org/wiki.pl?chapter=629103&if=gb
- eee-learning《易隐》：https://www.eee-learning.com/book/5510

## 四、FortuneSourceLayer 来源层类型

```typescript
export type FortuneSourceLayer =
  | 'jingfang-eight-palace'     // 京房八宫核心
  | 'yiyin-sixteen-extension'   // 《易隐》后世扩展（十六变后8阶段）
  | 'yiyin-life-limit'          // 《易隐》身命三限
  | 'bazi-yun'                  // 八字大运/流年（lunar-javascript）
  | 'modern-analogy'            // 现代类比资料（如南怀瑾人生阶段类比）
  | 'oraculum-normalization'     // Oraculum 项目规范化
```

每个阶段、每条大运、每条流年都必须标注 `sourceLayer`。UI 上研究模式可按来源层筛选。

## 五、完整阶段表（0-16）

对应源码 `src/engine/fortune/jingfang16/stages.ts` 的 `SIXTEEN_STAGES`：

| index | 阶段名 | 来源层 | 现代中性说明 |
|---|---|---|---|
| 0 | 本宫 | jingfang-eight-palace | 起始基准卦，代表当前所立的根本结构 |
| 1 | 一世 | jingfang-eight-palace | 初爻变，事物刚开始变化，底层因素开始松动 |
| 2 | 二世 | jingfang-eight-palace | 二爻变，变化从底层向上延伸，开始影响实际层面 |
| 3 | 三世 | jingfang-eight-palace | 三爻变，变化到达内外卦交界，结构转型的关键节点 |
| 4 | 四世 | jingfang-eight-palace | 四爻变，变化进入外层，外部环境开始明显转变 |
| 5 | 五世 | jingfang-eight-palace | 五爻变，变化到达尊位，整个过程最显著的阶段 |
| 6 | 游魂 | jingfang-eight-palace | 四爻再变，变化到极点后开始游移不定，需要反思方向 |
| 7 | 外戒 | yiyin-sixteen-extension | 三爻变，提醒在外在行为上有所戒慎，不宜冒进 |
| 8 | 内戒 | yiyin-sixteen-extension | 二爻变，提醒在内在心态和根基上有所反省 |
| 9 | 归魂 | jingfang-eight-palace | 三爻再变，变化后回归根本，向原有结构收敛 |
| 10 | 绝命 | yiyin-sixteen-extension | **历史术语，不表示现实死亡**。旧结构彻底结束、新结构尚未开始的过渡状态 |
| 11 | 血脉 | yiyin-sixteen-extension | **历史术语**。新结构开始有了生命力和延续性 |
| 12 | 肌肉 | yiyin-sixteen-extension | **历史术语**。新结构逐渐丰满、有了实际内容和力量 |
| 13 | 骸骨 | yiyin-sixteen-extension | **历史术语**。新结构的骨架已经定型，核心框架确立 |
| 14 | 棺椁 | yiyin-sixteen-extension | **历史术语，不表示现实死亡**。一个完整周期的收尾和封装阶段 |
| 15 | 冢墓 | yiyin-sixteen-extension | **历史术语，不表示现实死亡**。旧周期彻底沉淀、成为历史记忆 |
| 16 | 还原 | oraculum-normalization | 回到初始本宫卦，十六变完整闭合，象征一个周期结束 |

## 六、翻爻序列 FLIP_SEQUENCE

```typescript
export const FLIP_SEQUENCE = [1,2,3,4,5,4,3,2,1,2,3,4,5,4,3,2] as const
```

（1 = 初爻，自下而上。16 次变化，最终回到本宫。）

序列读法：

1. 初爻 → 二爻 → 三爻 → 四爻 → 五爻（一世~五世）
2. 四爻再翻（游魂）
3. 三爻 → 二爻（外戒、内戒）
4. 三爻再翻（归魂）
5. 一爻 → 二爻 → 三爻 → 四爻 → 五爻 → 四爻 → 三爻 → 二爻（绝命~冢墓）
6. 总翻爻数 16，最后回到本宫卦（`returnsToBase === true`）。

## 七、乾宫 golden sequence

乾宫本宫为乾（☰☰），按 FLIP_SEQUENCE 翻爻，必须得到：

```
乾 姤 遁 否 观 剥 晋 旅 鼎 大有 离 噬嗑 颐 益 无妄 同人 乾
```

这是回归测试的**锚点**。任何对 FLIP_SEQUENCE 或 SIXTEEN_STAGES 的修改都必须先跑通这个序列，否则视为破坏。

## 八、历史术语保护

"绝命""棺椁""冢墓"是**历史术语**，**不表示现实死亡、疾病或寿命**。

源码常量：

```typescript
export const HISTORICAL_TERM_DISCLAIMER =
  '历史术语，不表示现实死亡、疾病或寿命。以上为传统结构研究中的象征性名称。'

export const HISTORICAL_TERMS = ['绝命', '棺椁', '冢墓']
```

UI 规则：

- 只要当前阶段名命中 `HISTORICAL_TERMS`，就在卡片下方显示 `HISTORICAL_TERM_DISCLAIMER`。
- 长辈友好模式下，这些阶段**不直接显示原名**，只显示 `modernNote`（如"旧结构彻底结束、新结构尚未开始的过渡状态"）。
- 研究模式下才显示原名 + disclaimers。

## 九、不把十六变机械按年龄平均

**禁止**把"本宫~冢墓"对应成 0-80 岁、每卦 5 年或 10 年。

源码常量：

```typescript
export const NO_AGE_MAPPING_NOTE =
  '十六变本身是结构研究层，不自动映射为"每卦5年/10年"或按年龄平均分配人生阶段。' +
  '南怀瑾等现代讲解中的人生阶段类比仅作为"现代类比资料"参考，不作为默认计算规则。'
```

原因：

- 京房原典里十六变是**卦变结构**，不是**人生时间表**。
- 后世有人（包括部分现代通俗讲解）把它对应到年龄，但流派不一、说法不一，没有统一标准。
- 项目不选边，只把它作为"结构研究层"展示，不输出"你 35 岁走到外戒"这类伪精确结论。

## 十、现代类比资料（modern-analogy）

南怀瑾等现代讲解中把十六变类比为人生阶段的说法，**只作为 `modern-analogy` 来源层资料**，不进入默认计算。

- UI 上研究模式可折叠展示"现代类比参考"卡片。
- 长辈友好模式不展示。
- 不写"南怀瑾说你多少岁如何如何"作为项目结论。

## 十一、整体来源说明

源码常量：

```typescript
export const SIXTEEN_TRANSFORM_SOURCE_NOTE =
  '京房八宫核心阶段（本宫、一世~五世、游魂、归魂）出自《京氏易传》；' +
  '外戒、内戒、绝命、血脉、肌肉、骸骨、棺椁、冢墓出自后世《易隐》扩展，' +
  '书中托称"京房曰"但不应与汉代原典完全等同。' +
  '"绝命、棺椁、冢墓"为历史术语，不表示现实死亡、疾病或寿命。'
```

这段说明在研究模式的"十六变"卡片顶部固定展示。

## 十二、参考资料链接汇总

| 来源 | URL |
|---|---|
| ctext《京氏易传》 | https://ctext.org/jingshi-yizhuan/zhs |
| 维基文库《京氏易傳》 | https://zh.wikisource.org/zh-hans/京氏易傳 |
| ctext《易隐》章节 | https://ctext.org/wiki.pl?chapter=629103&if=gb |
| eee-learning《易隐》 | https://www.eee-learning.com/book/5510 |
| 中国社会科学院哲学研究所（易学研究参考） | https://philosophy.cssn.cn/（站内检索"京氏易传""易隐"） |
