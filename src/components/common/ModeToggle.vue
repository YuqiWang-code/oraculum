<template>
  <div class="seg" role="tablist" aria-label="解读深度">
    <button
      type="button"
      role="tab"
      :class="mode === 'simple' ? 'on' : ''"
      aria-selected="true"
      @click="setMode('simple')"
    >🌱 简单看看</button>
    <button
      type="button"
      role="tab"
      :class="mode === 'research' ? 'on' : ''"
      :aria-selected="mode === 'research'"
      @click="setMode('research')"
    >📚 深入研究</button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '../../stores/app'

const store = useAppStore()
const mode = computed(() => store.settings.readingMode ?? 'simple')

function setMode(m: 'simple' | 'research') {
  store.updateSettings({ readingMode: m })
}
</script>
