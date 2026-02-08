import { invokeIPC } from './ipc'
import { message } from 'ant-design-vue'

export default {
  login: async (data: { username: string; password: string }) => {
    try {
      message.loading('登录中……')
      const result = await invokeIPC<{ record: any; sessionId: string; message: string }>('api:account:sign', ...Object.values(data))
      message.destroy()
      message.success('登录成功！')
      return result
    } catch (error: any) {
      message.destroy()
      message.error(`登录失败：${error.message}`)
      throw error
    }
  },

  register: async (data: { username: string; password: string }) => {
    try {
      message.loading('注册中……')
      const result = await invokeIPC<{ record: any; sessionId: string; message: string }>('api:account:register', ...Object.values(data))
      message.destroy()
      message.success('注册成功！')
      return result
    } catch (error: any) {
      message.destroy()
      message.error(`注册失败：${error.message}`)
      throw error
    }
  },

  verify: async () => {
    try {
      return await invokeIPC('api:account:verify')
    } catch (error: any) {
      throw error
    }
  },

  verifyDeep: async () => {
    try {
      return await invokeIPC('api:account:verify-deep')
    } catch (error: any) {
      throw error
    }
  }
}
