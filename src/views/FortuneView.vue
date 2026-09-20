<template>
  <h1>运势</h1>

  <div v-if="fortuneError" class="card error-card">
    <h2>计算失败</h2>
    <p class="muted">{{ fortuneError }}</p>
  </div>

  <!-- 出生资料输入 -->
  <BirthInputCard ref="inputCardRef" @compute="onCompute" />

  <!-- 本地出生档案 -->
  <div class="card" v-if="localProfiles.length">
    <h2>本地出生档案</h2>
    <p class="muted" style="margin-top:0">存在本机 IndexedDB，不上云。点击"使用"填充表单。</p>
    <div class="profile-list">
      <div v-for="p in localProfiles" :key="p.id" class="profile-row">
        <div class="profile-meta">
          <strong>{{ profileLabel(p) }}</strong>
          <span class="muted">{{ profileDesc(p) }}</span>
        </div>
        <div class="profile-actions">
          <button class="btn small" @click="useProfile(p)">使用</button>
          <button class="btn small ghost" @click="renameProfile(p)">重命名</button>
          <button class="btn small ghost danger" @click="removeProfile(p)">删除</button>
        </div>
      </div>
    </div>
  </div>

  <!-- 八字概览 -->
  <BaziOverviewCard v-if="overview" :overview="overview" />

  <!-- 大运时间轴 -->
  <DaYunTimeline
    v-if="showDaYun"
    :entries="daYun"
    :analyses="daYunAnalyses"
  />

  <!-- 流年列表 -->
  <LiuNianList
    v-if="showDaYun"
    :entries="liuNian"
    @decade="onRequestDecade"
  />

  <!-- 京房十六变研究层 -->
  <JingFang16Card
    v-if="profile"
    :profile="profile"
  />

  <!-- 免责声明 -->
  <FortuneDisclaimer />
</template>

<script setup lang="ts">
import { ref, shallowRef, computed } from 'vue'
import BirthInputCard from '../components/fortune/BirthInputCard.vue'
import BaziOverviewCard from '../components/fortune/BaziOverviewCard.vue'
import DaYunTimeline from '../components/fortune/DaYunTimeline.vue'
import LiuNianList from '../components/fortune/LiuNianList.vue'
import JingFang16Card from '../components/fortune/JingFang16Card.vue'
import FortuneDisclaimer from '../components/fortune/FortuneDisclaimer.vue'
import {
  computeBaziOverview,
  computeDaYun,
  computeLiuNian,
  validateBirthProfile,
  analyzeDaYun,
  analyzeLiuNian,
  type BirthProfile,
  type BaziOverview,
  type DaYunEntry,
  type LiuNianEntry,
  type DaYunAnalysis,
  type LiuNianAnalysis
} from '../engine/fortune'
import {
  saveFortuneProfile,
  listFortuneProfiles,
  deleteFortuneProfile,
  type FortuneProfileRecord
} from '../db'

const profile = ref<BirthProfile | null>(null)
const overview = ref<BaziOverview | null>(null)
const daYun = ref<DaYunEntry[]>([])
const daYunAnalyses = ref<DaYunAnalysis[]>([])
// 大数组用 shallowRef
const liuNian = shallowRef<LiuNianEntry[]>([])
const liuNianAnalyses = ref<LiuNianAnalysis[]>([])
const fortuneError = ref('')

/** 流年已计算到的最大年龄（默认 0-29，按需扩展） */
const liuNianMaxAge = ref(29)

const inputCardRef = ref<InstanceType<typeof BirthInputCard> | null>(null)

/** 本地档案 */
const localProfiles = ref<FortuneProfileRecord[]>([])

async function refreshLocalProfiles() {
  try {
    localProfiles.value = await listFortuneProfiles(50)
  } catch {
    localProfiles.value = []
  }
}
refreshLocalProfiles()

const showDaYun = computed(
  () =>
    !!profile.value &&
    profile.value.precision === 'exact_time' &&
    profile.value.traditionalGenderParam !== 'unspecified'
)

function computeDaYunAndAnalysis(p: BirthProfile) {
  const dy = computeDaYun(p, 14)
  daYun.value = dy
  daYunAnalyses.value = analyzeDaYun(p, dy)
}

function computeLiuNianRange(p: BirthProfile, maxAge: number) {
  const entries = computeLiuNian(p, [0, maxAge])
  liuNian.value = entries
  liuNianAnalyses.value = analyzeLiuNian(p, entries)
}

