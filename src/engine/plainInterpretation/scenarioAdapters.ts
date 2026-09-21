/**
 * 场景适配器——为每种意图提供确定性白话模板。
 * 只做占位符替换与文案去重，不联想具体情节（姤不会自动变成"排队/遇熟人"）。
 */

import type { ActionStance, PlainQuestionIntent, PlainSemanticFrame } from './types'

/** 拆成完整分句（按中文标点），去掉末尾句号，绝不把一个分句切成半截 */
export function clausesOf(s: string): string[] {
  if (!s) return []
  return s
    .replace(/[。！？\s]+$/, '')
    .split(/[，；、,;]/)
    .map((x) => x.trim())
    .filter(Boolean)
}

/**
 * 取前 n 字以内的“完整分句”：只在标点处收束。
 * 宁可带上略超 n 的第一个完整分句，也不输出「别」「三天两」这种半句话。
 */
export function clauseExcerpt(s: string, n: number): string {
  if (!s) return ''
  const clean = s.trim().replace(/[。！？\s]+$/, '')
  if (clean.length <= n) return clean
  const cls = clausesOf(clean)
  if (cls.length <= 1) return clean.replace(/[。！？\s]+$/, '')
  let out = ''
  for (const c of cls) {
    if (out && (out.length + 1 + c.length) > n) break
    out = out ? `${out}，${c}` : c
  }
  return out || cls[0]
}

/** 从一句话里挑出 core 尚未包含的分句，拼回一段（用于短句补全，避免重复） */
export function nextClausesNotIn(sentence: string, core: string, maxAdd = 30): string {
  const fresh = clausesOf(sentence).filter((c) => !core.includes(c))
  if (!fresh.length) return ''
  let out = ''
  for (const c of fresh) {
    if (out && (out.length + 1 + c.length) > maxAdd) break
    out = out ? `${out}，${c}` : c
  }
  return out
}

/** 截断到前 n 个汉字（按完整分句收束，不切半句） */
function truncate(s: string, n: number): string {
  if (!s) return ''
  return clauseExcerpt(s, n)
}

function basePhrase(frame: PlainSemanticFrame): string {
  return truncate(frame.base.plainMeaning, 15)
}

function movingPhrase(frame: PlainSemanticFrame): string {
  const m = frame.moving[0]
  return m ? truncate(m.plainMeaning, 15) : ''
}

function changedPhrase(frame: PlainSemanticFrame): string {
  return frame.changed ? truncate(frame.changed.plainMeaning, 15) : ''
}

function mainConstraint(frame: PlainSemanticFrame): string {
  return frame.constraintPlain ?? '眼前最卡的地方'
}

const TOILET_KEYWORDS = ['上厕所', '厕所', '方便', '尿急', '尿尿', '拉屎', '大便', '小便']
const DRINK_KEYWORDS = ['喝水', '口渴']
const EAT_KEYWORDS = ['吃饭', '饿了']
const REST_KEYWORDS = ['休息', '睡觉', '困了']

/** 身体需求前缀（"别硬憋"只在厕所场景用） */
export function bodyNeedPrefix(question: string): string {
  const q = question || ''
  if (TOILET_KEYWORDS.some((k) => q.includes(k))) return '该去就去，别硬憋；'
  if (DRINK_KEYWORDS.some((k) => q.includes(k))) return '该喝就喝，别忍着；'
  if (EAT_KEYWORDS.some((k) => q.includes(k))) return '该吃就吃，别饿着；'
  if (REST_KEYWORDS.some((k) => q.includes(k))) return '该休息就休息，别硬撑；'
  return '该做就做，别硬撑；'
}

