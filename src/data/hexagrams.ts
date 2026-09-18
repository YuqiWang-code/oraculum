import type { HexagramData, PalaceName, TrigramName } from '../types'
import { TRIGRAMS } from './trigrams'
import { ZHOUYI_MAP } from './classics/zhouyi'

/**
 * 六十四卦（通行《周易》/ King Wen 次序）
 * - 结构（上下卦、八宫、世应）依据资料第 3、6.1、6.2 节录入。
 * - 经典卦辞/爻辞：资料库未逐字提供，v1 一律留空并标 needsVerify，
 *   不凭记忆把回忆文本冒充经典原文；待 ctext / 维基文库逐字核对后补录。
 *   见 docs/DATA_SOURCES.md。
 */

const TODO_CLASSIC = ''

// 八宫位置 -> 世爻/应爻（资料 6.2）
const SHI_YING_BY_POS: Record<number, [number, number]> = {
  0: [6, 3], // 本宫
  1: [1, 4], // 一世
  2: [2, 5], // 二世
  3: [3, 6], // 三世
  4: [4, 1], // 四世
  5: [5, 2], // 五世
  6: [4, 1], // 游魂
  7: [3, 6] // 归魂
}

interface RawHex {
  name: string
  upper: TrigramName
  lower: TrigramName
  palace: PalaceName
  pos: number
  keywords: string[]
}

