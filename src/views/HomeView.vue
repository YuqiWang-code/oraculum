<template>
  <div>
    <section class="hero">
      <span class="seal" style="margin:0 auto 10px">易</span>
      <div class="brand">今日<span class="sub">问卦</span></div>
      <div class="slogan">用古人的方式，陪你把心里的问题想一想</div>
      <div class="date-line">{{ today }}</div>
      <div class="date-line" v-if="term">{{ lunar }} · {{ term }}</div>
    </section>

    <button class="btn cinnabar" style="margin:14px 12px;width:calc(100% - 24px)" @click="go()">
      🏮 开始问卦
    </button>

    <h2 style="margin:8px 16px;font-size:16px;color:var(--ink-soft)">今天想了解什么？</h2>
    <div class="theme-grid">
      <button
        v-for="t in themes"
        :key="t.key"
        type="button"
        class="theme-card"
        @click="go(t.category)"
      >
        <div class="t-icon">{{ t.icon }}</div>
        <div class="t-title">{{ t.title }}</div>
        <div class="t-sub">{{ t.subtitle }}</div>
      </button>
    </div>

    <div class="theme-grid" style="grid-template-columns:1fr;margin:0 12px">
      <button type="button" class="theme-card wide" @click="$router.push('/knowledge')">
        <div class="t-icon">📚</div>
        <div class="t-body">
          <div class="t-title">传统文化探索</div>
          <div class="t-sub">翻翻六十四卦，看看古人怎么看事情</div>
        </div>
        <span class="muted">›</span>
      </button>
      <button type="button" class="theme-card wide" @click="$router.push('/fortune')">
        <div class="t-icon">🧭</div>
        <div class="t-body">
          <div class="t-title">人生阶段（八字）</div>
          <div class="t-sub">输入出生时间，看看传统怎么描述人生节奏</div>
        </div>
        <span class="muted">›</span>
      </button>
    </div>

    <details class="guofeng">
      <summary>最近问过</summary>
      <div class="details-body">
        <div v-if="!recent.length" class="muted">还没有记录，先问一卦试试。</div>
        <div
          v-for="r in recent"
          :key="r.id"
          class="recent-row"
          @click="$router.push('/result/' + r.id)"
        >
          <span :class="labelClass(r.label)">{{ r.label }}</span>
          <span class="recent-text">{{ r.hexagramName }} · {{ r.question }}</span>
        </div>
        <button v-if="recent.length" class="btn secondary small" @click="$router.push('/history')">查看全部历史</button>
      </div>
    </details>

    <details class="guofeng">
      <summary>今天的节气、月建等专业信息</summary>
      <div class="details-body">
        <div class="muted" v-if="term">节气：{{ term }}</div>
        <div class="muted">月建：{{ monthBranch }}，旬空：{{ xunkong.join('、') }}</div>
      </div>
    </details>

    <div class="card muted" style="line-height:1.8">
      这里是用传统文化帮你<strong>思考问题</strong>，不是预测未来、也不替你做决定。
      所有计算都在本机离线完成，不联网、不调用 AI。
      <div style="margin-top:8px">
        <button class="btn secondary small" @click="shareApp">分享给朋友</button>
        <button v-if="deferredPrompt" class="btn secondary small" @click="installApp">安装到手机</button>
        <button v-else-if="isIos && !isInstalled" class="btn secondary small" @click="iosTip = true">安装到手机</button>
      </div>
      <div v-if="iosTip" class="muted" style="margin-top:6px">在 Safari 里点底部分享按钮，选择「添加到主屏幕」。</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { listHistory } from '../db'
import type { HistoryRecord } from '../db/schema'
import { buildCalendarContext } from '../engine/calendar/calendarEngine'
import { FRIENDLY_THEMES } from '../local-data/plainInterpretation'
import { useAppStore } from '../stores/app'
import type { QuestionCategory } from '../types'

const router = useRouter()
const store = useAppStore()
const themes = FRIENDLY_THEMES
const today = ref('')
const lunar = ref('')
const term = ref('')
const monthBranch = ref('')
const xunkong = ref<string[]>([])
const recent = ref<HistoryRecord[]>([])
const iosTip = ref(false)

const deferredPrompt = ref<any>(null)
const isIos = ref(false)
const isInstalled = ref(false)

function go(category?: QuestionCategory) {
  if (category) router.push({ path: '/divination', query: { category } })
  else router.push('/divination')
}

function labelClass(l: string) {
  return l === '大吉' || l === '吉' ? 'label-good' : l === '大凶' || l === '凶' ? 'label-bad' : 'label-flat'
}

function handleBeforeInstallPrompt(e: Event) {
  e.preventDefault()
  deferredPrompt.value = e
}

function installApp() {
  if (deferredPrompt.value) {
    deferredPrompt.value.prompt()
    deferredPrompt.value.userChoice.then(() => { deferredPrompt.value = null })
  }
}

async function shareApp() {
  const shareData = {
    title: '今日问卦 · Oraculum',
    text: '一个纯本地、离线的传统文化问卦小工具',
    url: location.origin
  }
  const nav = navigator as Navigator & { share?: (d: unknown) => Promise<void> }
  if (nav.share) {
    try { await nav.share(shareData) } catch { /* 用户取消 */ }
  } else {
    try {
      await navigator.clipboard.writeText(location.origin)
      alert('链接已复制：' + location.origin)
    } catch {
      prompt('复制链接：', location.origin)
    }
  }
}

onMounted(async () => {
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  isIos.value = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream
  isInstalled.value =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true

  const tz = store.settings.timezone || 'Asia/Shanghai'
  const dbRule = store.settings.dayBoundaryRule || 'midnight'
  const cal = buildCalendarContext({ date: new Date(), timezone: tz, dayBoundaryRule: dbRule })
  today.value = new Intl.DateTimeFormat('zh-CN', {
    timeZone: tz,
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
  }).format(new Date())
  lunar.value = cal.lunarDate
  term.value = cal.solarTerm
  monthBranch.value = cal.monthBranch
  xunkong.value = cal.xunKong
  recent.value = await listHistory(3)
})

onUnmounted(() => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt))
</script>

<style scoped>
.recent-row { display: flex; gap: 8px; align-items: baseline; padding: 8px 0; border-bottom: 1px dashed var(--line); cursor: pointer; }
.recent-text { font-size: 14px; color: var(--ink-soft); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
