import { gnlCpy } from "@lib/utils"

export default class MidLgn {
  key: string
  path: string
  bkgdColor: string
  background: string
  lblWidth: number
  width: number
  align: string
  padding: number
  radius: number
  fmBkgdColor: string
  registerable: boolean
  title: string
  logAccount: boolean
  hasLabel: boolean

  constructor() {
    this.key = ''
    this.path = '/login'
    this.bkgdColor = '#cdcdcd'
    this.background = ''
    this.lblWidth = 4
    this.width = 50
    this.align = 'center'
    this.padding = 24
    this.radius = 0
    this.fmBkgdColor = '#EFEFEF'
    this.registerable = false
    this.title = '登录标题'
    this.logAccount = true
    this.hasLabel = true
  }

  reset() {
    this.key = ''
    this.path = '/login'
    this.bkgdColor = '#cdcdcd'
    this.background = ''
    this.lblWidth = 4
    this.width = 50
    this.align = 'center'
    this.padding = 24
    this.radius = 0
    this.fmBkgdColor = '#EFEFEF'
    this.registerable = false
    this.title = ''
    this.logAccount = true
    this.hasLabel = true
  }

  static copy(src: any, tgt?: MidLgn, force = false): MidLgn {
    return gnlCpy(MidLgn, src, tgt, { force })
  }

  equals(to: any): boolean {
    return (
      this.path === to.path &&
      this.bkgdColor === to.bkgdColor &&
      this.background === to.background &&
      this.lblWidth === to.lblWidth &&
      this.width === to.width &&
      this.align === to.align &&
      this.padding === to.padding &&
      this.radius === to.radius &&
      this.fmBkgdColor === to.fmBkgdColor &&
      this.registerable === to.registerable &&
      this.title === to.title &&
      this.logAccount === to.logAccount &&
      this.hasLabel === to.hasLabel
    )
  }
}
