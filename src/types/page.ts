import useGlobalStore from '@/stores/global'
import PgOper from '@lib/types/pgOper'
import { gnlCpy, until } from '@lib/utils'
import { WebviewTag } from 'electron'

export default class Page {
  key: number
  url: string
  slots: PgOper[]

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
        slots: PgOper.copy
      }
    })
  }

  async decodeSlots() {
    this.slots = await Promise.all(
      this.slots.map(async slot => {
        if (slot.encrypt) {
          slot.value = await window.ipcRenderer.invoke(
            'decode-value',
            useGlobalStore().token,
            JSON.stringify(slot.value)
          )
        }
        return slot
      })
    )
    return this
  }

  async execSlots(webview?: WebviewTag) {
    for (const slot of this.slots) {
      const ele = `document.evaluate('${slot.element.xpath}', document).iterateNext()`
      await new Promise(resolve => setTimeout(resolve, typeof slot.timeout !== 'undefined' ? slot.timeout : 200))
      switch (slot.otype) {
        case 'input':
          await webview?.executeJavaScript(`${ele}.value = '${slot.value}'`)
          break
        case 'click':
          await webview?.executeJavaScript(`${ele}.click()`)
          break
      }
      await until(async () => !webview?.isLoading())
    }
  }
}
