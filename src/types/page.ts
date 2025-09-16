import { gnlCpy } from '@lib/utils'

export const itypes = {
  input: '输入',
  select: '选择',
  click: '点击'
}

export class Slot {
  key: number
  xpath: string
  itype: keyof typeof itypes
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
  slots: Slot[]

  constructor() {
    this.key = -1
    this.url = ''
    this.slots = []
  }

  reset() {
    this.key = -1
    this.url = ''
    this.slots = []
  }

  static copy(src: any, tgt?: Page, force = false) {
    return gnlCpy(Page, src, tgt, {
      force,
      cpyMapper: {
        slots: Slot.copy
      }
    })
  }

  async decodeSlots() {
    this.slots = await Promise.all(
      this.slots.map(async (slot: any) => {
        if (slot.valEnc) {
          slot.value = await window.ipcRenderer.invoke(
            'decode-value',
            localStorage.getItem('token'),
            JSON.stringify(slot.value)
          )
        }
        return slot
      })
    )
    return this
  }
}
