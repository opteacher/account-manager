import { gnlCpy } from '@lib/utils'
import Page from './page'

export default class Endpoint {
  key: number
  name: string
  icon: string
  login: 'web' | 'ssh'
  pages: (string | Page)[]

  constructor() {
    this.key = -1
    this.name = ''
    this.icon = ''
    this.login = 'web'
    this.pages = []
  }

  static copy(src: any, tgt?: Endpoint, force = false) {
    tgt = gnlCpy(Endpoint, src, tgt, { force, ignProps: ['pages'] })
    if (typeof src.pages === 'undefined') {
      tgt.pages = force ? [] : tgt.pages
    } else {
      tgt.pages = src.pages.map((page: any) =>
        typeof page === 'string' ? page : Page.copy(page)
      )
    }
    return tgt
  }

  async decodeSlots() {
    this.pages = await Promise.all(
      this.pages.map(page => (typeof page === 'string' ? page : page.decodeSlots()))
    )
    return this
  }
}
