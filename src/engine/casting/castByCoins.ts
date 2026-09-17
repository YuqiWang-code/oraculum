import { flipThreeCoins, secureRandomInt } from './secureRandom'

/**
 * 三枚钱六爻 liuyao_three_coins_v1（资料 v2 第6节，传统实践）
 * 正面=3 反面=2；和：6老阴(阴动) 7少阳(阳静) 8少阴(阴静) 9老阳(阳动)
 * 第一次=初爻（自下而上）。
 */
export interface CoinThrow {
  coins: [2 | 3, 2 | 3, 2 | 3]
  sum: 6 | 7 | 8 | 9
}

/** 虚拟摇六次 */
export function rollSixThrows(): CoinThrow[] {
  const out: CoinThrow[] = []
  for (let i = 0; i < 6; i++) out.push(flipThreeCoins())
  return out
}

/** 单次和 -> 阴阳动静 */
export function sumToLine(sum: 6 | 7 | 8 | 9): { yinYang: 0 | 1; moving: boolean } {
  switch (sum) {
    case 6: return { yinYang: 0, moving: true } // 老阴
    case 7: return { yinYang: 1, moving: false } // 少阳
    case 8: return { yinYang: 0, moving: false } // 少阴
    case 9: return { yinYang: 1, moving: true } // 老阳
  }
}

/** throws（初→上）-> lines(自下而上) 与 movingMask */
export function throwsToLines(throws: CoinThrow[]): { lines: (0 | 1)[]; movingMask: boolean[] } {
  const lines: (0 | 1)[] = []
  const movingMask: boolean[] = []
  for (const t of throws) {
    const { yinYang, moving } = sumToLine(t.sum)
    lines.push(yinYang)
    movingMask.push(moving)
  }
  return { lines, movingMask }
}

/** 从单个 throw 文案生成 explanation */
export function throwsExplanation(throws: CoinThrow[]): string {
  return throws
    .map((t, i) => `第${i + 1}次(爻${i + 1})：${t.coins.join('+')}=${t.sum}`)
    .join('；')
}

/** 手动模式：生成一次三枚钱（供 UI 虚拟摇） */
export function flipOnce(): CoinThrow {
  return flipThreeCoins()
}

/** 实体模式：用户直接录入 6/7/8/9 */
export function manualThrow(sum: number): CoinThrow {
  const s = sum as 6 | 7 | 8 | 9
  // 仅用于记录，硬币面值无法从和反推唯一，记为 [3,3,sum-6] 占位
  const a: 2 | 3 = 3
  const b: 2 | 3 = 3
  const c = (s - 6) as 2 | 3
  return { coins: [a, b, c], sum: s }
}

export { secureRandomInt }
