# 规则说明 RULES

Oraculum 所有起卦、历法、评分规则版本化，每条历史记录保存 `ruleVersion` + `datasetVersion`，未来升级算法不影响旧结果展示。

## 版本
- APP_VERSION: 3.1.0
- RULESET_VERSION: 2.1.0
- DATASET_VERSION: 1.0.0

## 历法规则

### 时区
- 默认 Asia/Shanghai（中国标准时间）
- UTC 也支持
- 时区真正参与计算：`wallTimeInTimezone()` 用 Intl.DateTimeFormat 反推墙上时间，再传给 lunar-javascript

### 日界规则
- `midnight`（默认）：00:00 换日，现代公历
- `zi_hour`：23:00 起子初换日，传统说法
- 影响：dayGanzhi / dayStem / dayBranch / xunKong / 六神 / 神煞 / 所有依赖日柱的计算

### 节气与月建
- `currentSolarTerm`：完整 24 节气（含中气）
- `monthBoundaryJie`：仅 12 个节令换月（立春/惊蛰/清明/立夏/芒种/小暑/立秋/白露/寒露/立冬/大雪/小寒）
- 月建按节令切换，不按农历初一

### 旬空
- 由日柱干支查六旬
- 甲子旬空戌亥，甲戌旬空申酉，甲申旬空午未，甲午旬空辰巳，甲辰旬空寅卯，甲寅旬空子丑

## 梅花易数起卦规则

### meihua_time_v1（旧法保留）
- A = 年支数 + 农历月数 + 农历日数
- B = A + 时支数
- 上卦 = mod8(A)，下卦 = mod8(B)，动爻 = mod6(B)
- 0 余 → 8/6

### meihua_time_second_v2（现代扩展）
- A = 年支数 + 农历月数 + 农历日数
- B = A + 时支数
- P = minute * 60 + second
- 上卦 = mod8(A)，下卦 = mod8(B + P)，动爻 = mod6(B + P)
- 秒级部分为本项目现代扩展，不冒充古籍原始年月日时算法

### meihua_random_numbers_v1
- 上卦 = mod8(N1)，下卦 = mod8(N2)，动爻 = mod6(N1+N2+N3)
- 使用 crypto.getRandomValues() rejection sampling

### meihua_dice_v1
- d8×2 + d6×1，直接映射八卦先天数

### meihua_text_count_v1
- 归一化（NFKC + 去空白标点），grapheme 计数 11-100
- 偶数上下各半，奇数上 floor 下 ceil

### meihua_external_omen_v1
- 外应对应卦 + 方位对应卦，动爻 = mod6(上卦先天数 + 下卦先天数 + 时支数)

## 六爻规则

### 三枚钱 liuyao_three_coins_v1
- 正面=3，反面=2
- 6=老阴动，7=少阳静，8=少阴静，9=老阳动

### 八宫 / 世应 / 纳甲 / 六亲 / 六神
- 由数据表驱动，见 src/data/

### 用神选择（v3.1）
- 按问题类别从 CATEGORY_USEFUL_GOD 选首要用神
- 类别：事业/考试/合作/财务/感情/家庭/出行/失物/选择/计划/综合/其他

### 基础关系（v3.1）
- 六冲、六合、旬空、月破：纯函数 + 独立 evidence

## 评分规则

### 梅花评分 scoreMeihua
- 体用生克、互卦变卦、动爻、神煞低权重
- score = clamp(0,100, 50 + Σdelta)

### 六爻评分 scoreLiuyao
- 用神月日生克、世爻基础、冲合空破、动变趋势、卦象主题、神煞低权重
- v3.1 加入用神选择和基础关系

### consistency（v3.1 修正）
- positiveWeight = Σ(delta > 0 ? delta : 0)
- negativeWeight = Σ(delta < 0 ? abs(delta) : 0)
- totalWeight = positiveWeight + negativeWeight
- consistency = abs(positiveWeight - negativeWeight) / totalWeight
- 全正/全负 = 1，正负平衡 ≈ 0

### 五档
- 0-19 大凶 / 20-39 凶 / 40-59 平 / 60-79 吉 / 80-100 大吉

## 六源合参（实验）

### six_source_hybrid_v1
- 本项目自定义现代实验模式，不是古籍原法
- 六个起卦点（秒级时间/随机数/摇骰/外应/文字/铜钱）
- FNV-1a stable hash 生成 canonical string
- 上卦=mod8(H1)，下卦=mod8(H2)，动爻=mod6(H3)
