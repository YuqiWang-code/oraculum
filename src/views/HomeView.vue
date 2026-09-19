<template>
  <div>
    <h1>智能推理与预测</h1>

    <div class="card">
      <div class="muted">今日</div>
      <div style="font-size:18px">{{ today }}</div>
      <div class="muted" v-if="term">节气：{{ term }} 月建：{{ monthBranch }} 旬空：{{ xunkong.join('、') }}</div>
      <div class="muted">{{ lunar }}</div>
    </div>

    <button class="btn" @click="$router.push('/divination')">开始问卦</button>
    <button class="btn secondary" @click="$router.push('/knowledge')">资料库</button>

    <div class="card" v-if="recent.length">
      <h2>最近问卦</h2>
      <div v-for="r in recent" :key="r.id" class="muted" style="margin:6px 0" @click="$router.push('/history')">
        <span :class="labelClass(r.label)">{{ r.label }}</span>
        {{ r.hexagramName }} · {{ r.question }}
      </div>
    </div>

    <div class="card" v-if="!isInstalled && (deferredPrompt || isIos)">
      <h2>安装到手机</h2>
      <button v-if="deferredPrompt" class="btn" @click="installApp">安装应用</button>
      <div v-else-if="isIos" class="muted">请在 Safari 中打开，点击分享 → 添加到主屏幕</div>
    </div>

    <button class="btn secondary" @click="shareApp">分享应用</button>

    <div class="card muted">
      本应用用于传统文化研究、娱乐与自我反思，不代表客观事实或未来必然结果。
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { listHistory } from '../db'
import type { HistoryRecord } from '../db/schema'
import { buildCalendarContext } from '../engine/calendar/calendarEngine'
import { useAppStore } from '../stores/app'

const store = useAppStore()
const today = ref('')
const lunar = ref('')
const term = ref('')
const monthBranch = ref('')
const xunkong = ref<string[]>([])
const recent = ref<HistoryRecord[]>([])

const deferredPrompt = ref<any>(null)
const isIos = ref(false)
const isInstalled = ref(false)

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
    title: 'Oraculum',
    text: '纯本地离线传统文化问卦工具',
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
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date())
  lunar.value = cal.lunarDate
  term.value = cal.solarTerm
  monthBranch.value = cal.monthBranch
  xunkong.value = cal.xunKong
  recent.value = await listHistory(3)
})

onUnmounted(() => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt))
</script>
