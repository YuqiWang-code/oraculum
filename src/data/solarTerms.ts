/**
 * 二十四节气名称与月建对应（资料 4.3 / 4.4）。
 * 实际交节时刻由 lunar-javascript 计算，这里只存名称与月建映射。
 */
export const SOLAR_TERMS = [
  '立春', '雨水', '惊蛰', '春分', '清明', '谷雨',
  '立夏', '小满', '芒种', '夏至', '小暑', '大暑',
  '立秋', '处暑', '白露', '秋分', '寒露', '霜降',
  '立冬', '小雪', '大雪', '冬至', '小寒', '大寒'
] as const

/**
 * 月建：以"节"换月（资料 4.4）。
 * 立春起寅月、惊蛰起卯月……
 */
export const JIE_TO_MONTH_BRANCH: Record<string, string> = {
  立春: '寅',
  惊蛰: '卯',
  清明: '辰',
  立夏: '巳',
  芒种: '午',
  小暑: '未',
  立秋: '申',
  白露: '酉',
  寒露: '戌',
  立冬: '亥',
  大雪: '子',
  小寒: '丑'
}

/** 十二地支序号：子1...亥12（梅花年支数用） */
export const BRANCH_INDEX: Record<string, number> = {
  子: 1, 丑: 2, 寅: 3, 卯: 4, 辰: 5, 巳: 6,
  午: 7, 未: 8, 申: 9, 酉: 10, 戌: 11, 亥: 12
}

/** 六旬旬空（资料 7.7），由六十甲子序号推算 */
const XUNKONG: Record<string, [string, string]> = {
  甲子: ['戌', '亥'],
  甲戌: ['申', '酉'],
  甲申: ['午', '未'],
  甲午: ['辰', '巳'],
  甲辰: ['寅', '卯'],
  甲寅: ['子', '丑']
}

/**
 * 由日柱干支求旬空。
 * 找到日柱所在旬首，返回该旬两个空亡地支。
 */
export function xunKongFromDay(dayGanzhi: string): [string, string] {
  // 六十甲子：每旬10个，旬首为 甲子,甲戌,甲申,甲午,甲辰,甲寅
  const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
  const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
  // 六十甲子序号 index 0..59
  const stem = STEMS.indexOf(dayGanzhi[0])
  const branch = BRANCHES.indexOf(dayGanzhi[1])
  // 序号 n 满足 n%10==stem, n%12==branch
  let n = -1
  for (let i = 0; i < 60; i++) {
    if (i % 10 === stem && i % 12 === branch) { n = i; break }
  }
  if (n < 0) throw new Error(`无效日柱干支: ${dayGanzhi}`)
  const xunHeadIndex = Math.floor(n / 10) * 10 // 旬首序号
  const headStem = STEMS[xunHeadIndex % 10]
  const headBranch = BRANCHES[xunHeadIndex % 12]
  const head = headStem + headBranch
  const k = XUNKONG[head]
  if (!k) throw new Error(`未找到旬首: ${head}`)
  return k
}
