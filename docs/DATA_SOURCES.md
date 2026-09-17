# 数据与来源

## 资料来源

- 核心规则与表格：`资料/传统术数资料库_智能推理与预测_v1.md`（2026-09-17 整理）。
- 历法/干支/节气：`lunar-javascript`（https://github.com/6tail/lunar-javascript ），开源许可见下。
- 八卦、六十四卦索引、八宫、世应、纳甲、六亲、六神、旬空、神煞：按资料库第 2、3、6、7、8 节录入。

## 经典原文核验状态

资料库**未逐字提供**六十四卦卦辞/爻辞。按用户要求，v1：

- 结构（序号、卦名、上下卦、八宫、世应、纳甲）已全部录入并测试锁定。
- `judgmentClassic` 与 `lineTextsClassic` **留空**，`needsVerify=true`，**未把任何回忆文本或现代解说冒充经典原文**。
- 待联网逐字核对的来源（A 级）：
  - 中国哲学书电子化计划《周易》：https://ctext.org/book-of-changes/zh
  - 维基文库《周易》：https://zh.wikisource.org/zh-hans/周易
  - 维基文库《梅花易数》《黄金策》

待核对清单：64 卦卦辞、384 爻辞、用九用六。补录后需把对应 `needsVerify` 置 false 并升 `DATASET_VERSION`。

## 第三方依赖许可

| 依赖 | 用途 | 许可 |
|---|---|---|
| Vue 3 | UI | MIT |
| Vite / @vitejs/plugin-vue | 构建 | MIT |
| Pinia | 状态 | MIT |
| Vue Router | 路由 | MIT |
| Vitest | 测试 | MIT |
| vite-plugin-pwa | PWA | MIT |
| Dexie | IndexedDB | Apache-2.0 |
| lunar-javascript | 历法 | MIT |

经典古籍《周易》《梅花易数》《黄金策》原文属公有领域；本应用未使用任何现代商业算命站的解说。
