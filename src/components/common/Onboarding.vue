<template>
  <Transition name="fade">
    <div v-if="visible" class="onb-mask" @click.self="finish">
      <div class="onb-card" role="dialog" aria-label="新手引导">
        <div class="onb-emoji">{{ slides[idx].icon }}</div>
        <div class="onb-title">{{ slides[idx].title }}</div>
        <div class="onb-text">{{ slides[idx].text }}</div>

        <div class="onb-dots">
          <span v-for="(s, i) in slides" :key="i" :class="['od', i === idx ? 'on' : '']" />
        </div>

        <button v-if="idx < slides.length - 1" class="btn cinnabar" @click="idx++">下一步</button>
        <button v-else class="btn cinnabar" @click="finish">开始使用</button>
        <button v-if="idx < slides.length - 1" class="btn secondary" @click="finish">先跳过</button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const STORAGE_KEY = 'oraculum_onboarding_v1'
const visible = ref(!localStorage.getItem(STORAGE_KEY))
const idx = ref(0)

const slides = [
  {
    icon: '🏮',
    title: '这里不是预测未来',
    text: '它是用《易经》这套古老的思考方式，陪你把心里的问题理一理。答案还是在你自己手里。'
  },
  {
    icon: '☯',
    title: '怎么用？三步',
    text: '先在心里想一个具体问题，再像古人一样摇六次铜钱得到一个卦，然后看看古人会从哪些角度提醒你。'
  },
  {
    icon: '🔒',
    title: '只在你的设备上运行',
    text: '所有起卦和解读都在本机完成，离线也能用，不联网、不调用 AI、不上传你的问题。'
  }
]

function finish() {
  visible.value = false
  localStorage.setItem(STORAGE_KEY, '1')
}
</script>
