import { invokeIPC } from './ipc'

export default {
  colcElements: async (
    param: string | [number, number],
    { width, height }: { width: number; height: number }
  ) => {
    const params = {
      url: typeof param === 'string' ? param : undefined,
      endpoint: Array.isArray(param) && param.length === 2 ? param.join('_') : undefined,
      width: Math.round(width),
      height: Math.round(height)
    }
    return await invokeIPC('api:page:colcElements', params)
  }
}
