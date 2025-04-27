import Page from './page'

export const copies = {
  page: Page.copy
} as Record<string, (src: any, tgt?: any) => any>
