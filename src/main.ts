import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import MyLib from '@lib/index'
import './style.css'
import { createPinia } from 'pinia'
import axios from 'axios'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

axios.interceptors.request.use(
  function (config) {
    const token = `Bearer ${localStorage.getItem('token')}`
    if (token) {
      config.headers.setAuthorization(token)
    }
    return config
  },
  function (error) {
    // 对请求错误做些什么
    return Promise.reject(error)
  }
)

axios.defaults.baseURL = import.meta.env.PROD ? 'http://192.168.1.11:4009' : undefined

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

createApp(App).use(router).use(Antd).use(MyLib).use(pinia).mount('#app')
