<template>
  <span class="term-wrap">
    <span class="term">
      <slot>{{ display }}</slot>
      <button
        type="button"
        class="term-help-btn"
        :aria-label="`${display}是什么意思`"
        @click.stop="open = !open"
      >？</button>
    </span>
    <Transition name="fade">
      <span v-if="open" class="term-pop" @click.stop>
        {{ depth === 'research' && info?.simple ? info.simple : (info?.elder || info?.simple) }}
        <template v-if="depth === 'research' && info?.detail">
          <span class="tp-pro">专业说法：{{ term }} —— {{ info.detail }}</span>
        </template>
      </span>
    </Transition>
  </span>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { getTermPlain } from '../../local-data/plainInterpretation'

const props = withDefaults(defineProps<{
  term: string
  label?: string
  /** simple=长辈大白话；research=普通解释+专业背景 */
  depth?: 'simple' | 'research'
}>(), { depth: 'simple' })

const open = ref(false)
const display = computed(() => props.label ?? props.term)
const info = computed(() => getTermPlain(props.term))
</script>

<style scoped>
.term-wrap { position: relative; display: inline; }
.term-pop {
  position: absolute; left: 0; top: calc(100% + 6px); z-index: 20;
  width: 240px; max-width: 78vw; display: block; text-align: left;
}
</style>
