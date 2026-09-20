# Oraculum v4.3 性能 Baseline

> 基准 commit：`24f8573e686baccd8b6f6986d9690627ed837bab`
> 测量日期：2026-09-20
> 命令：`npm run build`（vue-tsc --noEmit && vite build）
> Build 时间：4.98s
> 模块数：190 modules transformed

## Build 输出 — 全部 dist asset

### HTML / Manifest / SW
| 文件 | raw | gzip |
|------|-----|------|
| dist/index.html | 0.70 KB | 0.48 KB |
| dist/manifest.webmanifest | 0.46 KB | — |
| dist/registerSW.js | 0.13 KB | — |
| dist/sw.js | — | — |
| dist/workbox-9c191d2f.js | — | — |

### CSS
| 文件 | raw | gzip |
|------|-----|------|
| index-DVfmxesS.css | 2.24 KB | 0.91 KB |
| FortuneView-BnFbPipi.css | 7.17 KB | 1.64 KB |
| ResultView-B9W_xXfL.css | 2.17 KB | 0.62 KB |
| DivinationView-D2cpy03n.css | 1.66 KB | 0.61 KB |

### JS Chunks（按 raw 大小排序）
| 文件 | raw | gzip | 说明 |
|------|-----|------|------|
| index-Co4HAHKc.js | 291.63 KB | 100.79 KB | 主应用（Vue + Router + Pinia + Dexie + 引擎） |
| index-C80Ae4Nm.js | 206.98 KB | 133.53 KB | lunar-javascript（压缩率低，含大量中文） |
| index-DoRJC7F-.js | 205.81 KB | 74.81 KB | local-data（卦象释义 + 长辈友好 8 批 JSON） |
| DivinationView-CVIBCXS0.js | 34.57 KB | 13.98 KB | 问卦页路由 |
| index-DsJlRs-r.js | 35.23 KB | 14.49 KB | 共享 chunk |
| ResultView-C0cspOUD.js | 26.53 KB | 11.35 KB | 结果页路由 |
| hexagrams-nv_UFqja.js | 24.21 KB | 11.29 KB | 64卦基础数据 |
| FortuneView-D3JPApfr.js | 20.99 KB | 8.83 KB | 运势页路由 |
| KnowledgeView-CYI6No5I.js | 6.20 KB | 3.79 KB | 知识页路由 |
| HomeView-CMbJ8UqB.js | 2.88 KB | 1.73 KB | 首页路由 |
| SettingsView-CbDbeeQw.js | 2.67 KB | 1.46 KB | 设置页路由 |
| HistoryView-Dvr5elmY.js | 2.33 KB | 1.37 KB | 历史页路由 |
| transform-D5z95YCS.js | 2.57 KB | 1.63 KB | 京房十六变变换 |
| calendarEngine-ClHKrW0s.js | 2.27 KB | 1.16 KB | 日历引擎 |
| AboutView-be8G2-Gp.js | 0.83 KB | 0.84 KB | 关于页 |
| trigrams-CEvNIFwO.js | 1.25 KB | 0.72 KB | 八卦数据 |
| castByTime-ZBy__AAf.js | 1.19 KB | 0.70 KB | 梅花时间起卦 |
| solarTerms-C84RWRyK.js | 0.75 KB | 0.71 KB | 节气数据 |
| _plugin-vue_export-helper-DlAUqK2U.js | 0.09 KB | 0.10 KB | Vue 辅助 |

## PWA Precache
- **entries**: 34
- **total precache bytes**: 1137.52 KiB（约 1.11 MB）
- **globPatterns**: `**/*.{js,css,html,svg,png,ico,woff2}`（全部 JS chunk 都被 precache）

## 关键问题分析

1. **三个大 chunk 合计 ~704 KB raw / ~309 KB gzip**：
   - lunar-javascript 207 KB（gzip 133 KB，压缩率低因中文）
   - local-data 206 KB（gzip 75 KB，卦象+长辈数据静态 import）
   - 主应用 292 KB（gzip 101 KB）

2. **elderFriendly 8 份 JSON 不是真懒加载**：`src/local-data/index.ts` 静态 import 全部 8 份并在模块初始化时合并，运行时等于一次性加载。

3. **orchestrator 起卦时导入 plainInterpretation**：可能将 local-data 拉入起卦链路。

4. **FortuneView 一次计算 121 年流年**：`computeLiuNian(p, [0, 120])`，UI 只显示 0-30。

5. **JingFang16Card 一次渲染 17 段长文**：无折叠。

6. **PWA precache 1.11 MB**：全部 JS 包括重型数据 chunk 都在 precache。

## v4.4 优化目标（待优化后重新测量对比）

- elderFriendly 改为真实 dynamic import，按 kingWen 批次加载
- local-data 两层化（light 索引 + heavy 详情）
- ResultView / KnowledgeView 异步加载解读
- 流年按范围计算 + 分十年页渲染
- 评估 PWA precache 第二阶段优化
- 新增 `scripts/check-bundle-size.mjs` bundle budget
