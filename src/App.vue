<template>
  <router-view />
  <nav class="bottom">
    <router-link to="/">首页</router-link>
    <router-link to="/divination">问卦</router-link>
    <router-link to="/history">历史</router-link>
    <router-link to="/knowledge">知识</router-link>
    <router-link to="/settings">设置</router-link>
  </nav>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAppStore } from './stores/app'
const store = useAppStore()
onMounted(() => store.loadSettings())
</script>
