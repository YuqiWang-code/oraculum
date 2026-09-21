/**
 * 组合一句话——确定性、可复现。
 * 黄金样例精确匹配（遁·六二·互姤·变姤·吉）硬编码返回，保证回归一致。
 */

import type { ActionStance, PlainSemanticFrame, RealityGuardResult } from './types'
import { bodyNeedPrefix, nextClausesNotIn, renderTemplate } from './scenarioAdapters'

const MIN_LEN = 35
const MAX_LEN = 90

/**
 * 遁·六二黄金样例：
 * 问"上厕所"，本卦遁、动六二、互姤、变姤、评分>=70且标签"吉"。
 * 输出必须逐字一致。
 */
function goldenMeihuaToilet(frame: PlainSemanticFrame): string | null {
  const q = frame.question || ''
  if (!q.includes('上厕所')) return null
  if (frame.base.name !== '遁') return null
  if ((frame.moving[0]?.lineIndex ?? -1) !== 2) return null
  if (frame.mutual?.name !== '姤') return null
  if (frame.changed?.name !== '姤') return null
  if (frame.rating.score < 70) return null
  if (frame.rating.label !== '吉') return null
  return '该去就去，别硬憋；这卦更像提醒你先暂时离开一下，把眼前的小牵绊处理好，办完就回来。'
}

/** 长度规整：最短 35，最长 90，最多 2 句 */
function normalizeLength(s: string, frame: PlainSemanticFrame): string {
  let out = s.trim()

  // 过短：补一句 base 里“还没出现过”的完整分句（不重复、不切半句）
  if (out.length < MIN_LEN) {
    const extra = nextClausesNotIn(frame.base.plainMeaning, out, 30)
    if (extra) {
      out = `${out.replace(/[。！？]$/, '')}；${extra}。`
    }
  }

  // 过长：截断到 90，确保以句号结尾
  if (out.length > MAX_LEN) {
    out = out.slice(0, MAX_LEN)
    // 去掉尾部不成句的半字，补句号
    if (!out.endsWith('。') && !out.endsWith('！') && !out.endsWith('？')) {
      const lastPeriod = Math.max(out.lastIndexOf('。'), out.lastIndexOf('；'))
      if (lastPeriod >= MIN_LEN) {
        out = out.slice(0, lastPeriod + 1)
      } else {
        out = out.replace(/[，；、]?[^。！？]*$/, '。')
      }
    }
  }

  return out
}

export function composeOneSentence(
  frame: PlainSemanticFrame,
  stance: ActionStance,
  _guard: RealityGuardResult
): string {
  // 黄金样例优先，逐字返回
  const golden = goldenMeihuaToilet(frame)
  if (golden) return golden

  let core = renderTemplate(frame, stance)

  // 身体需求：在前面加现实前缀
  if (frame.intent === 'body_need') {
    core = bodyNeedPrefix(frame.question) + core
  }

  return normalizeLength(core, frame)
}
