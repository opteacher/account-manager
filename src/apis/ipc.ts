import { notification } from 'ant-design-vue'

export interface IPCResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

export async function invokeIPC<T = any>(
  channel: string,
  ...args: any[]
): Promise<T> {
  const serializedArgs = args.map(arg => {
    if (typeof arg === 'object' && arg !== null && !Array.isArray(arg)) {
      return JSON.stringify(arg)
    }
    return arg
  })
  
  const response = await window.ipcRenderer.invoke(channel, ...serializedArgs) as IPCResponse<T>

  if (!response.success) {
    const errorMsg = response.error || '请求失败'
    notification.error({
      message: errorMsg,
      description: ''
    })
    throw new Error(errorMsg)
  }

  return response.data as T
}

export const getDftPjt = () => import.meta.env.VITE_PJT || 'login_platform'