// King Wen 1..64，依据资料第 3 节表
const RAW: RawHex[] = [
  { name: '乾', upper: '乾', lower: '乾', palace: '乾', pos: 0, keywords: ['自强', '创始', '主动', '健行'] },
  { name: '坤', upper: '坤', lower: '坤', palace: '坤', pos: 0, keywords: ['承载', '顺势', '包容', '配合'] },
  { name: '屯', upper: '坎', lower: '震', palace: '坎', pos: 2, keywords: ['初生艰难', '起步', '蓄势'] },
  { name: '蒙', upper: '艮', lower: '坎', palace: '离', pos: 4, keywords: ['启蒙', '学习', '未知', '求教'] },
  { name: '需', upper: '坎', lower: '乾', palace: '坤', pos: 6, keywords: ['等待', '准备', '时机'] },
  { name: '讼', upper: '乾', lower: '坎', palace: '离', pos: 6, keywords: ['争议', '分歧', '规则', '审慎'] },
  { name: '师', upper: '坤', lower: '坎', palace: '坎', pos: 7, keywords: ['组织', '纪律', '群体行动'] },
  { name: '比', upper: '坎', lower: '坤', palace: '坤', pos: 7, keywords: ['亲比', '合作', '归属'] },
  { name: '小畜', upper: '巽', lower: '乾', palace: '巽', pos: 1, keywords: ['小有积蓄', '约束', '渐进'] },
  { name: '履', upper: '乾', lower: '兑', palace: '艮', pos: 5, keywords: ['践行', '礼法', '谨慎前行'] },
  { name: '泰', upper: '坤', lower: '乾', palace: '坤', pos: 3, keywords: ['通达', '协调', '上下相交'] },
  { name: '否', upper: '乾', lower: '坤', palace: '乾', pos: 3, keywords: ['闭塞', '隔阂', '暂缓'] },
  { name: '同人', upper: '乾', lower: '离', palace: '离', pos: 7, keywords: ['同道', '协作', '公开连接'] },
  { name: '大有', upper: '离', lower: '乾', palace: '乾', pos: 7, keywords: ['丰有', '资源', '成就'] },
  { name: '谦', upper: '坤', lower: '艮', palace: '兑', pos: 5, keywords: ['谦抑', '平衡', '内敛'] },
  { name: '豫', upper: '震', lower: '坤', palace: '震', pos: 1, keywords: ['预备', '鼓舞', '顺势而动'] },
  { name: '随', upper: '兑', lower: '震', palace: '震', pos: 7, keywords: ['随时', '顺应', '跟随'] },
  { name: '蛊', upper: '艮', lower: '巽', palace: '巽', pos: 7, keywords: ['整治', '修复', '除弊'] },
  { name: '临', upper: '坤', lower: '兑', palace: '坤', pos: 2, keywords: ['接近', '管理', '成长'] },
  { name: '观', upper: '巽', lower: '坤', palace: '乾', pos: 4, keywords: ['观察', '示范', '审视'] },
  { name: '噬嗑', upper: '离', lower: '震', palace: '巽', pos: 5, keywords: ['决断', '治理', '排障'] },
  { name: '贲', upper: '艮', lower: '离', palace: '艮', pos: 1, keywords: ['文饰', '表达', '形式与内容'] },
  { name: '剥', upper: '艮', lower: '坤', palace: '乾', pos: 5, keywords: ['剥落', '收缩', '保守'] },
  { name: '复', upper: '坤', lower: '震', palace: '坤', pos: 1, keywords: ['回归', '复始', '恢复'] },
  { name: '无妄', upper: '乾', lower: '震', palace: '巽', pos: 4, keywords: ['自然', '诚实', '少妄为'] },
  { name: '大畜', upper: '艮', lower: '乾', palace: '艮', pos: 2, keywords: ['积蓄', '训练', '蓄力'] },
  { name: '颐', upper: '艮', lower: '震', palace: '巽', pos: 6, keywords: ['养护', '输入', '节制'] },
  { name: '大过', upper: '兑', lower: '巽', palace: '震', pos: 6, keywords: ['压力', '超载', '非常之举'] },
  { name: '坎', upper: '坎', lower: '坎', palace: '坎', pos: 0, keywords: ['险阻', '反复', '谨慎'] },
  { name: '离', upper: '离', lower: '离', palace: '离', pos: 0, keywords: ['明察', '附丽', '辨识'] },
  { name: '咸', upper: '兑', lower: '艮', palace: '兑', pos: 3, keywords: ['感应', '互动', '相互影响'] },
  { name: '恒', upper: '震', lower: '巽', palace: '震', pos: 3, keywords: ['持久', '稳定', '长期主义'] },
  { name: '遁', upper: '乾', lower: '艮', palace: '乾', pos: 2, keywords: ['退避', '保存', '适时抽身'] },
  { name: '大壮', upper: '震', lower: '乾', palace: '坤', pos: 4, keywords: ['强盛', '力量', '克制'] },
  { name: '晋', upper: '离', lower: '坤', palace: '乾', pos: 6, keywords: ['进展', '显现', '上升'] },
  { name: '明夷', upper: '坤', lower: '离', palace: '坎', pos: 6, keywords: ['受抑', '藏明', '自保'] },
  { name: '家人', upper: '巽', lower: '离', palace: '巽', pos: 2, keywords: ['秩序', '角色', '内部治理'] },
  { name: '睽', upper: '离', lower: '兑', palace: '艮', pos: 4, keywords: ['分歧', '异中求同'] },
  { name: '蹇', upper: '坎', lower: '艮', palace: '兑', pos: 4, keywords: ['艰难', '阻滞', '求助'] },
  { name: '解', upper: '震', lower: '坎', palace: '震', pos: 2, keywords: ['解除', '缓解', '释放'] },
  { name: '损', upper: '艮', lower: '兑', palace: '艮', pos: 3, keywords: ['减损', '取舍', '节制'] },
  { name: '益', upper: '巽', lower: '震', palace: '巽', pos: 3, keywords: ['增益', '改善', '投入'] },
  { name: '夬', upper: '兑', lower: '乾', palace: '坤', pos: 5, keywords: ['决断', '公开', '去除'] },
  { name: '姤', upper: '乾', lower: '巽', palace: '乾', pos: 1, keywords: ['相遇', '突发', '边界'] },
  { name: '萃', upper: '兑', lower: '坤', palace: '兑', pos: 2, keywords: ['聚集', '会合', '资源汇聚'] },
  { name: '升', upper: '坤', lower: '巽', palace: '震', pos: 4, keywords: ['上升', '渐进', '累积'] },
  { name: '困', upper: '兑', lower: '坎', palace: '兑', pos: 1, keywords: ['困顿', '受限', '守志'] },
  { name: '井', upper: '坎', lower: '巽', palace: '震', pos: 5, keywords: ['共同资源', '制度', '维护'] },
  { name: '革', upper: '兑', lower: '离', palace: '坎', pos: 4, keywords: ['变革', '更新', '转型'] },
  { name: '鼎', upper: '离', lower: '巽', palace: '离', pos: 2, keywords: ['重构', '成器', '制度化'] },
  { name: '震', upper: '震', lower: '震', palace: '震', pos: 0, keywords: ['震动', '惊醒', '行动'] },
  { name: '艮', upper: '艮', lower: '艮', palace: '艮', pos: 0, keywords: ['停止', '边界', '静定'] },
  { name: '渐', upper: '巽', lower: '艮', palace: '艮', pos: 7, keywords: ['渐进', '秩序', '长期发展'] },
  { name: '归妹', upper: '震', lower: '兑', palace: '兑', pos: 7, keywords: ['关系变化', '条件不完备'] },
  { name: '丰', upper: '震', lower: '离', palace: '坎', pos: 5, keywords: ['丰盛', '盛极', '把握高峰'] },
  { name: '旅', upper: '离', lower: '艮', palace: '离', pos: 1, keywords: ['旅途', '异地', '临时状态'] },
  { name: '巽', upper: '巽', lower: '巽', palace: '巽', pos: 0, keywords: ['进入', '渗透', '柔顺'] },
  { name: '兑', upper: '兑', lower: '兑', palace: '兑', pos: 0, keywords: ['悦纳', '交流', '言语'] },
  { name: '涣', upper: '巽', lower: '坎', palace: '离', pos: 5, keywords: ['涣散', '疏通', '重聚'] },
  { name: '节', upper: '坎', lower: '兑', palace: '坎', pos: 1, keywords: ['节制', '规则', '边界'] },
  { name: '中孚', upper: '巽', lower: '兑', palace: '艮', pos: 6, keywords: ['诚信', '内在一致', '信任'] },
  { name: '小过', upper: '震', lower: '艮', palace: '兑', pos: 6, keywords: ['小事可为', '谨慎修正'] },
  { name: '既济', upper: '坎', lower: '离', palace: '坎', pos: 3, keywords: ['阶段完成', '守成', '防反复'] },
  { name: '未济', upper: '离', lower: '坎', palace: '离', pos: 3, keywords: ['未完成', '过渡', '继续推进'] }
]

