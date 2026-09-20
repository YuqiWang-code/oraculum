# 本地语言数据蒸馏（LOCAL_LANGUAGE_DATA_DISTILLATION）

> 版本：v4.3.0
> 方案：**开发期语言能力生成候选 → Schema 校验 → 规则复核 → 固化为静态 JSON**
> 关联文档：[LOCAL_MODEL_RESEARCH.md](./LOCAL_MODEL_RESEARCH.md)、[ELDER_FRIENDLY_INTERPRETATION.md](./ELDER_FRIENDLY_INTERPRETATION.md)、[LOCAL_KNOWLEDGE_DATA.md](./LOCAL_KNOWLEDGE_DATA.md)

## 一、为什么不用运行时模型

完整论证见 [LOCAL_MODEL_RESEARCH.md](./LOCAL_MODEL_RESEARCH.md)，结论一句话：

> Oraculum 的核心是**确定性排盘 + 结构化解读**。卦辞、爻辞、小象、评分结果都是**已知的结构化数据**，不需要运行时大模型来"生成"解读，只需要把已有结构翻译成现代语言。开发期用语言能力生成候选 → 校验 → 固化为静态 JSON，运行期纯查表。

禁止引入（详见 LOCAL_MODEL_RESEARCH 第四节）：

- `@huggingface/transformers` / WebLLM / `onnxruntime-web`（用于模型推理）
- 任何模型权重文件（.gguf / .onnx / .safetensors / .bin）
- 任何 server 端 AI 推理、任何外部 AI API、任何云端推理服务

## 二、方案总览

```
开发期（一次性，离线）：
  输入：爻辞 + 小象 + 现有 coreMeaning（来自 hexagramMeanings*.json）
    ↓
  语言能力生成候选现代释义
    ↓
  Schema 校验（字段齐全、字数范围）
    ↓
  禁词检查（FORBIDDEN_WORDS，见 wordingGuard.ts）
    ↓
  规则复核（不编造现实事件、不输出确定命运）
    ↓
  固化为静态 JSON：elderFriendly_XX_YY.json

运行期（每次起卦）：
  纯查表 + 确定性模板组合
  无网络请求、无模型推理、无随机性
```

开发期语言能力**不是运行时依赖**——它只在写数据阶段被人使用，产物只是 JSON 文件。发布包里不包含任何提示词、模型或推理代码。

## 三、数据生成流程（逐卦）

对每一个卦、每一个爻：

1. **读源数据**
   - 卦级：`classic.judgment` / `classic.tuan` / `classic.daXiang` / `localMeaning.coreMeaning` / `localMeaning.cautions`
   - 爻级：`lines[i].classicText` / `lines[i].xiaoXiang` / `lines[i].coreMeaning` / `lines[i].cautionMeaning`

2. **生成候选**（按字段逐个写，不是一次写一大段）：
   - 卦级：`elderFriendlySummary` / `realLifeNow` / `realLifeProcess` / `realLifeLater` / `commonMisunderstanding`
   - 爻级：`elderFriendlyMeaning` / `realLifeAction` / `realLifeCaution`

3. **字数检查**（硬指标，见第五节）。

4. **禁词检查**：跑 `guardWording`（见 [ELDER_FRIENDLY_INTERPRETATION.md](./ELDER_FRIENDLY_INTERPRETATION.md) 第七节）。命中即重写。

5. **规则复核**：
   - 不能编造现实事件（不写"你下周会遇到某人"）
   - 不能输出确定命运（不写"一定成""必发"）
   - 不能把历史术语当现实术语（"绝命""棺椁"不出现在长辈释义里）
   - 必须综合小象，不逐字翻译爻辞

6. **写入 JSON**。

## 四、64 卦 + 384 爻数据结构

```
src/local-data/interpretation/
├─ elderFriendly_01_08.json     # 周文王序 1-8
├─ elderFriendly_09_16.json     # 9-16
├─ elderFriendly_17_24.json     # 17-24
├─ elderFriendly_25_32.json     # 25-32
├─ elderFriendly_33_40.json     # 33-40
├─ elderFriendly_41_48.json     # 41-48
├─ elderFriendly_49_56.json     # 49-56
└─ elderFriendly_57_64.json     # 57-64
```

每个文件顶层是 `Record<string, ElderFriendlyHexagram>`，key 是周文王序（字符串 `"1"` 到 `"64"`）。

```typescript
interface ElderFriendlyHexagram {
  elderFriendlySummary: string
  realLifeNow: string
  realLifeProcess: string
  realLifeLater: string
  commonMisunderstanding: string
  lines: [
    ElderFriendlyLine,   // 初爻
    ElderFriendlyLine,   // 二爻
    ElderFriendlyLine,   // 三爻
    ElderFriendlyLine,   // 四爻
    ElderFriendlyLine,   // 五爻
    ElderFriendlyLine    // 上爻
  ]
}

interface ElderFriendlyLine {
  elderFriendlyMeaning: string
  realLifeAction: string
  realLifeCaution: string
}
```

数据规模：64 卦 × 5 卦级字段 + 384 爻 × 3 爻级字段 = 320 + 1152 = **1472 条**现代释义。

## 五、数据分批策略：8 批 × 8 卦

