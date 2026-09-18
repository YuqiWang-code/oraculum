/**
 * 八卦象义（用于体用五行解释）
 */

import type { TrigramName, Element } from '../../types'

export interface TrigramMeaning {
  name: TrigramName
  element: Element
  nature: string
  asBody: string
  asUse: string
}

export const TRIGRAM_MEANINGS: Record<TrigramName, TrigramMeaning> = {
  乾: { name: '乾', element: '金', nature: '刚健、创始、主动', asBody: '主体刚健有为，有领导力', asUse: '所问之事刚健有力，需主动推进' },
  兑: { name: '兑', element: '金', nature: '喜悦、交流、口舌', asBody: '主体和悦，善于沟通', asUse: '所问之事与交流、口舌、关系有关' },
  离: { name: '离', element: '火', nature: '光明、依附、显现', asBody: '主体明察，有文采', asUse: '所问之事需依附光明、明辨是非' },
  震: { name: '震', element: '木', nature: '震动、启动、奋发', asBody: '主体奋发有为，行动力强', asUse: '所问之事有变动、启动之象' },
  巽: { name: '巽', element: '木', nature: '谦逊、渗透、进入', asBody: '主体谦逊灵活，善于渗透', asUse: '所问之事需顺势而入、灵活应对' },
  坎: { name: '坎', element: '水', nature: '险陷、流动、智慧', asBody: '主体面临险陷，需智慧应对', asUse: '所问之事有险陷、流动之象' },
  艮: { name: '艮', element: '土', nature: '停止、静止、边界', asBody: '主体宜止不宜动，守定为上', asUse: '所问之事宜止不宜进，需等待时机' },
  坤: { name: '坤', element: '土', nature: '柔顺、承载、包容', asBody: '主体柔顺包容，善于承载', asUse: '所问之事需配合、承载、顺势' }
}
