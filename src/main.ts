import { createApp } from 'vue'
import '@/styles/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import App from './App.vue'

import { createPinia } from 'pinia'
import { loadLibav } from './web-clip-sdk'
const pinia = createPinia()
const app = createApp(App)
app.use(pinia)
app.mount('#app')

await loadLibav()