import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import MyLib from '@lib/index'
import '@lib/assets/main.css'
import './style.css'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import apis from '@/apis/index'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

createApp(App).use(router).use(Antd).use(MyLib).use(pinia).use(apis).mount('#app')
