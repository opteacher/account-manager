import Endpoint from './endpoint'
import Page from './page'

export const copies = {
  endpoint: Endpoint.copy,
  page: Page.copy
} as Record<string, (src: any, tgt?: any) => any>
