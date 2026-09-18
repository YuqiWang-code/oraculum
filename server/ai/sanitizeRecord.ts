/**
 * 从 DivinationRecord 只提取 AI 需要的最小快照。
 * v3.1 扩充：加入 rating.evidence、卦辞、动爻辞、六爻用神等必要证据。
 * 不含 alias / 历史全库 / 设备信息。
 */
export function sanitizeRecord(rec: Record<string, unknown> | null | undefined): Record<string, unknown> {
  if (!rec) return {}
  const cal = (rec.calendar || {}) as Record<string, unknown>
  const cast = Array.isArray(rec.castingEvidence) ? (rec.castingEvidence[0] || {}) as Record<string, unknown> : {}
  const rating = (rec.rating || {}) as Record<string, unknown>
  const meihua = (rec.meihua || {}) as Record<string, unknown>
  const liuyao = (rec.liuyao || {}) as Record<string, unknown>

  const out: Record<string, unknown> = {
    question: String((rec.input as Record<string, unknown>)?.question || ''),
    category: String((rec.input as Record<string, unknown>)?.category || ''),
    casting: {
      ruleVersion: String(rec.castingRuleVersion || cast.ruleVersion || ''),
      explanation: String(cast.explanation || '')
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
    rating: rating.score !== undefined ? {
      score: rating.score,
      label: rating.label,
      consistency: rating.consistency,
      evidence: Array.isArray(rating.evidence) ? rating.evidence.map((e: Record<string, unknown>) => ({
        id: e.id, title: e.title, delta: e.delta, reason: e.reason, sourceRule: e.sourceRule
      })) : []
    } : undefined,
    localInterpretation: rec.interpretation ? {
      summary: (rec.interpretation as Record<string, unknown>).summary,
      favorable: (rec.interpretation as Record<string, unknown>).favorable,
      constraints: (rec.interpretation as Record<string, unknown>).constraints,
      trend: (rec.interpretation as Record<string, unknown>).trend
    } : undefined
  }

  if (rec.meihua) {
    const ben = (meihua.ben || {}) as Record<string, unknown>
    const bian = (meihua.bian || {}) as Record<string, unknown>
    out.meihua = {
      ben: ben.name,
      benKeywords: ben.editorialKeywords,
      benJudgmentClassic: ben.judgmentClassic || '',
      movingLine: meihua.movingLine,
      movingLineClassicText: (meihua.movingIndex0 !== undefined && Array.isArray(ben.lineTextsClassic))
        ? (ben.lineTextsClassic as string[])[meihua.movingIndex0 as number] || ''
        : '',
      hu: (meihua.hu as Record<string, unknown>)?.name,
      bian: bian.name,
      bianKeywords: bian.editorialKeywords,
      ti: meihua.tiElement,
      yong: meihua.yongElement,
      relation: meihua.relation
    }
  }
  if (rec.liuyao) {
    out.liuyao = {
      hexagram: (liuyao.hexagram as Record<string, unknown>)?.name,
      usefulGodReason: rec.usefulGodReason,
      lines: Array.isArray(liuyao.lines) ? liuyao.lines.map((l: Record<string, unknown>) => ({
        n: l.index,
        yinYang: l.yinYang,
        moving: l.moving,
        branch: l.branch,
        element: l.branchElement,
        relation: l.sixRelation,
        spirit: l.sixSpirit,
        isShi: l.isShi,
        isYing: l.isYing,
        hidden: l.hidden,
        changedBranch: l.changedBranch
      })) : []
    }
  }
  // 主动剔除敏感字段
  delete out.querentAlias
  delete out.gender
  return out
}
