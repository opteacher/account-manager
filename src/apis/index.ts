import useGlobalStore from '@/stores/global'
import axios from 'axios'
import { App } from 'vue'
import VueAxios from 'vue-axios'

axios.interceptors.request.use(
  function (config) {
    const token = `Bearer ${useGlobalStore().token}`
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

export async function detectNetwork(skipDev = true) {
  if (!import.meta.env.PROD && skipDev) {
    return
  }
  for (const url of [
    import.meta.env.VITE_HLW_URL,
    import.meta.env.VITE_GAW_URL,
    import.meta.env.VITE_GZW_URL
  ]) {
    try {
      await axios.get(`${url}/${import.meta.env.VITE_PJT}/mdl/v1`, { timeout: 1000 })
    } catch (e: any) {
      continue
    }
    return url
  }
}

export default async (app: App<Element>) => {
  axios.defaults.baseURL = await detectNetwork()
  app.use(VueAxios, axios)
  app.provide('axios', app.config.globalProperties.axios)
}
