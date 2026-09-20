/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent
  export default component
}

declare module 'lunar-javascript' {
  /** 八字（EightChar）——仅声明引擎用到的方法 */
  export class EightChar {
    setSect(sect: number): void
    getSect(): number
    getYearGan(): string
    getYearZhi(): string
    getMonthGan(): string
    getMonthZhi(): string
    getDayGan(): string
    getDayZhi(): string
    getTimeGan(): string
    getTimeZhi(): string
    getYun(gender: number, sect?: number): Yun
    getYearNaYin(): string
    getMonthNaYin(): string
    getDayNaYin(): string
    getTimeNaYin(): string
  }
  /** 流年（LunarYear 的流年项） */
  export class LiuNian {
    getYear(): number
    getAge(): number
    getGanZhi(): string
  }
  /** 大运（LunarYear 的大运项） */
  export class DaYun {
    getGanZhi(): string
    getStartAge(): number
    getEndAge(): number
    getIndex(): number
    getLiuNian(n?: number): LiuNian[]
  }
  /** 起运（Yun） */
  export class Yun {
    getStartYear(): number
    getStartMonth(): number
    getStartDay(): number
    getStartHour(): number
    getStartSolar(): Solar
    isForward(): boolean
    getDaYun(n?: number): DaYun[]
  }
  /** 农历年（用于闰月查询） */
  export class LunarYear {
    static fromYear(year: number): LunarYear
    getLeapMonth(): number
  }
  export class Lunar {
    static fromYmd(year: number, month: number, day: number): Lunar
    static fromYmdHms(year: number, month: number, day: number, hour: number, minute: number, second: number): Lunar
    getYearInGanZhi(): string
    getMonthInGanZhi(): string
    getDayInGanZhi(): string
    getTimeInGanZhi(): string
    getYear(): number
    getMonth(): number
    getDay(): number
    getMonthInChinese(): string
    getDayInChinese(): string
    getJieQiTable(): Record<string, { toYmdHms(): string; toYmd(): string }>
    getPrevJieQi(deep?: number): { getName(): string; getSolar(): { toYmdHms(): string } } | null
    getNextJieQi(): { getName(): string; getSolar(): { toYmdHms(): string } } | null
    getEightChar(): EightChar
    getSolar(): Solar
  }
  export class Solar {
    static fromDate(d: Date): Solar
    static fromYmd(year: number, month: number, day: number): Solar
    static fromYmdHms(year: number, month: number, day: number, hour: number, minute: number, second: number): Solar
    getLunar(): Lunar
    getYear(): number
    getMonth(): number
    getDay(): number
    nextYear(n: number): Solar
    nextMonth(n: number): Solar
    next(n: number): Solar
    nextHour(n: number): Solar
    toYmd(): string
    toYmdHms(): string
  }
}
