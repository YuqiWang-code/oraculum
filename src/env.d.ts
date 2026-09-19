/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent
  export default component
}

declare module 'lunar-javascript' {
  export class Lunar {
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
  }
  export class Solar {
    static fromDate(d: Date): Solar
    static fromYmdHms(year: number, month: number, day: number, hour: number, minute: number, second: number): Solar
    getLunar(): Lunar
    toYmdHms(): string
  }
}
