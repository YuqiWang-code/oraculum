/**
 * 娱乐化入口配置：首页 / 问卦页的友好主题卡片、灵感转盘分区。
 * 主题只决定「问题类别」这个输入标签，绝不参与、也不影响起卦随机过程。
 */
import type { FriendlyTheme } from './types'
import type { QuestionCategory } from '../../types'

/** 首页与问卦页共用的主题卡片（点击即填入问题类别） */
export const FRIENDLY_THEMES: FriendlyTheme[] = [
  { key: 'study', icon: '🌱', title: '学业成长', subtitle: '考试、学习、成长的困惑', category: '考试学业' },
  { key: 'career', icon: '🏮', title: '工作方向', subtitle: '工作、选择、前程', category: '事业工作' },
  { key: 'mood', icon: '🌙', title: '心情状态', subtitle: '心里的纠结与日常小事', category: '日常综合' },
  { key: 'relation', icon: '💞', title: '关系情感', subtitle: '喜欢、相处、复合与人相处', category: '感情关系' },
  { key: 'surprise', icon: '🎲', title: '随便看看', subtitle: '没特定问题，转一转找灵感', category: '日常综合' }
]

/** 灵感转盘分区（仅用于挑选主题，不决定卦象） */
export interface WheelSector {
  label: string
  icon: string
  category: QuestionCategory
  /** 占位问题，用户可改 */
  placeholder: string
}

export const WHEEL_SECTORS: WheelSector[] = [
  { label: '学业', icon: '🌱', category: '考试学业', placeholder: '最近的学习或考试，我该怎么准备？' },
  { label: '事业', icon: '🏮', category: '事业工作', placeholder: '眼下这个工作上的选择，该怎么看？' },
  { label: '感情', icon: '💞', category: '感情关系', placeholder: '这段关系现在是怎么回事？' },
  { label: '家庭', icon: '🏠', category: '家庭人际', placeholder: '家里这件事，怎么处理更妥当？' },
  { label: '财运', icon: '💰', category: '财务收益', placeholder: '这笔花销或投入，现在合适吗？' },
  { label: '出行', icon: '🧭', category: '出行变动', placeholder: '打算出门或变动，时机怎么样？' },
  { label: '失物', icon: '🔑', category: '失物寻找', placeholder: '找不到的东西，可以往哪个方向找？' },
  { label: '综合', icon: '🍵', category: '日常综合', placeholder: '最近这件烦心事，帮我理一理。' }
]