function build(): HexagramData[] {
  return RAW.map((r, i) => {
    const kingWen = i + 1
    const lowerLines = [...TRIGRAMS[r.lower].lines] as [0 | 1, 0 | 1, 0 | 1]
    const upperLines = [...TRIGRAMS[r.upper].lines] as [0 | 1, 0 | 1, 0 | 1]
    const lines = [...lowerLines, ...upperLines] as HexagramData['lines']
    const [shi, ying] = SHI_YING_BY_POS[r.pos]
    const classic = ZHOUYI_MAP.get(kingWen)
    return {
      kingWen,
      name: r.name,
      // Unicode 易卦符号块 U+4DC0 起按 King Wen 顺序排列
      unicode: String.fromCodePoint(0x4dc0 + kingWen - 1),
      upper: r.upper,
      lower: r.lower,
      lines,
      palace: r.palace,
      palacePosition: r.pos,
      shiLine: shi as HexagramData['shiLine'],
      yingLine: ying as HexagramData['yingLine'],
      judgmentClassic: classic?.judgment || '',
      lineTextsClassic: classic ? [...classic.lines] : ['', '', '', '', '', ''],
      editorialKeywords: r.keywords,
      sources: classic
        ? ['资料第3节六十四卦索引', '资料第6.1节八宫表', '维基文库《周易》']
        : ['资料第3节六十四卦索引', '资料第6.1节八宫表'],
      needsVerify: classic ? false : true
    }
  })
}

export const HEXAGRAMS: HexagramData[] = build()

/** 按 King Wen 序号取（1-based） */
export const HEXAGRAM_BY_KINGWEN: Map<number, HexagramData> = new Map(
  HEXAGRAMS.map((h) => [h.kingWen, h])
)

/** 按卦名取 */
export const HEXAGRAM_BY_NAME: Map<string, HexagramData> = new Map(
  HEXAGRAMS.map((h) => [h.name, h])
)

/** 按六爻编码（自下而上 6 位字符串）取 */
export const HEXAGRAM_BY_LINES: Map<string, HexagramData> = new Map(
  HEXAGRAMS.map((h) => [h.lines.join(''), h])
)

export function hexagramFromLines(lines: HexagramData['lines']): HexagramData {
  const h = HEXAGRAM_BY_LINES.get(lines.join(''))
  if (!h) throw new Error(`未知六爻组合: ${lines.join('')}`)
  return h
}
