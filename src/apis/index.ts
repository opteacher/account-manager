import { App } from 'vue'
import { invokeIPC } from './ipc'

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
      await invokeIPC('api:network:detect', url)
    } catch (e: any) {
      continue
    }
    return url
  }
}

export default async (app: App<Element>) => {
  await detectNetwork()
  app.provide('api', { detectNetwork })
}
