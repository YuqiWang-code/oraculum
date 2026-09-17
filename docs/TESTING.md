# 测试

运行：

```bash
npm run test
```

## 覆盖范围

| 测试 | 文件 |
|---|---|
| 8 卦编码、先天数、三爻往返 | tests/hexagram/trigrams.test.ts |
| 64 卦唯一性、上下卦映射 | tests/hexagram/hexagrams.test.ts |
| 动爻变卦（乾初动→姤） | tests/hexagram/hexagrams.test.ts |
| 互卦取爻 | tests/hexagram/hexagrams.test.ts |
| 八宫归属（大有归乾宫归魂等） | tests/liuyao/liuyao.test.ts |
| 世应（本宫世6应3、一世世1应4） | tests/liuyao/liuyao.test.ts |
| 纳甲（乾内子寅辰、坎内寅辰午） | tests/liuyao/liuyao.test.ts |
| 六亲五行关系 | tests/liuyao/liuyao.test.ts |
| 六神按日干（甲乙青龙、庚辛白虎） | tests/liuyao/liuyao.test.ts |
| 旬空（甲子旬空戌亥等） | tests/liuyao/liuyao.test.ts |
| 梅花时间起卦固定样例与确定性 | tests/meihua/meihua.test.ts |
| 评分边界（clamp、五档、50+Σdelta） | tests/meihua/meihua.test.ts |

## 数据校验

```bash
npm run validate
```

校验 64 卦结构、编码唯一、宫/世应/爻辞数组长度。

## 当前结果

- Vitest：**38 个用例全部通过**。
- 同输入同 ruleVersion 结果确定性由 `meihua.test.ts` 锁定。
