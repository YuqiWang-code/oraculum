# 经典文本来源

## 主要来源

| 来源 | URL | 用途 |
|---|---|---|
| 维基文库《周易》 | https://zh.wikisource.org/wiki/周易 | 卦辞、爻辞、彖传、大象传、小象传 |
| 中国哲学书电子化计划 CText | https://ctext.org/book-of-changes/ | 交叉核对 |

## 收录内容

| 文本类型 | 数量 | 来源 |
|---|---|---|
| 卦辞 | 64 条 | 维基文库《周易》各卦页面 |
| 爻辞 | 384 条 | 维基文库《周易》各卦页面 |
| 用九 / 用六 | 2 条 | 乾卦 / 坤卦页面 |
| 彖传 | 64 条 | 维基文库《周易》各卦页面 |
| 大象传 | 64 条 | 维基文库《周易》各卦页面 |
| 小象传 | 384 条 | 维基文库《周易》各卦页面 |

## 每卦来源 URL

每卦的来源 URL 记录在 `src/local-data/classics/sources.ts` 的 `SOURCE_REFS` 表中，格式为：

```typescript
export const SOURCE_REFS: Record<number, string[]> = {
  1: ['https://zh.wikisource.org/wiki/周易/乾'],
  2: ['https://zh.wikisource.org/wiki/周易/坤'],
  // ... 共 64 条
  64: ['https://zh.wikisource.org/wiki/周易/未濟']
}
```

## 版权说明

- 维基文库《周易》文本属于**公共领域**（PD-old），原作者已去世逾 70 年。
- 中国哲学书电子化计划（CText）提供的古籍原文同样属于公共领域。
- 本项目未使用任何现代商业算命网站的文本。
- 本项目未使用任何 AI 生成的经典原文。
- 现代释义（`interpretation/` 目录）为 Oraculum 原创内容，不属于古籍原文。

## 核验原则

1. 所有古籍原文均从维基文库逐字核对，不凭记忆填写。
2. 关键文本经 CText 交叉验证。
3. 每条数据均记录 `sourceRefs`，可追溯。
4. 未核验的文本标记为 `needsVerify`，不冒充已确认原文。
