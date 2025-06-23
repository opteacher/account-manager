import axios from 'axios'
import { App } from 'vue'
import VueAxios from 'vue-axios'

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

export default async (app: App<Element>) => {
  if (!import.meta.env.PROD) {
    axios.defaults.baseURL = undefined
    return
  }
  for (const url of [
    import.meta.env.VITE_HLW_URL,
    import.meta.env.VITE_GAW_URL,
    import.meta.env.VITE_GZW_URL
  ]) {
    try {
      await axios.get(url, { timeout: 1000 })
    } catch (e: any) {
      if (e.status) {
        axios.defaults.baseURL = e.config.url
        break
      }
    }
  }
  app.use(VueAxios, axios)
  app.provide('axios', app.config.globalProperties.axios)
}
