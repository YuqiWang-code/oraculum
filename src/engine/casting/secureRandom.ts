/**
 * 安全随机数：使用 Web Crypto，rejection sampling 消除 modulo bias。
 * 禁止用 Math.random() 做起卦随机值。
 */

function getCrypto(): Crypto {
  if (typeof globalThis !== 'undefined' && (globalThis as { crypto?: Crypto }).crypto) {
    return (globalThis as { crypto: Crypto }).crypto
  }
  throw new Error('当前环境不支持 crypto.getRandomValues')
}

/**
 * 返回 [min, max] 闭区间均匀整数。
 */
export function secureRandomInt(min: number, max: number): number {
  const range = max - min + 1
  const limit = Math.floor(0x100000000 / range) * range
  const buf = new Uint32Array(1)
  const c = getCrypto()
  while (true) {
    c.getRandomValues(buf)
    const x = buf[0]
    if (x < limit) return min + (x % range)
  }
}

/** d6 = 1..6 */
export function rollD6(): number {
  return secureRandomInt(1, 6)
}

/** d8 = 1..8 */
export function rollD8(): number {
  return secureRandomInt(1, 8)
}

/** 一个硬币 bit：0=反(2), 1=正(3) */
export function coinBit(): 0 | 1 {
  return secureRandomInt(0, 1) as 0 | 1
}

/** 三个硬币：返回面值数组（2 或 3）与和（6/7/8/9） */
export function flipThreeCoins(): { coins: [2 | 3, 2 | 3, 2 | 3]; sum: 6 | 7 | 8 | 9 } {
  const coins = [coinBit() === 1 ? 3 : 2, coinBit() === 1 ? 3 : 2, coinBit() === 1 ? 3 : 2] as [2 | 3, 2 | 3, 2 | 3]
  const sum = coins[0] + coins[1] + coins[2]
  return { coins, sum: sum as 6 | 7 | 8 | 9 }
}
