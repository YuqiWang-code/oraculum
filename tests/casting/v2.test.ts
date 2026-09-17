import { describe, it, expect } from 'vitest'
import { buildCalendarContext } from '../../src/engine/calendar/calendarEngine'
import { castBySecondTime } from '../../src/engine/casting/castBySecondTime'
import { castMeihuaByTime } from '../../src/engine/meihua/castByTime'
import { secureRandomInt } from '../../src/engine/casting/secureRandom'
import { castByRandomNumbers } from '../../src/engine/casting/castByRandomNumbers'
import { castByDice } from '../../src/engine/casting/castByDice'
import { castByText, normalizeText, countGraphemes } from '../../src/engine/casting/castByText'
import { castByOmen, COLOR_TO_TRIGRAM, SYMBOL_TO_TRIGRAM, DIRECTION_TO_TRIGRAM } from '../../src/engine/casting/castByExternalOmen'
import { sumToLine, throwsToLines, rollSixThrows } from '../../src/engine/casting/castByCoins'
import { canonicalize, deriveHashes, castBySixSources } from '../../src/engine/casting/castBySixSources'
import { formatDateTimeLocalSeconds, parseLocalDateTime } from '../../src/utils/datetime'
import type { SixSourcePayload } from '../../src/types'

describe('秒级时间 v2', () => {
  const cal = buildCalendarContext({ date: new Date(2026, 8, 17, 21, 39, 27), timezone: 'Asia/Shanghai' })
  it('minute/second 正确', () => {
    const r = castBySecondTime(cal, new Date(2026, 8, 17, 21, 39, 27))
    expect(r.minute).toBe(39)
    expect(r.second).toBe(27)
    expect(r.secondOfHour).toBe(39 * 60 + 27)
  })
  it('秒确实参与算法：差1秒结果不同', () => {
    const a = castBySecondTime(cal, new Date(2026, 8, 17, 21, 39, 27))
    const b = castBySecondTime(cal, new Date(2026, 8, 17, 21, 39, 28))
    // P 差 1，下卦或动爻可能变化
    expect(JSON.stringify(a.evidence.normalized)).not.toBe(JSON.stringify(b.evidence.normalized))
  })
  it('同一精确时间结果可复现', () => {
    const a = castBySecondTime(cal, new Date(2026, 8, 17, 21, 39, 27))
    const b = castBySecondTime(cal, new Date(2026, 8, 17, 21, 39, 27))
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })
  it('59秒->下一分钟边界', () => {
    const a = castBySecondTime(cal, new Date(2026, 8, 17, 21, 39, 59))
    const b = castBySecondTime(cal, new Date(2026, 8, 17, 21, 40, 0))
    expect(a.secondOfHour).toBe(39 * 60 + 59)
    expect(b.secondOfHour).toBe(40 * 60 + 0)
  })
})

describe('旧 v1 固定样例不变', () => {
  it('castMeihuaByTime 仍可用且确定性', () => {
    const cal = buildCalendarContext({ date: new Date(2026, 8, 17, 12), timezone: 'Asia/Shanghai' })
    const a = castMeihuaByTime(cal)
    const b = castMeihuaByTime(cal)
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })
})

describe('datetime 工具', () => {
  it('format 含秒', () => {
    expect(formatDateTimeLocalSeconds(new Date(2026, 8, 17, 21, 39, 27))).toBe('2026-09-17T21:39:27')
  })
  it('parse 往返无时区偏移', () => {
    const d = parseLocalDateTime('2026-09-17T21:39:27')
    expect(d.getHours()).toBe(21)
    expect(d.getSeconds()).toBe(27)
    expect(formatDateTimeLocalSeconds(d)).toBe('2026-09-17T21:39:27')
  })
})

describe('secureRandom', () => {
  it('1..N 范围', () => {
    for (let i = 0; i < 200; i++) {
      const v = secureRandomInt(1, 9999)
      expect(v).toBeGreaterThanOrEqual(1)
      expect(v).toBeLessThanOrEqual(9999)
    }
  })
})

describe('随机数起卦', () => {
  it('mock 数字可复现', () => {
    const a = castByRandomNumbers([1386, 7421, 519])
    const b = castByRandomNumbers([1386, 7421, 519])
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })
})

describe('骰子', () => {
  it('边界 1/1/1 与 8/8/6', () => {
    const a = castByDice(1, 1, 1)
    expect(a.upperTrigram).toBe('乾')
    expect(a.lowerTrigram).toBe('乾')
    expect(a.movingLine).toBe(1)
    const b = castByDice(8, 8, 6)
    expect(b.upperTrigram).toBe('坤')
    expect(b.lowerTrigram).toBe('坤')
    expect(b.movingLine).toBe(6)
  })
})

