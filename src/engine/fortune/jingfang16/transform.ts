/**
 * 京房八宫 / 《易隐》十六变——核心变换引擎
 *
 * 翻爻序列 FLIP_SEQUENCE = [1,2,3,4,5,4,3,2,1,2,3,4,5,4,3,2]
 * （1=初爻，自下而上）
 *
 * 乾宫 golden sequence（必须精确）：
 * 乾 姤 遁 否 观 剥 晋 旅 鼎 大有 离 噬嗑 颐 益 无妄 同人 乾
 *
 * 八宫全部第 16 变后必须回到初始本宫。
 */
import { HEXAGRAMS } from '../../../data/hexagrams'
import type { HexagramData } from '../../../types'
import { FLIP_SEQUENCE, type TransformStep, type SixteenTransformResult } from './types'
import { SIXTEEN_STAGES } from './stages'

/** 六爻编码 → 卦数据 的查找表 */
const LINES_TO_HEXAGRAM: Map<string, HexagramData> = new Map()
for (const h of HEXAGRAMS) {
  LINES_TO_HEXAGRAM.set(h.lines.join(''), h)
}

/** 按六爻查找卦名和序号 */
function lookupHexagram(lines: number[]): { name: string; kingWen: number } {
  const key = lines.join('')
  const h = LINES_TO_HEXAGRAM.get(key)
  if (!h) {
    return { name: '未知', kingWen: 0 }
  }
  return { name: h.name, kingWen: h.kingWen }
}

/**
 * 执行十六变
 * @param baseLines 初始本宫六爻（自下而上 [初,二,三,四,五,上]，1=阳 0=阴）
 * @returns 17 个状态（初始本宫 + 16 次变化）
 */
export function transformSixteen(
  baseLines: [0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1]
): SixteenTransformResult {
  const baseInfo = lookupHexagram(baseLines)

  const steps: TransformStep[] = []

  // 阶段 0：初始本宫
  steps.push({
    stage: SIXTEEN_STAGES[0],
    lines: [...baseLines] as [0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1],
    hexagramName: baseInfo.name,
    kingWen: baseInfo.kingWen,
    flippedLine: 0
  })

  // 当前爻状态（可变副本，修改数组内容而非重新赋值变量）
  const current = [...baseLines] as number[]

  // 16 次变化
  for (let i = 0; i < FLIP_SEQUENCE.length; i++) {
    const linePos = FLIP_SEQUENCE[i] // 1-6
    const lineIndex = linePos - 1 // 0-5

    // 翻动指定一爻（0↔1）
    current[lineIndex] = current[lineIndex] === 1 ? 0 : 1

    const info = lookupHexagram(current)
    const stageIndex = i + 1 // 1-16

    steps.push({
      stage: SIXTEEN_STAGES[stageIndex],
      lines: [...current] as [0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1],
      hexagramName: info.name,
      kingWen: info.kingWen,
      flippedLine: linePos
    })
  }

  // 验证最终回到本宫
  const finalLines = steps[steps.length - 1].lines
  const returnsToBase = finalLines.every((v, i) => v === baseLines[i])

  return {
    baseName: baseInfo.name,
    baseLines: [...baseLines] as [0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1],
    steps,
    returnsToBase
  }
}

/**
 * 从八宫名获取本宫六爻
 * @param palaceName 八宫名（乾兑离震巽坎艮坤）
 */
export function getPalaceBaseLines(palaceName: string): [0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1, 0 | 1] | null {
  const palaceHexagram = HEXAGRAMS.find((h) => h.name === palaceName && h.palacePosition === 0)
  if (!palaceHexagram) return null
  return palaceHexagram.lines
}
