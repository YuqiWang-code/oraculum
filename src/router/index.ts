import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'home', component: () => import('../views/HomeView.vue') },
  { path: '/divination', name: 'divination', component: () => import('../views/DivinationView.vue') },
  { path: '/fortune', name: 'fortune', component: () => import('../views/FortuneView.vue') },
  { path: '/result/:id', name: 'result', component: () => import('../views/ResultView.vue') },
  { path: '/history', name: 'history', component: () => import('../views/HistoryView.vue') },
  { path: '/knowledge', name: 'knowledge', component: () => import('../views/KnowledgeView.vue') },
  { path: '/settings', name: 'settings', component: () => import('../views/SettingsView.vue') },
  { path: '/about', name: 'about', component: () => import('../views/AboutView.vue') }
]

export const router = createRouter({
  history: createWebHistory(),
  routes
})
