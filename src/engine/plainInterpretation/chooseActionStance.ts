/**
 * 选择行动姿态——复用 rating.tendency，不创建第二套评分。
 * 基线只看倾向；caution / bodyUse 各自只降级一档，不重复叠加。
 */

import type { ActionStance, PlainSemanticFrame, RealityGuardResult } from './types'

/** 降级一档（do -> do_cautiously -> small_step -> wait -> avoid） */
const DOWNGRRADE: Record<ActionStance, ActionStance> = {
  do: 'do_cautiously',
  do_cautiously: 'small_step',
  small_step: 'wait',
  wait: 'avoid',
  avoid: 'avoid',
  neutral: 'neutral'
}

function downgrade(stance: ActionStance): ActionStance {
  return DOWNGRRADE[stance]
}

/** 是否有"时间类"可依据的数据（本引擎不伪造日期，故恒为无） */
const NO_TIMING_DATA = true

export function chooseActionStance(
  frame: PlainSemanticFrame,
  guard: RealityGuardResult
): ActionStance {
  const { tendency } = frame.rating
  const hasCaution = frame.hasStrongCaution === true
  const bodyUseUnfavorable = frame.bodyUse ? frame.bodyUse.favorable === false : false

  // 1. 倾向基线（positive / slightly_positive 都先给 do，caution 再降级）
  let stance: ActionStance
  switch (tendency) {
    case 'positive':
    case 'slightly_positive':
      stance = 'do'
      break
    case 'neutral':
      stance = 'small_step'
      break
    case 'slightly_negative':
      stance = 'wait'
      break
    case 'negative':
      stance = 'avoid'
      break
    default:
      stance = 'small_step'
  }

  // 2. when 意图：没有 timing 数据时不伪造日期，姿态为 neutral
  if (frame.intent === 'when' && NO_TIMING_DATA) {
    stance = 'neutral'
  }

  // 3. 强制约证据降级一档
  if (hasCaution) {
    stance = downgrade(stance)
  }

  // 4. 体用不利再降级一档
  if (bodyUseUnfavorable) {
    stance = downgrade(stance)
  }

  // 5. 身体基本需求高优先级——最后强制覆盖：先满足生理需要，不受悲观降级影响
  if (guard.priority === 'high' && frame.intent === 'body_need') {
    stance = 'do'
  }

  return stance
}
