/** 从 DivinationRecord 只提取 AI 需要的最小快照（不含 alias/历史/设备信息） */
export function sanitizeRecord(rec: any): Record<string, unknown> {
  if (!rec) return {}
  const cal = rec.calendar || {}
  const cast = rec.castingEvidence?.[0] || {}
  const out: Record<string, unknown> = {
    question: rec.input?.question ?? '',
    category: rec.input?.category ?? '',
    casting: {
      ruleVersion: rec.castingRuleVersion ?? cast.ruleVersion,
      evidence: cast.explanation ? { explanation: cast.explanation } : undefined
    },
    calendar: {
      lunarDate: cal.lunarDate,
      yearGanzhi: cal.yearGanzhi,
      monthGanzhi: cal.monthGanzhi,
      dayGanzhi: cal.dayGanzhi,
      hourGanzhi: cal.hourGanzhi,
      solarTerm: cal.solarTerm,
      monthBranch: cal.monthBranch,
      xunKong: cal.xunKong
    },
    rating: rec.rating
      ? {
          score: rec.rating.score,
          label: rec.rating.label,
          consistency: rec.rating.consistency
        }
      : undefined,
    localInterpretation: rec.interpretation
      ? {
          summary: rec.interpretation.summary,
          favorable: rec.interpretation.favorable,
          constraints: rec.interpretation.constraints,
          trend: rec.interpretation.trend
        }
      : undefined
  }

  if (rec.meihua) {
    out.meihua = {
      ben: rec.meihua.ben?.name,
      hu: rec.meihua.hu?.name,
      bian: rec.meihua.bian?.name,
      movingLine: rec.meihua.movingLine,
      ti: rec.meihua.tiElement,
      yong: rec.meihua.yongElement,
      relation: rec.meihua.relation
    }
  }
  if (rec.liuyao) {
    out.liuyao = {
      hexagram: rec.liuyao.hexagram?.name,
      lines: rec.liuyao.lines?.map((l: any) => ({
        n: l.index,
        yinYang: l.yinYang,
        moving: l.moving,
        spirit: l.sixSpirit,
        branch: l.branch,
        relation: l.sixRelation,
        shi: l.isShi,
        ying: l.isYing
      }))
    }
  }
  // 主动剔除敏感字段
  delete out.querentAlias
  return out
}
