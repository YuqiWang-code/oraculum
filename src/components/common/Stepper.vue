<template>
  <div class="stepper" :aria-label="'进度：' + steps[current]">
    <template v-for="(s, i) in steps" :key="s">
      <div :class="['step', i === current ? 'active' : i < current ? 'done' : '']">
        <div class="dot">
          <span v-if="i < current">✓</span>
          <span v-else>{{ i + 1 }}</span>
        </div>
        <div class="s-label">{{ s }}</div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  steps: string[]
  current: number
}>()
</script>
