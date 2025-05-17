import { reqGet } from '@lib/utils'

export default {
  colcElements: (
    param: string | [number, number],
    { width, height }: { width: number; height: number }
  ) =>
    reqGet('page', 'element/s', {
      type: 'api',
      action: 'collect',
      axiosConfig: {
        params: {
          url: typeof param === 'string' ? param : undefined,
          endpoint: Array.isArray(param) && param.length === 2 ? param.join('_') : undefined,
          width: Math.round(width),
          height: Math.round(height)
        }
      }
    })
}
