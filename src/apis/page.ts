import { reqGet } from '@lib/utils'

export default {
  colcElements: (url: string, { width, height }: { width: number; height: number }) =>
    reqGet('page', 'element/s', {
      type: 'api',
      action: 'collect',
      axiosConfig: { params: { url, width: Math.round(width), height: Math.round(height) } }
    })
}
