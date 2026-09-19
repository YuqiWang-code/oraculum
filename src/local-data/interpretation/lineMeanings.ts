/**
 * 爻位角色与含义辅助
 * 六爻在不同位置的传统含义
 */

export interface LinePositionMeaning {
  position: 1 | 2 | 3 | 4 | 5 | 6
  name: string
  meaning: string
}

export const LINE_POSITION_MEANINGS: Record<number, LinePositionMeaning> = {
  1: { position: 1, name: '初爻', meaning: '事情的开始阶段，萌芽状态，宜观察、蓄力。' },
  2: { position: 2, name: '二爻', meaning: '事情初步发展，下卦中位；是否得正需结合该爻阴阳，宜稳步推进。' },
  3: { position: 3, name: '三爻', meaning: '事情下卦之极，多凶多惧，宜谨慎。' },
  4: { position: 4, name: '四爻', meaning: '事情上卦之初，近君之位，宜警惕。' },
  5: { position: 5, name: '五爻', meaning: '尊位，事之大成，上卦中位、常为主位；是否得正需结合该爻阴阳，宜把握时机。' },
  6: { position: 6, name: '上爻', meaning: '事情发展到极点，物极必反，宜知止。' }
}
