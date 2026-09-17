import { describe, it, expect } from 'vitest'
import { HEXAGRAMS, HEXAGRAM_BY_NAME } from '../../src/data/hexagrams'
import { PALACE_ELEMENT } from '../../src/data/palaces'
import { NAJIA, BRANCH_ELEMENT } from '../../src/data/najia'
import { relationOf } from '../../src/data/sixRelations'
import { sixSpiritsForDay } from '../../src/data/sixSpirits'
import { xunKongFromDay } from '../../src/data/solarTerms'
import type { Element } from '../../src/types'

describe('八宫归属（资料 6.1）', () => {
  it('64 卦都有宫且宫为八卦', () => {
    for (const h of HEXAGRAMS) {
      expect(PALACE_ELEMENT[h.palace]).toBeTruthy()
    }
  })
  it('本宫纯卦：乾宫乾、坎宫坎', () => {
    expect(HEXAGRAM_BY_NAME.get('乾')!.palace).toBe('乾')
    expect(HEXAGRAM_BY_NAME.get('坎')!.palace).toBe('坎')
  })
  it('归魂卦：火天大有归乾宫', () => {
    expect(HEXAGRAM_BY_NAME.get('大有')!.palace).toBe('乾')
    expect(HEXAGRAM_BY_NAME.get('大有')!.palacePosition).toBe(7)
  })
})

describe('世应（资料 6.2）', () => {
  it('本宫世6应3', () => {
    const qian = HEXAGRAM_BY_NAME.get('乾')!
    expect(qian.shiLine).toBe(6)
    expect(qian.yingLine).toBe(3)
  })
  it('一世世1应4（天风姤）', () => {
    const gou = HEXAGRAM_BY_NAME.get('姤')!
    expect(gou.shiLine).toBe(1)
    expect(gou.yingLine).toBe(4)
  })
})

describe('纳甲（资料 6.3）', () => {
  it('乾内卦纳子寅辰，外卦午申戌', () => {
    expect(NAJIA['乾'].innerBranches.join(',')).toBe('子,寅,辰')
    expect(NAJIA['乾'].outerBranches.join(',')).toBe('午,申,戌')
  })
  it('坎纳寅辰午 / 申戌子', () => {
    expect(NAJIA['坎'].innerBranches.join(',')).toBe('寅,辰,午')
  })
  it('地支五行', () => {
    expect(BRANCH_ELEMENT['子']).toBe('水')
    expect(BRANCH_ELEMENT['午']).toBe('火')
    expect(BRANCH_ELEMENT['辰']).toBe('土')
  })
})

describe('六亲（资料 6.4）', () => {
  it('金宫：金=兄弟，水=子孙，木=妻财，火=官鬼，土=父母', () => {
    expect(relationOf('金', '金')).toBe('兄弟')
    expect(relationOf('金', '水')).toBe('子孙')
    expect(relationOf('金', '木')).toBe('妻财')
    expect(relationOf('金', '火')).toBe('官鬼')
    expect(relationOf('金', '土')).toBe('父母')
  })
})

describe('六神按日干（资料 6.5）', () => {
  it('甲乙日初爻青龙', () => {
    expect(sixSpiritsForDay('甲')[0]).toBe('青龙')
    expect(sixSpiritsForDay('乙')[0]).toBe('青龙')
  })
  it('庚辛日初爻白虎', () => {
    expect(sixSpiritsForDay('庚')[0]).toBe('白虎')
  })
  it('壬癸日初爻玄武', () => {
    expect(sixSpiritsForDay('壬')[0]).toBe('玄武')
  })
  it('六爻长度6且循环', () => {
    const s = sixSpiritsForDay('甲')
    expect(s.length).toBe(6)
    expect(s[2]).toBe('勾陈')
  })
})

describe('旬空（资料 7.7）', () => {
  it('甲子旬空戌亥', () => {
    expect(xunKongFromDay('甲子').join(',')).toBe('戌,亥')
  })
  it('甲午旬空辰巳', () => {
    expect(xunKongFromDay('甲午').join(',')).toBe('辰,巳')
  })
  it('举例：日柱甲辰', () => {
    expect(xunKongFromDay('甲辰').join(',')).toBe('寅,卯')
  })
})
