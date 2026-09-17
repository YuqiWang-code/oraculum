/**
 * 本地 datetime 工具：避免 toISOString() 的时区偏移。
 * datetime-local 的值不带时区，表示"本地墙上时间"。
 */

/** Date -> "YYYY-MM-DDTHH:mm:ss"（本地，含秒） */
export function formatDateTimeLocalSeconds(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

/**
 * 解析 datetime-local 字符串为本地 Date。
 * 直接按本地字段构造，不做 UTC 转换，避免 +/-8 小时错位。
 */
export function parseLocalDateTime(s: string): Date {
  // s 形如 2026-09-17T21:39:27 或 2026-09-17T21:39
  const [datePart, timePart] = s.split('T')
  const [y, m, day] = datePart.split('-').map(Number)
  const t = (timePart || '00:00:00').split(':').map(Number)
  return new Date(y, (m || 1) - 1, day || 1, t[0] || 0, t[1] || 0, t[2] || 0)
}

/** 本地 Date -> "YYYY-MM-DD HH:mm:ss" 展示 */
export function formatDisplaySeconds(d: Date): string {
  return formatDateTimeLocalSeconds(d).replace('T', ' ')
}
