# Oraculum v4 查漏补缺与免费上线调研

审查基准：`bd1aac4f3ddbf70269208fc115ada1c6a9203abe`

## 结论

项目已经适合进入“稳定化 + 上线”阶段，不建议再扩展大型功能。当前最值得做的是：

1. 修六爻规则里的几个真实逻辑 bug；
2. 修时区、路由、设置初始化；
3. 做移动端 UI 收尾；
4. 增加 Cloudflare Pages 静态托管兼容；
5. 免费上线给朋友使用。

## 关键逻辑问题

### 1. LineRole 五行方向写反

当前 `roles.ts` 对元神/忌神/仇神的判断方向错位。

如果 `generates(a,b)` 表示 a 生 b，则应是：

- 元神：`generates(lineElement, usefulElement)`
- 忌神：`controls(lineElement, usefulElement)`
- 仇神：`controls(usefulElement, lineElement)`

例如用神木：
- 元神水
- 忌神金
- 仇神土

### 2. `month_value/day_value` 把“同五行”误当成“临月/临日”

必须用地支完全相同判断“值”：

- `line.branch === monthBranch` -> month_value
- `line.branch === dayBranch` -> day_value

同五行但不同地支进入 `month_same_element/day_same_element`。

### 3. 冲合优先级错误

丑未、辰戌同为土但彼此相冲。当前代码先判断同五行，可能漏掉月破/日冲。

推荐优先级：

1. 支相同
2. 相冲
3. 六合
4. 同五行
5. 生
6. 克
7. neutral

### 4. 动爻可能被误判暗动

暗动只针对静爻。动爻日冲不能再标 `hidden_movement`。

### 5. `break_combine` 主流程不可达

`scoreLiuyao()` 目前把 `hasCombine` 固定传 `false`，需要先计算 combine 再传入 day clash。

### 6. 飞神月破语义写反

《增删卜易》明确飞神空、破、休囚时伏神反而较容易出现。当前“飞神月破 -> 伏神难出”需要修正。

同时 `hiddenGeneratedByDay` 已计算但未加入 evidence。

### 7. RatingBreakdown 类型不一致

`RatingBucket` 有 `sourceTaboo`，但 `RatingBreakdown` 没有。应统一类型和 UI label。

### 8. 世爻月建判断重复

`scoreLiuyao.ts` 有两个等价判断，而且把同五行写成“临月建”。应区分“值月建”和“同气”。

### 9. SanHe 字段存在伪实现

`containsSource/containsTaboo` 永远 false；要么真正计算，要么删除。

### 10. 时区实现仍有风险

`wallTimeInTimezone()` 将目标时区墙上时间重新包装成 `Date` 再交给 `Solar.fromDate()`，仍可能受设备本地时区影响。

`lunar-javascript` 支持 `Solar.fromYmdHms(...)`，更稳妥：

目标时区年月日时分秒 -> 直接 `Solar.fromYmdHms(...)`。

### 11. 首页日期与历法时区可能不一致

HomeView 的日期显示使用设备时区，而历法使用设置时区。日本手机 + Asia/Shanghai 设置时在跨日边界可能显示不一致。

### 12. ResultView 起卦时间也使用设备时区

显示时应显式使用 `rec.input.timezone`。

### 13. settings 初始化有竞态

App 在 `onMounted` 才 loadSettings，子页面 mounted 可能先执行。建议 app mount 前先 await `store.loadSettings()`。

### 14. HistoryView 路由错误

Router 使用 `createWebHistory()`，但 HistoryView 用：

`location.href = '#/result'`

应改成 `router.push(...)`。

### 15. Result 刷新会丢结果

结果只存 Pinia 内存。推荐改成 `/result/:id`，刷新时从 IndexedDB 按 id 恢复。

### 16. `npm run lint` fresh clone 可能失败

package 中有 lint script，但当前 devDependencies 没看到完整 ESLint 依赖/配置。应补齐。

### 17. `validate-data.ts` 没覆盖新版 local-data

应加入 64 彖传、64 大象、384 小象、64 modern meaning、sourceRefs 等校验。

### 18. 通用爻位解释错误

`lineMeanings.ts` 把所有二爻、五爻都说成“居中得正”。“居中”由位置决定，但“得正”要结合阴阳。

### 19. 梅花综合主题词过度泛化

当前很多动爻会被压成“取舍/顺势”。应给每一爻增加独立 `themeKeyword`。

### 20. 六爻解读重复算用神/元神/忌神

评分引擎与解释引擎各算一套，未来会漂移。应输出统一 `LiuYaoAnalysis`，评分与解读共用。

---

## UI 优化

- 不要默认“六源合参·实验”
- 起卦方式分组：传统/常用、现代数字化、实验
- 重新暴露 `meihua_time_v1` 为“梅花年月日时”
- ResultView 把“综合解读”提前
- 经典原文默认折叠，白话和本次角色默认展开
- 顶部评分不要用 `float:right`
- 六爻高级状态放 `<details>`
- 首页增加“安装到手机”
- 增加“分享应用”按钮
- 增加独立 maskable icon
- 移动端按钮最小 44px，增加 `:focus-visible`

---

## 最简单免费上线：Cloudflare Pages

当前项目是纯静态 Vite PWA，非常适合 Cloudflare Pages。

推荐设置：

- Production branch：`main`
- Build command：`npm run build`
- Output directory：`dist`
- 不需要环境变量

部署成功后获得：

`https://项目名.pages.dev`

以后每次 push main 自动部署。

Cloudflare Free 当前：
- 每月 500 次 Pages builds
- 静态资源请求免费且不限量
- 免费 HTTPS
- 可后绑自定义域名

### 必须新增 SPA fallback

因为当前 Vue Router 是 `createWebHistory()`，增加：

`public/_redirects`

内容：

```text
/* /index.html 200
```

否则直接打开 `/history`、`/knowledge`、`/result/:id` 可能 404。

---

## 为什么不优先 GitHub Pages

当前仓库会部署到：

`https://YuqiWang-code.github.io/oraculum/`

这是子路径，需要 Vite `base='/oraculum/'`，PWA manifest 和 router 也要同步处理。

Cloudflare Pages 用根路径，当前项目改动更少，所以更简单。

---

## 不正式上线、临时跨网络给朋友用

使用 Cloudflare Quick Tunnel：

```bash
npm run build
npm run preview
```

另一个终端：

```bash
cloudflared tunnel --url http://localhost:4173
```

会得到：

`https://xxxx.trycloudflare.com`

朋友在不同网络也能打开。

限制：
- 你的电脑必须开着
- preview 和 cloudflared 不能停
- URL 每次可能变化
- 官方定位是测试/开发，不适合长期正式使用

所以：
- 临时试用：Quick Tunnel
- 长期给朋友使用：Cloudflare Pages
