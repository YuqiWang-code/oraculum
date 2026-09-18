import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { DivinationRecord } from '../engine/orchestrator'
import type { Settings } from '../db/schema'
import { getSettings, saveSettings } from '../db'

export const useAppStore = defineStore('app', () => {
  const lastResult = ref<DivinationRecord | null>(null)
  const settings = ref<Settings>({
    timezone: 'Asia/Shanghai',
    useShenshaInScore: true,
    showLunarDetail: true,
    dayBoundaryRule: 'midnight'
  })

  async function loadSettings() {
    settings.value = await getSettings()
  }
  async function updateSettings(patch: Partial<Settings>) {
    settings.value = { ...settings.value, ...patch }
    await saveSettings(settings.value)
  }

  return { lastResult, settings, loadSettings, updateSettings }
})
