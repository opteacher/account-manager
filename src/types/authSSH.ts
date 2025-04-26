import { gnlCpy } from "@lib/utils"

export default class AuthSSH {
  atype: 'basic' | 'idfile'
  username: string
  password: string
  idRsaFile: string[]

  constructor() {
    this.atype = 'basic'
    this.username = ''
    this.password = ''
    this.idRsaFile = []
  }

  reset() {
    this.atype = 'basic'
    this.username = ''
    this.password = ''
    this.idRsaFile = []
  }

  static copy(src: any, tgt?: AuthSSH, force = false) {
    return gnlCpy(AuthSSH, src, tgt, { force })
  }
}