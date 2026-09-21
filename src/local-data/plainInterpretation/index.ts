/**
 * 普通用户解释层（plain interpretation）——数据入口
 *
 * 这是叠加在「专业计算层 / 古籍原文层」之上的表达层：
 *   用户输入 → casting/liuyao/calendar（计算，只读）→ analysis fact
 *   → 专业解读 / 普通用户解释（本目录）→ 视图
 *
 * 本层不联网、不含 AI、不含随机；不改起卦、不改评分、不改历史结果。
 */
export const PLAIN_INTERPRETATION_VERSION = 'plain_interpretation_v1'

export type {
  PlainTerm,
  PlainHexagram,
  PlainBodyUse,
  FriendlyTheme
} from './types'

export { TERM_GLOSSARY, getTermPlain, hasTermPlain } from './glossary'
export {
  PLAIN_HEXAGRAMS,
  getPlainHexagram,
  getElderPlain
} from './hexagramPlain'
export { BODY_USE_PLAIN, getBodyUsePlain } from './bodyUsePlain'
export {
  plainEvidenceNote,
  mainHumanConstraint,
  mainHumanSupport
} from './evidencePlain'
export { FRIENDLY_THEMES, WHEEL_SECTORS } from './themes'
export type { WheelSector } from './themes'