async function onCompute(p: BirthProfile) {
  fortuneError.value = ''
  profile.value = p

  // 先校验
  const v = validateBirthProfile(p)
  if (!v.ok) {
    fortuneError.value = v.message
    overview.value = null
    daYun.value = []
    daYunAnalyses.value = []
    liuNian.value = []
    liuNianAnalyses.value = []
    return
  }

  try {
    overview.value = computeBaziOverview(p)
  } catch (e) {
    overview.value = null
    fortuneError.value = e instanceof Error ? e.message : String(e)
    return
  }

  if (p.precision === 'exact_time' && p.traditionalGenderParam !== 'unspecified') {
    try {
      liuNianMaxAge.value = 29
      computeDaYunAndAnalysis(p)
      computeLiuNianRange(p, liuNianMaxAge.value)
    } catch (e) {
      daYun.value = []
      daYunAnalyses.value = []
      liuNian.value = []
      liuNianAnalyses.value = []
      fortuneError.value = e instanceof Error ? e.message : String(e)
    }
  } else {
    daYun.value = []
    daYunAnalyses.value = []
    liuNian.value = []
    liuNianAnalyses.value = []
  }

  // 保存本地档案
  if (p.saveLocally) {
    try {
      const rec: FortuneProfileRecord = {
        ...p,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: new Date().toISOString(),
        label: profileLabel(p)
      }
      await saveFortuneProfile(rec)
      await refreshLocalProfiles()
    } catch {
      // 保存失败不阻断主流程
    }
  }
}

/** 用户请求查看某个十年页：若尚未计算则扩展范围 */
function onRequestDecade(decadeStart: number) {
  const p = profile.value
  if (!p) return
  const needMax = decadeStart + 9
  if (needMax > liuNianMaxAge.value) {
    liuNianMaxAge.value = needMax
    try {
      computeLiuNianRange(p, liuNianMaxAge.value)
    } catch {
      // 忽略扩展失败
    }
  }
}

function profileLabel(p: BirthProfile): string {
  const cal = p.calendarType === 'lunar' ? '农历' : '公历'
  const leap = p.calendarType === 'lunar' && p.lunarLeapMonth ? '闰' : ''
  return `${cal}${p.year}年${leap}${p.month}月`
}

function profileDesc(p: BirthProfile): string {
  const parts: string[] = []
  if (p.day != null) parts.push(`${p.day}日`)
  if (p.hour != null) parts.push(`${String(p.hour).padStart(2, '0')}时`)
  if (p.minute != null) parts.push(`${String(p.minute).padStart(2, '0')}分`)
  parts.push(p.traditionalGenderParam === 'male' ? '男' : p.traditionalGenderParam === 'female' ? '女' : '未指定性别')
  return parts.join(' ')
}

function useProfile(p: FortuneProfileRecord) {
  if (inputCardRef.value && typeof (inputCardRef.value as unknown as { fillFromProfile: (x: BirthProfile) => void }).fillFromProfile === 'function') {
    (inputCardRef.value as unknown as { fillFromProfile: (x: BirthProfile) => void }).fillFromProfile(p)
  }
}

async function renameProfile(p: FortuneProfileRecord) {
  const name = window.prompt('给这份档案起个名字：', p.label ?? profileLabel(p))
  if (name == null) return
  try {
    await saveFortuneProfile({ ...p, label: name })
    await refreshLocalProfiles()
  } catch {
    fortuneError.value = '重命名失败。'
  }
}

async function removeProfile(p: FortuneProfileRecord) {
  if (!window.confirm(`确定删除这份档案（${profileLabel(p)}）？`)) return
  try {
    await deleteFortuneProfile(p.id)
    await refreshLocalProfiles()
  } catch {
    fortuneError.value = '删除失败。'
  }
}
</script>

<style scoped>
.error-card {
  border-color: var(--bad);
  background: rgba(176, 60, 60, 0.06);
}
.error-card h2 { margin-top: 0; }
.profile-list { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
.profile-row {
  display: flex; justify-content: space-between; align-items: center;
  border: 1px solid var(--line); border-radius: 10px;
  padding: 8px 12px; background: var(--bg);
  flex-wrap: wrap; gap: 8px;
}
.profile-meta { display: flex; flex-direction: column; gap: 2px; }
.profile-actions { display: flex; gap: 6px; }
.btn.small { font-size: 14px; padding: 5px 10px; }
.btn.ghost { background: transparent; }
.btn.danger { color: var(--bad); }
</style>