/** 各意图 × 姿态的模板 */
const TEMPLATES: Record<PlainQuestionIntent, Record<ActionStance, string>> = {
  should_do: {
    do: '可以做，别想太多；{basePhrase}，{movingPhrase}。',
    do_cautiously: '可以做，但别硬冲；{movingPhrase}，先把关键条件处理好再行动。',
    small_step: '可以先试一步，别一次把决定做死；{changedPhrase}。',
    wait: '先别急着做；现在更适合{basePhrase}，等条件清楚一点再动。',
    avoid: '现在不太适合硬上；先理顺{mainConstraint}，再考虑下一步。',
    neutral: '这件事更适合看趋势和条件，不必急着下结论；{basePhrase}。'
  },
  will_happen: {
    do: '大概率会往这个方向走；{basePhrase}，顺势观察就好。',
    do_cautiously: '有这个苗头，但别赌太满；{movingPhrase}，边走边看。',
    small_step: '还在成形，先别急着下定论；{changedPhrase}。',
    wait: '现在还看不出结果；{basePhrase}，再等一阵。',
    avoid: '短期内比较难成；先理顺{mainConstraint}再说。',
    neutral: '趋势还没定，先看{basePhrase}。'
  },
  how_to: {
    do: '直接按{basePhrase}的方向做就行，不用想太复杂。',
    do_cautiously: '可以做，但先把{movingPhrase}这个关键点理顺。',
    small_step: '拆成小步走；{changedPhrase}。',
    wait: '先别动，把{basePhrase}的前提看清楚。',
    avoid: '现在方法不太对路；先理顺{mainConstraint}。',
    neutral: '重点是看{basePhrase}，不必一步到位。'
  },
  person_relation: {
    do: '可以主动一些；{basePhrase}，把话说开就好。',
    do_cautiously: '有机会，但别逼太紧；{movingPhrase}，留一点余地。',
    small_step: '先从普通接触开始；{changedPhrase}。',
    wait: '现在不是推进的时候；{basePhrase}，先稳住自己。',
    avoid: '暂时别硬推；先把{mainConstraint}理顺。',
    neutral: '关系更看相处节奏；{basePhrase}。'
  },
  lost_item: {
    do: '顺着{basePhrase}这个方向找，有机会找到。',
    do_cautiously: '可能在近处，但别翻太乱；{movingPhrase}。',
    small_step: '先按{changedPhrase}的线索慢慢找。',
    wait: '先别慌着翻；{basePhrase}，缓一缓再找。',
    avoid: '短期内不好找；先看清{mainConstraint}。',
    neutral: '东西没走远，重点看{basePhrase}。'
  },
  generic: {
    do: '可以去做，{basePhrase}，顺着节奏来。',
    do_cautiously: '可以做，但留个心眼，{movingPhrase}。',
    small_step: '可以先试一小步，{changedPhrase}。',
    wait: '先别急，{basePhrase}，看看再说。',
    avoid: '先放一放，把{mainConstraint}理顺再说。',
    neutral: '先看着{basePhrase}，不用太着急。'
  },
  // body_need / when 使用专用模板（见下方函数）
  body_need: {
    do: '先把眼前这点身体需要照顾好，回来再处理别的，别硬撑。',
    do_cautiously: '先把眼前这点身体需要照顾好，回来再处理别的，别硬撑。',
    small_step: '先把眼前这点身体需要照顾好，回来再处理别的，别硬撑。',
    wait: '先把眼前这点身体需要照顾好，回来再处理别的，别硬撑。',
    avoid: '先把眼前这点身体需要照顾好，回来再处理别的，别硬撑。',
    neutral: '先把眼前这点身体需要照顾好，回来再处理别的，别硬撑。'
  },
  when: {
    do: '这卦更适合看趋势，不适合硬给具体日期；当前重点是{basePhrase}。',
    do_cautiously: '这卦更适合看趋势，不适合硬给具体日期；当前重点是{basePhrase}。',
    small_step: '这卦更适合看趋势，不适合硬给具体日期；当前重点是{basePhrase}。',
    wait: '这卦更适合看趋势，不适合硬给具体日期；当前重点是{basePhrase}。',
    avoid: '这卦更适合看趋势，不适合硬给具体日期；当前重点是{basePhrase}。',
    neutral: '这卦更适合看趋势，不适合硬给具体日期；当前重点是{basePhrase}。'
  }
}

/** 文案去重：base 与 moving 重复时只保留一个 */
function dedupPhrases(text: string, bp: string, mp: string): string {
  if (!mp || !bp) return text
  const redundant = mp === bp || bp.includes(mp) || mp.includes(bp)
  if (!redundant) return text
  // 去掉冗余的"，{mp}"分句
  return text.replace(new RegExp(`，${mp}(?=[。，])`, 'g'), '')
}

/** 渲染模板核心句（不含身体前缀与长度规整） */
export function renderTemplate(frame: PlainSemanticFrame, stance: ActionStance): string {
  const t = TEMPLATES[frame.intent] ?? TEMPLATES.generic
  const template = t[stance] ?? TEMPLATES.generic[stance] ?? TEMPLATES.generic.do

  const bp = basePhrase(frame)
  const mp = movingPhrase(frame)
  const cp = changedPhrase(frame) || bp
  const mc = mainConstraint(frame)

  let out = template
  out = out.split('{basePhrase}').join(bp)
  out = out.split('{movingPhrase}').join(mp || bp)
  out = out.split('{changedPhrase}').join(cp)
  out = out.split('{mainConstraint}').join(mc)
  out = dedupPhrases(out, bp, mp)
  return out
}
