/**
 * 梅花易数本卦/互卦/变卦角色定义
 * 依据《梅花易数》卷二、卷三
 */

export type MeihuaRole = 'base' | 'mutual' | 'changed' | 'moving_line' | 'body_use'

export interface RoleDescription {
  role: MeihuaRole
  title: string
  /** 传统依据原文 */
  classicalBasis: string
  /** 角色说明 */
  description: string
}

export const MEIHUA_ROLES: Record<string, RoleDescription> = {
  base: {
    role: 'base',
    title: '本卦 —— 当前主旨',
    classicalBasis: '体为主，用为事。（《梅花易数》卷二）',
    description: '本卦代表当前事情的基础格局与主旨方向。'
  },
  moving_line: {
    role: 'moving_line',
    title: '动爻 —— 当前变化点',
    classicalBasis: '动爻为事之几。（《梅花易数》）',
    description: '动爻是当前局面的关键变化点，指示事情正在发生的转折。'
  },
  mutual: {
    role: 'mutual',
    title: '互卦 —— 中间过程',
    classicalBasis: '互为中间之应。（《梅花易数》卷三）',
    description: '互卦代表事情的中间过程与内在演变。'
  },
  changed: {
    role: 'changed',
    title: '变卦 —— 后续趋向',
    classicalBasis: '变为事占之终应。（《梅花易数》卷三）',
    description: '变卦代表事情的后续发展与最终趋向。'
  },
  body_use: {
    role: 'body_use',
    title: '体用 —— 主体与事情的五行关系',
    classicalBasis: '体为主，用为事。体用之诀在五行生克。（《梅花易数》卷二）',
    description: '体卦为问卦主体，用卦为所问之事，五行生克反映主客关系。'
  }
}