describe('文字起卦', () => {
  it('11字', () => {
    const r = castByText('一二三四五六七八九十甲')
    expect(r.graphemeCount).toBe(11)
    expect(r.upperCount).toBe(5)
    expect(r.lowerCount).toBe(6)
  })
  it('12字偶数平分', () => {
    const r = castByText('一二三四五六七八九十甲乙')
    expect(r.graphemeCount).toBe(12)
    expect(r.upperCount).toBe(6)
    expect(r.lowerCount).toBe(6)
  })
  it('去空白标点', () => {
    expect(normalizeText('你好，世界！ ')).toBe('你好世界')
    expect(countGraphemes(normalizeText('你好，世界！'))).toBe(4)
  })
})

describe('外应', () => {
  const cal = buildCalendarContext({ date: new Date(2026, 8, 17, 12), timezone: 'Asia/Shanghai' })
  it('5组颜色映射', () => {
    expect(COLOR_TO_TRIGRAM['青']).toBe('震')
    expect(COLOR_TO_TRIGRAM['红']).toBe('离')
    expect(COLOR_TO_TRIGRAM['黄']).toBe('坤')
    expect(COLOR_TO_TRIGRAM['白']).toBe('兑')
    expect(COLOR_TO_TRIGRAM['黑']).toBe('坎')
  })
  it('8八象全覆盖', () => {
    expect(Object.keys(SYMBOL_TO_TRIGRAM).length).toBe(8)
  })
  it('8方位全覆盖', () => {
    expect(Object.keys(DIRECTION_TO_TRIGRAM).length).toBe(8)
  })
  it('合成', () => {
    const r = castByOmen({ kind: 'color', value: '黑', direction: '北' }, cal)
    expect(r.upperTrigram).toBe('坎')
    expect(r.lowerTrigram).toBe('坎')
  })
})

describe('三枚钱', () => {
  it('6/7/8/9 映射', () => {
    expect(sumToLine(6)).toEqual({ yinYang: 0, moving: true })
    expect(sumToLine(7)).toEqual({ yinYang: 1, moving: false })
    expect(sumToLine(8)).toEqual({ yinYang: 0, moving: false })
    expect(sumToLine(9)).toEqual({ yinYang: 1, moving: true })
  })
  it('六次顺序自下而上', () => {
    const throws = [{ coins: [3, 3, 3] as [2 | 3, 2 | 3, 2 | 3], sum: 9 as const }]
    const { lines, movingMask } = throwsToLines(throws)
    expect(lines[0]).toBe(1)
    expect(movingMask[0]).toBe(true)
  })
  it('多动爻', () => {
    const throws = [
      { coins: [3, 3, 3] as [2 | 3, 2 | 3, 2 | 3], sum: 9 as const },
      { coins: [2, 2, 2] as [2 | 3, 2 | 3, 2 | 3], sum: 6 as const }
    ]
    const { movingMask } = throwsToLines(throws)
    expect(movingMask).toEqual([true, true])
  })
  it('rollSixThrows 长度6', () => {
    expect(rollSixThrows().length).toBe(6)
  })
})

describe('六源合参', () => {
  const p: SixSourcePayload = {
    version: 'six_source_hybrid_v1',
    exactTime: '2026-09-17T21:39:27',
    secondOfHour: 2367,
    randomNumber: 7351,
    dice: { d8: 6, d6: 4 },
    omen: { kind: 'symbol', value: '水', trigramNumber: 6 },
    text: { normalized: '这是一段测试文字内容', graphemeCount: 10 },
    coin: { coins: [2, 3, 2], sum: 7 }
  }
  it('完全确定性', () => {
    const a = castBySixSources(p)
    const b = castBySixSources(p)
    expect(a.h1).toBe(b.h1)
    expect(a.upperTrigram).toBe(b.upperTrigram)
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })
  it('单字段变化 canonical 不同', () => {
    const c1 = canonicalize(p)
    const p2 = { ...p, randomNumber: 1 }
    const c2 = canonicalize(p2)
    expect(c1).not.toBe(c2)
    const a = castBySixSources(p)
    const b = castBySixSources(p2)
    expect(a.h1).not.toBe(b.h1)
  })
  it('deriveHashes 三值不同', () => {
    const { h1, h2, h3 } = deriveHashes(canonicalize(p))
    expect(h1).not.toBe(h2)
    expect(h2).not.toBe(h3)
  })
})
