import { gnlCpy } from '@lib/utils'
import Page from './page'

export default class Endpoint {
  key: number
  name: string
  icon: string
  login: 'web' | 'ssh'
  pages: Page[]

  constructor() {
    this.key = -1
    this.name = ''
    this.icon = ''
    this.login = 'web'
    this.pages = []
  }

  static copy(src: any, tgt?: Endpoint, force = false) {
    return gnlCpy(Endpoint, src, tgt, { force, cpyMapper: { pages: Page.copy } })
  }

  async decodeSlots() {
    this.pages = await Promise.all(
      this.pages.map(page => (typeof page === 'string' ? page : page.decodeSlots()))
    )
    return this
  }
}
