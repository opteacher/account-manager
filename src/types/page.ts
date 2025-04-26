import { gnlCpy } from '@lib/utils'

export class Slot {
  key: number
  xpath: string
  itype: 'input' | 'select' | 'click'
  value: string
  valEnc: boolean

  constructor() {
    this.key = -1
    this.xpath = ''
    this.itype = 'input'
    this.value = ''
    this.valEnc = false
  }

  reset() {
    this.key = -1
    this.xpath = ''
    this.itype = 'input'
    this.value = ''
    this.valEnc = false
  }

  static copy(src: any, tgt?: Slot, force = false) {
    return gnlCpy(Slot, src, tgt, { force })
  }
}

export default class Page {
  key: number
  url: string
  name: string
  slots: Slot[]
  login: 'web' | 'ssh'

  constructor(init?: any) {
    this.key = -1
    this.url = ''
    this.name = ''
    this.slots = []
    this.login = 'web'
    if (init) {
      Page.copy(init, this)
    }
  }

  reset() {
    this.key = -1
    this.url = ''
    this.name = ''
    this.slots = []
    this.login = 'web'
  }

  static copy(src: any, tgt?: Page, force = false) {
    return gnlCpy(Page, src, tgt, {
      force,
      cpyMapper: {
        slots: Slot.copy
      }
    })
  }
}
