import { gnlCpy } from '@lib/utils'
import Page from './page'

export default class Endpoint {
  key: number
  name: string
  icon: string
  login: 'web' | 'ssh'
  fkPages: (string | Page)[]

  constructor() {
    this.key = -1
    this.name = ''
    this.icon = ''
    this.login = 'web'
    this.fkPages = []
  }

  static copy(src: any, tgt?: Endpoint, force = false) {
    tgt = gnlCpy(Endpoint, src, tgt, { force, ignProps: ['fkPages'] })
    if (typeof src.fkPages === 'undefined') {
      tgt.fkPages = force ? [] : tgt.fkPages
    } else {
      tgt.fkPages = src.fkPages.map((page: any) =>
        typeof page === 'string' ? page : Page.copy(page)
      )
    }
    return tgt
  }

  async decodeSlots() {
    this.fkPages = await Promise.all(
      this.fkPages.map(page => (typeof page === 'string' ? page : page.decodeSlots()))
    )
    return this
  }
}
