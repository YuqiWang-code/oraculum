# 测试说明 TESTING

Oraculum 使用 Vitest，72 个测试用例全部通过。

## 测试覆盖

### 八卦编码（4 用例）
- 8 卦二进制编码正确
- 先天数映射
- 五行属性

### 64 卦（7 用例）
- 64 卦唯一性
- 上下卦组合映射
- King Wen 序号
- 卦符 Unicode

### 六爻（16 用例）
- 八宫归属
- 世应位置
- 纳甲地支
- 六亲关系
- 六神按日干
- 旬空
- 伏神定位

### 梅花（11 用例）
- meihua_time_v1 固定样例
- 互卦计算
- 变卦计算
- 体用五行
- 确定性（同输入同版本结果相同）

### v2 起卦（24 用例）
- meihua_time_second_v2 秒参与算法
- secureRandomInt 范围
- d8/d6 边界
- coin 6/7/8/9 映射
- text 字数计算
- 颜色/八象/方位映射
- six-source 确定性
- canonical string 单字段变化

### AI 安全（10 用例）
- .env 被 gitignore
- 前端源码不含 OPENAI_API_KEY
- 前端源码不含 api.openai.com
- health 不泄漏 key
- AI schema 可验证
- AI 输出不含 traditionalScore/traditionalLabel
- .env.example 只有占位符

## 运行
```
npm run test       # 72 用例
npm run validate   # 静态数据校验
npm run build      # 类型检查 + 前端构建 + 服务端构建
npm start          # 生产服务启动
```
