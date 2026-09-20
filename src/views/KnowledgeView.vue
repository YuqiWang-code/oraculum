<template>
  <div>
    <h1>知识库</h1>
    <div class="card">
      <input v-model="kw" placeholder="搜索卦名/卦辞/关键词…" />
    </div>

    <!-- 运势知识专题 -->
    <div class="card">
      <h2>运势知识专题</h2>
      <div v-for="topic in fortuneTopics" :key="topic.title" style="margin:10px 0;padding:8px 0;border-bottom:1px dashed var(--line)">
        <div style="font-weight:600;margin-bottom:4px">{{ topic.title }}</div>
        <div class="muted" style="font-size:13px;line-height:1.7">
          <div><b>原典来源：</b>{{ topic.originalSource }}</div>
          <div><b>后世扩展：</b>{{ topic.laterExtension }}</div>
          <div><b>项目规范：</b>{{ topic.oraculumRule }}</div>
        </div>
      </div>
    </div>

    <!-- 八卦 -->
    <div class="card">
      <h2>八卦</h2>
      <div v-for="t in trigramList" :key="t.name" class="muted" style="margin:4px 0">
        {{ t.name }}：先天数{{ t.xiantianNumber }}，{{ t.element }}，象：{{ t.images.join('、') }}
      </div>
    </div>

    <!-- 六十四卦（可展开） -->
    <div
      v-for="h in filteredHexagrams"
      :key="h.kingWen"
      class="card"
    >
      <div
        @click="toggle(h.kingWen)"
        style="cursor:pointer;display:flex;justify-content:space-between;align-items:center"
      >
        <span>
          {{ h.kingWen }}. {{ h.unicode }} {{ h.name }}
          <span class="muted" style="font-size:12px">（上{{ h.upper }}下{{ h.lower }}）</span>
        </span>
        <span class="muted">{{ expanded === h.kingWen ? '▲' : '▼' }}</span>
      </div>

      <div v-if="expanded === h.kingWen" style="margin-top:12px">
        <!-- 有完整本地知识 -->
        <template v-if="detailedMap[h.kingWen]">
          <!-- 卦辞 -->
          <div class="muted" style="margin-top:8px">卦辞</div>
          <div style="white-space:pre-wrap">{{ detailedMap[h.kingWen].classic.judgment }}</div>

          <!-- 彖传 -->
          <div class="muted" style="margin-top:10px">彖传</div>
          <div style="white-space:pre-wrap">{{ detailedMap[h.kingWen].classic.tuan }}</div>

          <!-- 大象传 -->
          <div class="muted" style="margin-top:10px">大象传</div>
          <div style="white-space:pre-wrap">{{ detailedMap[h.kingWen].classic.daXiang }}</div>

          <!-- 六爻：爻辞 + 小象 -->
          <div v-for="line in detailedMap[h.kingWen].lines" :key="line.index" style="margin-top:10px">
            <div class="muted">第{{ line.index }}爻</div>
            <div style="white-space:pre-wrap">{{ line.classicText }}</div>
            <div class="muted" style="font-size:12px;margin-top:2px">
              小象：{{ line.xiaoXiang }}
            </div>
          </div>

          <!-- Oraculum 现代释义 -->
          <div style="margin-top:14px;padding-top:10px;border-top:1px dashed var(--line)">
            <div class="muted">Oraculum 现代释义（非古籍原文）</div>
            <div style="margin-top:4px">{{ detailedMap[h.kingWen].localMeaning.coreMeaning }}</div>
            <div style="margin-top:4px" class="muted">
              白话卦辞：{{ detailedMap[h.kingWen].localMeaning.plainJudgment }}
            </div>
            <div style="margin-top:4px" class="muted">
              作为本卦：{{ detailedMap[h.kingWen].localMeaning.asBaseHexagram }}
            </div>
            <div style="margin-top:4px" class="muted">
              主题：{{ detailedMap[h.kingWen].localMeaning.keyThemes.join('、') }}
            </div>
          </div>

          <!-- 来源 -->
          <div class="muted" style="margin-top:10px;font-size:11px">
            来源：{{ detailedMap[h.kingWen].classic.sourceRefs.join('；') }}
          </div>
        </template>

        <!-- 降级：无完整知识时展示基础信息 -->
        <template v-else>
          <div class="muted" style="margin-top:8px">
            关键词：{{ h.editorialKeywords.join('、') }} 宫：{{ h.palace }}
          </div>
          <div v-if="h.judgmentClassic" style="margin-top:6px;white-space:pre-wrap">
            卦辞：{{ h.judgmentClassic }}
          </div>
          <div class="muted" style="margin-top:6px">
            （此卦的完整 Oraculum 现代释义尚在整理中）
          </div>
        </template>
      </div>
    </div>

    <!-- 规则与版本 -->
    <div class="card">
      <h2>规则与版本</h2>
      <div class="muted" v-for="item in rulesInfo" :key="item" style="margin:2px 0">{{ item }}</div>
    </div>

    <div class="card muted">
      所有经典原文均来自维基文库《周易》与中国哲学书电子化计划（CText），逐条核验并标注来源。
      Oraculum 现代释义为本地确定性解读，不冒充古籍原文。
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue'
import { HEXAGRAMS } from '../data/hexagrams'
import { TRIGRAMS } from '../data/trigrams'
import { RULESET_VERSION, DATASET_VERSION, APP_VERSION, LOCAL_KNOWLEDGE_VERSION } from '../types'
import { FORTUNE_RULESET_VERSION, FORTUNE_DATASET_VERSION } from '../engine/fortune'
import { getHexagramKnowledge, loadElderFriendlyBatch } from '../local-data'
import type { LocalHexagramKnowledge } from '../local-data'
import { LIGHT_HEXAGRAMS } from '../local-data/light'

