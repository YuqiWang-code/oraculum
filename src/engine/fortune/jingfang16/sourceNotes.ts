/**
 * 京房八宫 / 《易隐》十六变——来源注释
 *
 * 严格区分：
 * - 京房八宫核心（《京氏易传》）：本宫、一世~五世、游魂、归魂
 * - 《易隐》后世扩展：外戒、内戒、绝命、血脉、肌肉、骸骨、棺椁、冢墓
 *
 * 不应把后世扩展全部标为"京房原法"。
 */

/** 来源层说明 */
export const SOURCE_LAYER_NOTES: Record<string, { label: string; description: string; refs: string[] }> = {
  'jingfang-eight-palace': {
    label: '京房八宫核心',
    description: '出自汉代《京氏易传》的八宫卦变体系，包括本宫、一世至五世、游魂、归魂八个基本阶段。',
    refs: [
      'https://ctext.org/jingshi-yizhuan/zhs',
      'https://zh.wikisource.org/zh-hans/京氏易傳'
    ]
  },
  'yiyin-sixteen-extension': {
    label: '《易隐》后世扩展',
    description: '出自后世卜筮书《易隐》，在京房八宫基础上扩展为十六变。书中托称"京房曰"，但不应与汉代《京氏易传》完全等同。包括外戒、内戒、绝命、血脉、肌肉、骸骨、棺椁、冢墓。',
    refs: [
      'https://ctext.org/wiki.pl?chapter=629103&if=gb',
      'https://www.eee-learning.com/book/5510'
    ]
  },
  'oraculum-normalization': {
    label: 'Oraculum 项目规范化',
    description: 'Oraculum 项目为闭合十六变序列而添加的"还原"阶段，用于验证变换完整性。',
    refs: []
  }
}

/** 十六变整体来源说明 */
export const SIXTEEN_TRANSFORM_SOURCE_NOTE =
  '京房八宫核心阶段（本宫、一世~五世、游魂、归魂）出自《京氏易传》；' +
  '外戒、内戒、绝命、血脉、肌肉、骸骨、棺椁、冢墓出自后世《易隐》扩展，' +
  '书中托称"京房曰"但不应与汉代原典完全等同。' +
  '"绝命、棺椁、冢墓"为历史术语，不表示现实死亡、疾病或寿命。'

/** 禁止把十六变机械按年龄平均的说明 */
export const NO_AGE_MAPPING_NOTE =
  '十六变本身是结构研究层，不自动映射为"每卦5年/10年"或按年龄平均分配人生阶段。' +
  '南怀瑾等现代讲解中的人生阶段类比仅作为"现代类比资料"参考，不作为默认计算规则。'
