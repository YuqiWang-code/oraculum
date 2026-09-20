/**
 * 京房八宫 / 《易隐》十六变——阶段定义与来源标注
 *
 * 来源分层：
 * - 京房八宫核心（《京氏易传》）：本宫、一世、二世、三世、四世、五世、游魂、归魂
 * - 《易隐》后世扩展：外戒、内戒、绝命、血脉、肌肉、骸骨、棺椁、冢墓
 *
 * 注意："绝命、棺椁、冢墓"是历史术语，不表示现实死亡、疾病或寿命。
 */
import type { SixteenStage } from './types'

/** 17 个阶段（0 本宫 + 1-15 变化 + 16 还原） */
export const SIXTEEN_STAGES: SixteenStage[] = [
  {
    index: 0,
    name: '本宫',
    sourceLayer: 'jingfang-eight-palace',
    modernNote: '起始基准卦，代表当前所立的根本结构。'
  },
  {
    index: 1,
    name: '一世',
    sourceLayer: 'jingfang-eight-palace',
    modernNote: '初爻变，代表事物刚开始变化，底层因素开始松动。'
  },
  {
    index: 2,
    name: '二世',
    sourceLayer: 'jingfang-eight-palace',
    modernNote: '二爻变，变化从底层向上延伸，开始影响实际层面。'
  },
  {
    index: 3,
    name: '三世',
    sourceLayer: 'jingfang-eight-palace',
    modernNote: '三爻变，变化到达内外卦交界，是结构转型的关键节点。'
  },
  {
    index: 4,
    name: '四世',
    sourceLayer: 'jingfang-eight-palace',
    modernNote: '四爻变，变化进入外层，外部环境开始明显转变。'
  },
  {
    index: 5,
    name: '五世',
    sourceLayer: 'jingfang-eight-palace',
    modernNote: '五爻变，变化到达尊位，是整个变化过程中最显著的阶段。'
  },
  {
    index: 6,
    name: '游魂',
    sourceLayer: 'jingfang-eight-palace',
    modernNote: '四爻再变（回到四爻位），代表变化到极点后开始游移不定，需要反思方向。'
  },
  {
    index: 7,
    name: '外戒',
    sourceLayer: 'yiyin-sixteen-extension',
    modernNote: '三爻变（《易隐》扩展），提醒在外在行为上有所戒慎，不宜冒进。'
  },
  {
    index: 8,
    name: '内戒',
    sourceLayer: 'yiyin-sixteen-extension',
    modernNote: '二爻变（《易隐》扩展），提醒在内在心态和根基上有所反省，稳住立场。'
  },
  {
    index: 9,
    name: '归魂',
    sourceLayer: 'jingfang-eight-palace',
    modernNote: '代表变化后回归根本，事物开始向原有结构收敛。本次翻动的爻位由程序按翻爻序列动态给出。'
  },
  {
    index: 10,
    name: '绝命',
    sourceLayer: 'yiyin-sixteen-extension',
    modernNote: '历史术语，不表示现实死亡。指旧结构彻底结束、新结构尚未开始的过渡状态。'
  },
  {
    index: 11,
    name: '血脉',
    sourceLayer: 'yiyin-sixteen-extension',
    modernNote: '历史术语。指新结构开始有了生命力和延续性，如同血脉开始流通。'
  },
  {
    index: 12,
    name: '肌肉',
    sourceLayer: 'yiyin-sixteen-extension',
    modernNote: '历史术语。指新结构逐渐丰满、有了实际内容和力量。'
  },
  {
    index: 13,
    name: '骸骨',
    sourceLayer: 'yiyin-sixteen-extension',
    modernNote: '历史术语。指新结构的骨架已经定型，核心框架确立。'
  },
  {
    index: 14,
    name: '棺椁',
    sourceLayer: 'yiyin-sixteen-extension',
    modernNote: '历史术语，不表示现实死亡。指一个完整周期的收尾和封装阶段。'
  },
  {
    index: 15,
    name: '冢墓',
    sourceLayer: 'yiyin-sixteen-extension',
    modernNote: '历史术语，不表示现实死亡。指旧周期彻底沉淀、成为历史记忆的阶段。'
  },
  {
    index: 16,
    name: '还原',
    sourceLayer: 'oraculum-normalization',
    modernNote: '回到初始本宫卦，十六变完整闭合，象征一个周期结束、新周期可再开始。'
  }
]

/** 历史术语保护提示 */
export const HISTORICAL_TERM_DISCLAIMER =
  '历史术语，不表示现实死亡、疾病或寿命。以上为传统结构研究中的象征性名称。'

/** 需要显示历史术语保护提示的阶段名 */
export const HISTORICAL_TERMS = ['绝命', '棺椁', '冢墓']
