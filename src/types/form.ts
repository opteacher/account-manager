/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { gnlCpy } from '@lib/utils'
import Field from '@lib/types/field'

export default class Form {
  key: string
  title: string
  width: number
  labelWidth: number
  labelAlign: 'left' | 'right'
  fields: Field[]

  constructor() {
    this.key = ''
    this.title = ''
    this.width = 0
    this.labelWidth = 0
    this.labelAlign = 'right'
    this.fields = []
  }

  reset() {
    this.key = ''
    this.title = ''
    this.width = 0
    this.labelWidth = 0
    this.labelAlign = 'right'
    this.fields = []
  }

  static copy(src: any, tgt?: Form, force = false): Form {
    return gnlCpy(Form, src, tgt, { force, cpyMapper: { fields: Field.copy } })
  }
}
