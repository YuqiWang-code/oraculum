import type { QuestionCategory } from '../../types'

/**
 * 问题分类（资料第9节）。v1 由用户手工选择；
 * 这里仅提供关键词辅助提示，不做 ML。
 */
export const QUESTION_CATEGORIES: QuestionCategory[] = [
  '事业工作', '考试学业', '项目合作', '财务收益', '感情关系', '家庭人际',
  '出行变动', '失物寻找', '选择比较', '计划成败', '日常综合', '其他'
]

const KEYWORD_HINT: Record<string, QuestionCategory> = {
  工作: '事业工作', 升职: '事业工作', 跳槽: '事业工作', 项目: '项目合作',
  考试: '考试学业', 成绩: '考试学业', 学: '考试学业',
  钱: '财务收益', 财: '财务收益', 投资: '财务收益', 生意: '财务收益',
  感情: '感情关系', 恋爱: '感情关系', 婚姻: '感情关系', 复合: '感情关系',
  家人: '家庭人际', 父母: '家庭人际', 朋友: '家庭人际',
  出差: '出行变动', 搬家: '出行变动', 旅行: '出行变动', 出行: '出行变动',
  丢: '失物寻找', 找: '失物寻找',
  选: '选择比较', 对比: '选择比较', 还是: '选择比较',
  计划: '计划成败', 能不能成: '计划成败', 成败: '计划成败'
}

/** 根据问题文本给出建议类别（仅提示，用户可改） */
export function hintCategory(question: string): QuestionCategory | null {
  for (const k of Object.keys(KEYWORD_HINT)) {
    if (question.includes(k)) return KEYWORD_HINT[k]
  }
  return null
}
