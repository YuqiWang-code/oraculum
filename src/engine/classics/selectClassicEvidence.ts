import { HEXAGRAM_BY_KINGWEN } from '../../data/hexagrams'
import { ZHOUYI_MAP } from '../../data/classics/zhouyi'
import type { MeihuaResult } from '../meihua/castByTime'
import type { LiuYaoResult } from '../liuyao/layout'

/**
 * 经典证据选择器（v3.2 Phase 3）
 * 从已核验的《周易》经典原文中提取与本次卦象相关的原文。
 * 每条证据带 id、类型、来源、原文。
 */
export interface ClassicEvidence {
  id: string
  type: 'judgment' | 'line' | 'special'
  hexagramKingWen: number
  hexagramName: string
  lineIndex: number // 1-6, 0 = judgment
  original: string
  source: string
}

/** 梅花：本卦卦辞 + 动爻爻辞 + 变卦卦辞 */
export function selectMeihuaClassicEvidence(meihua: MeihuaResult): ClassicEvidence[] {
  const out: ClassicEvidence[] = []
  const ben = meihua.ben
  const bian = meihua.bian
  const moving = meihua.movingLine

  // 本卦卦辞
  if (ben.judgmentClassic) {
    out.push({
      id: 'ZHOUYI_BEN_JUDGMENT',
      type: 'judgment',
      hexagramKingWen: ben.kingWen,
      hexagramName: ben.name,
      lineIndex: 0,
      original: ben.judgmentClassic,
      source: '维基文库《周易》'
    })
  }

  // 动爻爻辞（1-based, 1=初爻, 6=上爻）
  if (moving >= 1 && moving <= 6 && ben.lineTextsClassic[moving - 1]) {
    out.push({
      id: `ZHOUYI_MOVING_LINE_${moving}`,
      type: 'line',
      hexagramKingWen: ben.kingWen,
      hexagramName: ben.name,
      lineIndex: moving,
      original: ben.lineTextsClassic[moving - 1],
      source: '维基文库《周易》'
    })
  }

  // 变卦卦辞
  if (bian && bian.judgmentClassic) {
    out.push({
      id: 'ZHOUYI_BIAN_JUDGMENT',
      type: 'judgment',
      hexagramKingWen: bian.kingWen,
      hexagramName: bian.name,
      lineIndex: 0,
      original: bian.judgmentClassic,
      source: '维基文库《周易》'
    })
  }

  return out
}

/** 六爻：本卦卦辞 + 所有动爻爻辞 + 变卦卦辞 */
export function selectLiuyaoClassicEvidence(r: LiuYaoResult): ClassicEvidence[] {
  const out: ClassicEvidence[] = []
  const ben = r.hexagram

  // 本卦卦辞
  if (ben.judgmentClassic) {
    out.push({
      id: 'ZHOUYI_BEN_JUDGMENT',
      type: 'judgment',
      hexagramKingWen: ben.kingWen,
      hexagramName: ben.name,
      lineIndex: 0,
      original: ben.judgmentClassic,
      source: '维基文库《周易》'
    })
  }

  // 所有动爻爻辞（不自行取舍）
  for (const line of r.lines) {
    if (line.moving && line.index >= 1 && line.index <= 6 && ben.lineTextsClassic[line.index - 1]) {
      out.push({
        id: `ZHOUYI_MOVING_LINE_${line.index}`,
        type: 'line',
        hexagramKingWen: ben.kingWen,
        hexagramName: ben.name,
        lineIndex: line.index,
        original: ben.lineTextsClassic[line.index - 1],
        source: '维基文库《周易》'
      })
    }
  }

  // v3.4: 变卦卦辞（来自 changedHexagram）
  if (r.changedHexagram && r.changedHexagram.judgmentClassic) {
    out.push({
      id: 'ZHOUYI_BIAN_JUDGMENT',
      type: 'judgment',
      hexagramKingWen: r.changedHexagram.kingWen,
      hexagramName: r.changedHexagram.name,
      lineIndex: 0,
      original: r.changedHexagram.judgmentClassic,
      source: '维基文库《周易》'
    })
  }

  return out
}