按周文王序连续 8 个卦一批，共 8 批：

| 批次 | 卦序 | 覆盖卦 |
|---|---|---|
| 1 | 01-08 | 乾 坤 屯 蒙 需 讼 师 比 |
| 2 | 09-16 | 小畜 履 泰 否 同人 大有 谦 豫 |
| 3 | 17-24 | 随 蛊 临 观 噬嗑 贲 剥 复 |
| 4 | 25-32 | 无妄 大畜 颐 大过 坎 离 咸 恒 |
| 5 | 33-40 | 遁 大壮 晋 明夷 家人 睽 蹇 解 |
| 6 | 41-48 | 损 益 夬 姤 萃 升 困 井 |
| 7 | 49-56 | 革 鼎 震 艮 渐 归妹 丰 旅 |
| 8 | 57-64 | 巽 兑 涣 节 中孚 小过 既济 未济 |

分批好处：

- 每批文件 ~20-30KB，`JSON.parse` 不卡（大 JSON 不走 tsx import，见 `scripts/validate-data.ts` 注释）。
- 可以逐批校验、逐批回归，不阻塞发布。
- 每批内部风格容易统一。

## 六、质量标准

### 字数（硬指标，validate 脚本强制）

| 字段 | 字数范围（汉字） |
|---|---|
| 卦级 `elderFriendlySummary` | 60-120 |
| 卦级 `realLifeNow` / `realLifeProcess` / `realLifeLater` | 40-100 |
| 卦级 `commonMisunderstanding` | 20-60 |
| 爻级 `elderFriendlyMeaning` | 40-90 |
| 爻级 `realLifeAction` | 20-60 |
| 爻级 `realLifeCaution` | 20-60 |

字数统计按 UTF-8 汉字字符数，不含标点和空白。

### 综合小象，不逐字翻译

- **不**把爻辞逐句转简体当成"白话"（v4.2 的 `plainText` 问题，见 [LOCAL_INTERPRETATION_REVIEW.md](./LOCAL_INTERPRETATION_REVIEW.md)）。
- **必须**吸收《小象传》给出的"因 / 所以"。
  - 正确示例（遁六二）："小象说'固志也'，不是被绑住逃不掉，而是你自己选择坚守。"
  - 错误示例："用黄牛皮绳绑住，无法解脱。"（只取爻辞字面，丢了小象）

### 文风

- 第二人称"你"，不用"当事人/求测者"。
- 像家里长辈跟你说话，不用书面语。
- 不出现卦名解释（不写"'遁'就是退避的意思"——直接写"该退就退"）。
- 不出现术语（不写"得位""乘承比应""世爻"）。

## 七、特殊规则

### 遁卦六二（lines[1]）

- 方向：维持"固志"——**主动坚守**，不是"被束缚解不开"。
- `elderFriendlyMeaning` 必须出现"固志"或"立场稳"。
- 禁止出现"被困、逃不掉、无法解脱"作为主基调。
- 此爻同时是 PlainInterpretation 黄金样例的动爻（见 [PLAIN_INTERPRETATION_ENGINE.md](./PLAIN_INTERPRETATION_ENGINE.md)），两层文案必须一致方向。

### 归妹卦（kingWen=54）

- 不字面化"嫁人"。
- 现代白话写成"把自己交出去、进入一段关系/合作"——覆盖婚姻、合伙、入职、签约等场景。
- 不写"这卦问你什么时候出嫁"。

### 其他通用规则

- 乾卦不写"你是龙"。写"你现在有股刚劲的劲头"。
- 坤卦不写"大地"。写"你现在适合跟着走、托住事"。
- 任何"龙"的比喻都要翻译成"人身上的劲 / 时机 / 状态"，不保留龙。
- "君子"翻译成"有分寸的人"或直接省略。

## 八、运行期行为

运行期**只做三件事**：

1. `getHexagramElderFriendly(kingWen)`：从 JSON 里按序号查表。
2. 按 [ELDER_FRIENDLY_INTERPRETATION.md](./ELDER_FRIENDLY_INTERPRETATION.md) 第四节的组合规则，把卦级 + 动爻 + 互卦 + 变卦 + 体用 + Rating + QuestionCategory 拼成 `RealWorldPlainReading`。
3. 跑一次 `guardWording`，命中则降级。

**不做**：

- 不 `fetch` 远程文本
- 不调用 LLM
- 不 `Math.random`
- 不动态生成句子结构（所有句子来自 JSON 或确定性模板）

保证：同输入 + 同 FORTUNE_DATASET_VERSION / elderFriendly 数据版本 → 同输出。

## 九、校验与回归

- `npm run validate`：跑 `scripts/validate-data.ts`，校验所有 `elderFriendly_*.json`：
  - 64 个 key 齐全
  - 每个卦 5 个卦级字段非空
  - 每卦 6 个爻，每爻 3 个字段非空
  - 字数在第六节范围内
  - `guardWording` 通过
- 黄金样例回归（见 [ELDER_FRIENDLY_INTERPRETATION.md](./ELDER_FRIENDLY_INTERPRETATION.md) 第八节）。
- 同输入两次 `JSON.stringify` 必须相等（确定性）。
