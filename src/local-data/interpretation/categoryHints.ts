/**
 * 问题类别提示（用于补充行动建议）
 */

import type { QuestionCategory } from '../../types'

export interface CategoryHint {
  category: QuestionCategory
  /** 针对该类别的特别提示 */
  hint: string
  /** 该类别通常关注的卦象要素 */
  focus: string
}

export const CATEGORY_HINTS: Record<QuestionCategory, CategoryHint> = {
  '事业工作': { category: '事业工作', hint: '重点看体用生克与本卦主旨，事业以体卦为自身、用卦为工作环境。', focus: '体用关系、本卦卦义' },
  '考试学业': { category: '考试学业', hint: '重点看本卦卦义与互卦渐进，学业宜循序渐进。', focus: '本卦、互卦渐进之意' },
  '项目合作': { category: '项目合作', hint: '重点看体用关系与变卦趋向，合作看双方生克。', focus: '体用生克、变卦结果' },
  '财务收益': { category: '财务收益', hint: '重点看体用生克，用生体或体克用为有利。', focus: '体用生克、变卦趋向' },
  '感情关系': { category: '感情关系', hint: '重点看体用比和与卦义中的和顺之意，兑卦、咸卦等为直接参考。', focus: '体用关系、卦义中和顺/和悦之意' },
  '家庭人际': { category: '家庭人际', hint: '重点看互卦过程与变卦结果，人际看重沟通与和同。', focus: '互卦过程、变卦结果' },
  '出行变动': { category: '出行变动', hint: '重点看卦义中的动象与险陷，坎卦为险、震卦为动。', focus: '卦义动险、体用生克' },
  '失物寻找': { category: '失物寻找', hint: '重点看卦象方位与体用关系，变卦指示去向。', focus: '卦象方位、变卦去向' },
  '选择比较': { category: '选择比较', hint: '重点看本卦主旨与变卦趋向，体卦为已选方向、用卦为另一选项。', focus: '本卦主旨、变卦趋向' },
  '计划成败': { category: '计划成败', hint: '重点看体用生克与动爻变化，体克用或用生体为可成。', focus: '体用生克、动爻变化' },
  '日常综合': { category: '日常综合', hint: '全面参考本卦、互卦、变卦与体用。', focus: '全部要素' },
  '其他': { category: '其他', hint: '以本卦卦义为主，参考体用与变卦。', focus: '本卦卦义' }
}
