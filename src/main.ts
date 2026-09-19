import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import { useAppStore } from './stores/app'
import './styles.css'

async function bootstrap() {
  const app = createApp(App)
  const pinia = createPinia()
  app.use(pinia)
  // 在挂载前先加载设置，避免首次渲染使用默认值（启动竞态）
  const store = useAppStore()
  await store.loadSettings()
  app.use(router)
  app.mount('#app')
}

bootstrap()
