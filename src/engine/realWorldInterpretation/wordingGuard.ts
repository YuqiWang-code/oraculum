/**
 * 长辈友好措辞守卫
 * 检查现代释义中是否出现禁词（确定命运、死亡预测等）。
 * 古籍 classic 层不受此检查。
 */
import { FORBIDDEN_WORDS } from './types'

export interface WordingGuardResult {
  passed: boolean
  violations: { word: string; field: string }[]
}

/**
 * 检查单个文本是否含禁词
 */
export function checkForbiddenWords(text: string, field: string): { word: string; field: string }[] {
  const violations: { word: string; field: string }[] = []
  for (const word of FORBIDDEN_WORDS) {
    if (text.includes(word)) {
      violations.push({ word, field })
    }
  }
  return violations
}

/**
 * 批量检查一个对象的所有字符串字段
 */
export function guardWording<T extends Record<string, unknown>>(
  obj: T,
  prefix = ''
): WordingGuardResult {
  const allViolations: { word: string; field: string }[] = []

  for (const [key, value] of Object.entries(obj)) {
    const fieldPath = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'string') {
      allViolations.push(...checkForbiddenWords(value, fieldPath))
    } else if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        const item = value[i]
        if (typeof item === 'string') {
          allViolations.push(...checkForbiddenWords(item, `${fieldPath}[${i}]`))
        } else if (item && typeof item === 'object') {
          const sub = guardWording(item as Record<string, unknown>, `${fieldPath}[${i}]`)
          allViolations.push(...sub.violations)
        }
      }
    } else if (value && typeof value === 'object') {
      const sub = guardWording(value as Record<string, unknown>, fieldPath)
      allViolations.push(...sub.violations)
    }
  }

  return {
    passed: allViolations.length === 0,
    violations: allViolations
  }
}
