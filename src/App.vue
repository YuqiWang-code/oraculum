<template>
  <router-view v-slot="{ Component }">
    <keep-alive include="DivinationView">
      <component :is="Component" />
    </keep-alive>
  </router-view>
  <nav class="bottom">
    <router-link to="/">首页</router-link>
    <router-link to="/divination">问卦</router-link>
    <router-link to="/history">历史</router-link>
    <router-link to="/knowledge">知识</router-link>
    <router-link to="/settings">设置</router-link>
  </nav>
</template>

<script setup lang="ts">
// 设置已在 main.ts 的 bootstrap 中、挂载前通过 store.loadSettings() 加载，
// 此处不再重复调用，避免首次渲染与二次加载的竞态。
</script>
