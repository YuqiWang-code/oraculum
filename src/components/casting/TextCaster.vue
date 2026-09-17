<template>
  <div class="card">
    <h2>梅花 · 文字 <span class="tag">传统</span></h2>
    <div class="muted">使用"所问之事"或另写一句，数 11–100 个有效字。短字占涉及笔画/声调，本版不硬算。</div>
    <textarea v-model="text" rows="3" placeholder="请至少输入 11 个有效字"></textarea>
    <div class="muted">有效字数：{{ count }}（需 11–100）</div>
    <div v-if="count < 11" class="warn">字数不足：短字占涉及笔画/声调，当前版本未引入未核验笔画数据，请补足文字。</div>
    <button class="btn" :disabled="count < 11 || count > 100" @click="confirm">起卦</button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { normalizeText, countGraphemes } from '../../engine/casting/castByText'

const emit = defineEmits<{ (e: 'confirm', payload: { text: string }): void }>()
const props = defineProps<{ defaultText?: string }>()
const text = ref(props.defaultText || '')
const count = computed(() => countGraphemes(normalizeText(text.value)))
function confirm() { emit('confirm', { text: text.value }) }
</script>
