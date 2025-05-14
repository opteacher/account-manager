import { gnlCpy } from "@lib/utils"

export default class Endpoint {
  key: number
  name: string
  icon: string

  constructor() {
    this.key = -1
    this.name = ''
    this.icon = ''
  }

  static copy(src: any, tgt?: Endpoint, force = false) {
    return gnlCpy(Endpoint, src, tgt, { force })
  }
}