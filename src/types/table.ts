/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { gnlCpy } from '@lib/utils'
import Cell from '@lib/types/cell'
import Column from '@lib/types/column'

export class Cells extends Cell {
  selCond: string
  cdCell: Record<string, Cell>

  constructor() {
    super()
    this.selCond = ''
    this.cdCell = {}
  }

  reset() {
    super.reset()
    this.selCond = ''
    this.cdCell = {}
  }

  static copy(src: any, tgt?: Cells, force = false): Cells {
    tgt = tgt || new Cells()
    Cell.copy(src, tgt, force)
    tgt.selCond = force ? src.selCond : src.selCond || tgt.selCond
    tgt.cdCell = src.cdCell
      ? Object.fromEntries(
          Object.entries(src.cdCell).map(([cond, data]: [string, any]) => [cond, Cell.copy(data)])
        )
      : force
      ? {}
      : tgt.cdCell
    return tgt
  }
}
export default class Table {
  key: string
  title: string
  desc: string
  operaStyle: 'button' | 'link'
  size: 'small' | 'default' | 'middle'
  hasPages: boolean
  maxPerPgs: number
  demoData: any
  columns: Column[]
  cells: Cells[]
  operable: string[]
  refresh: string[]
  expandURL: string
  expHeight: number
  colDspable: boolean
  imExport: string[]

  constructor() {
    this.key = ''
    this.title = ''
    this.desc = ''
    this.operaStyle = 'button'
    this.size = 'default'
    this.hasPages = true
    this.maxPerPgs = 10
    this.demoData = null
    this.columns = []
    this.cells = []
    this.operable = []
    this.refresh = []
    this.expandURL = ''
    this.expHeight = -1
    this.colDspable = false
    this.imExport = []
  }

  reset() {
    this.key = ''
    this.title = ''
    this.desc = ''
    this.operaStyle = 'button'
    this.size = 'default'
    this.hasPages = true
    this.maxPerPgs = 10
    this.demoData = null
    this.columns = []
    this.cells = []
    this.operable = []
    this.refresh = []
    this.expandURL = ''
    this.expHeight = -1
    this.colDspable = false
    this.imExport = []
  }

  static copy(src: any, tgt?: Table, force = false): Table {
    return gnlCpy(Table, src, tgt, { force, cpyMapper: { columns: Column.copy, cells: Cell.copy } })
  }
}