const kw = ref('')

/** 当前展开的卦（按 kingWen） */
const expanded = ref<number | null>(null)

/**
 * 已展开卦的完整知识映射（按需填充，禁止首屏构造全部 64 个大对象）。
 * 完整古文/白话来自静态 local-data；长辈友好白话按批次异步加载后再注入。
 */
const detailedMap = shallowRef<Record<number, LocalHexagramKnowledge>>({})
const detailLoading = ref<number | null>(null)

async function toggle(kingWen: number) {
  if (expanded.value === kingWen) {
    expanded.value = null
    return
  }
  expanded.value = kingWen
  // 首屏只构造轻量索引；展开某卦时才取该卦完整知识
  if (!detailedMap.value[kingWen]) {
    const k = getHexagramKnowledge(kingWen)
    if (k) {
      detailedMap.value = { ...detailedMap.value, [kingWen]: k }
    }
  }
  // 长辈友好白话按需加载（纯本地静态资源，离线可用）
  detailLoading.value = kingWen
  try {
    await loadElderFriendlyBatch(kingWen)
  } finally {
    detailLoading.value = null
  }
}

/** 八卦列表 */
const trigramList = computed(() =>
  Object.values(TRIGRAMS).map((t) => ({
    name: t.name,
    xiantianNumber: t.xiantianNumber,
    element: t.element,
    images: t.images
  }))
)

/**
 * 搜索过滤：首屏只用轻量索引（卦名/主题词/爻关键词）+ HEXAGRAMS 静态字段。
 * 不触发全部 64 个完整知识对象的构造。
 */
const filteredHexagrams = computed(() => {
  if (!kw.value) return HEXAGRAMS
  const q = kw.value
  const lightHits = new Set(
    Object.values(LIGHT_HEXAGRAMS)
      .filter(
        (h) =>
          h.name.includes(q) ||
          h.theme.includes(q) ||
          h.themes.some((t) => t.includes(q)) ||
          h.core.includes(q) ||
          h.lines.some((l) => l.themeKeyword.includes(q) || l.core.includes(q))
      )
      .map((h) => h.kingWen)
  )
  return HEXAGRAMS.filter((h) => {
    if (h.name.includes(q)) return true
    if (h.editorialKeywords.some((k) => k.includes(q))) return true
    if (h.judgmentClassic && h.judgmentClassic.includes(q)) return true
    if (lightHits.has(h.kingWen)) return true
    return false
  })
})

const rulesInfo = [
  `Oraculum v${APP_VERSION}（纯本地确定性解读，不调用大模型）`,
  `规则版本：RULESET v${RULESET_VERSION} / DATASET v${DATASET_VERSION} / LOCAL_KNOWLEDGE v${LOCAL_KNOWLEDGE_VERSION}`,
  `运势版本：FORTUNE_RULESET v${FORTUNE_RULESET_VERSION} / FORTUNE_DATASET v${FORTUNE_DATASET_VERSION}`,
  '梅花时间起卦：meihua_time_v1 / meihua_time_second_v2',
  '六爻纳甲/八宫/世应：v1（资料第6节）',
  '六源合参：six_source_hybrid_v1（本项目实验规则）',
  '神煞为低权重辅助，不单独定吉凶'
]

/** 运势知识专题 */
const fortuneTopics = [
  {
    title: '京房八宫',
    originalSource: '汉代《京氏易传》，核心包括本宫、一世至五世、游魂、归魂八个基本阶段，配以纳甲、纳支、飞伏、阴阳五行。',
    laterExtension: '后世卜筮书在八宫基础上扩展应用，但核心阶段名称和结构源自京房。',
    oraculumRule: '八宫数据用于六爻排盘和十六变研究层，标注来源为 jingfang-eight-palace。参考：《京氏易传》ctext.org、维基文库。'
  },
  {
    title: '《易隐》十六变',
    originalSource: '京房八宫核心阶段（本宫、一世~五世、游魂、归魂）出自《京氏易传》。',
    laterExtension: '外戒、内戒、绝命、血脉、肌肉、骸骨、棺椁、冢墓出自后世《易隐》，书中托称"京房曰"，不应与汉代原典完全等同。翻爻序列 [1,2,3,4,5,4,3,2,1,2,3,4,5,4,3,2]。',
    oraculumRule: '十六变为结构研究层，不自动映射年龄，不预测死亡。"绝命/棺椁/冢墓"为历史术语，不表示现实死亡。标注来源分层：jingfang-eight-palace / yiyin-sixteen-extension。'
  },
  {
    title: '八字 / 大运 / 流年',
    originalSource: '传统子平八字体系，以出生年月日时的天干地支排列四柱，结合五行生克、十神、大运流年分析。',
    laterExtension: '后世发展出多种流派和起运方法，存在差异。大运顺逆通常按阳男阴女顺行、阴男阳女逆行。',
    oraculumRule: '使用 lunar-javascript 计算，gender code: male=1, female=0。输入精度诚实：只有年月→二柱，年月日→三柱（时柱未知），完整→四柱+大运+流年。unspecified 不计算传统精确大运。不输出伪精确命运分。'
  },
  {
    title: '《易隐》身命三限',
    originalSource: '《易隐·身命占》提出正卦管30年、变卦管30年、互卦管30年、每爻5年的限运框架。',
    laterExtension: '具体起限方法、阴阳顺逆、乾坤特殊处理、小限计算在后世版本中有争议，未形成统一共识。',
    oraculumRule: 'v1 仅作为研究模式框架，需要专门"身命卦"才可开启。起限、顺逆、小限等子规则尚未逐条核清，显示"该子规则尚未实现"，不用不明来源二手公式补齐。'
  }
]
</script>
