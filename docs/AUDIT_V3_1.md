# 审计报告 v3.1

## 审计日期
2026-09-18

## 当前版本
- APP_VERSION: 3.1.0
- RULESET_VERSION: 2.1.0
- DATASET_VERSION: 1.0.0

## 修复前发现的问题
1. server/index.ts 使用 ESM require.main === module，测试导入时自动占端口
2. timezone 只是装饰字段，没有真正参与 Solar.fromDate()
3. dayBoundaryRule 只有字符串 '00:00'/'23:00'，没有实际算法
4. 节气过滤掉了中气，currentSolarTerm 不完整
5. TimeSecondCaster manual mount 后固定不变
6. SixSourceWizard [2,2,2] 默认值导致未投币可完成
7. consistency 算法方向相反
8. AI schema 包含 traditionalScore/traditionalLabel，AI 可篡改本地评分
9. follow-up 重复发送问题
10. 缺少 Zod 校验
11. moderation 不检查 interpret 初始问题
12. 缺少 auth-check
13. 生产环境没有 token fail-closed
14. 六爻没有按类别选用神
15. 缺少基础冲合空破规则
16. DB 删除历史不级联删除 aiSessions
17. 版本号显示不一致

## 修复方式
全部按 P0→P1→P2 顺序修复，详见 docs/CHANGELOG.md。

## 验收项
- [x] npm run test: 72 用例全部通过
- [x] npm run validate: 数据校验通过
- [x] npm run build: 前端 + 服务端构建成功
- [x] npm start: 生产服务启动，/ 返回 200，/api/ai/health 返回 JSON
- [x] 旧历史兼容：dayBoundaryRule 旧字符串自动映射
- [x] AI 不改变本地评分

## 剩余 TODO
1. 64 卦卦辞/384 爻辞原文仍为空（needsVerify=true），待联网核对补录
2. 三枚钱法纯手动录入 UI 为二期
3. 完整旺衰（三合/回头生克/进神退神）为 v3.2
4. 分享长图、Capacitor 打 APK 为二期
5. Cookie session 替代 localStorage token 为二期
