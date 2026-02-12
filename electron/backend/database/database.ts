export type ModelStruct = Record<string, any>

export type ModelOptions = {
  router?: {
    methods: string[]
  }
  middle?: {
    select?: Record<string, any>
    create?: Record<string, any>
    update?: Record<string, any>
    save?: Record<string, any>
    delete?: Record<string, any>
  }
  operate?: {
    select?: {
      columns: string[]
    }
    update?: {
      columns: string[]
    }
    create?: {
      columns: string[]
    }
    delete?: {
      columns: string[]
    }
  }
  timestamps?: boolean
}

export type ModelInfo = {
  name: string
  struct: ModelStruct
  options: ModelOptions
  tableName?: string
  model: any
}

export interface ForeignKey {
  ref: string
  belong?: boolean
  array?: number
}

export type SelectOptions = {
  raw?: boolean
  selCols?: string[]
  rawQuery?: boolean
  ext?: boolean
}

export type SaveOptions = {
  updMode?: 'cover' | 'append' | 'delete'
}

export interface WhereCondition {
  [key: string]: any
  scope?: 'week' | 'month' | 'year'
  order_by?: Record<string, 'asc' | 'desc'>
  offset?: number
  limit?: number
  _index?: number
}

export interface ForeignKeyCollection {
  [key: string]: ForeignKey
}

export interface IDatabase {
  PropTypes: any
  Middles: any

  connect(): any
  disconnect(): void

  defineModel(name: string, struct: ModelStruct, options?: ModelOptions): any

  buildAssocs(): any

  select(mdlInf: any, condition?: WhereCondition, options?: SelectOptions): Promise<any[]>
  exec(sql: string, params?: any): any

  save(mdlInf: any, values: Record<string, any>, condition?: WhereCondition, options?: SaveOptions): Promise<any>

  remove(mdlInf: any, condition: WhereCondition): Promise<number>

  sync(mdlInf: any): Promise<any>

  count(mdlInf: any, condition?: WhereCondition): Promise<number>

  max(mdlInf: any, column: string): Promise<number>
}

// Symbol-based property types for logical type distinction
export const PropTypes = {
  Id: Symbol('Id'),
  String: Symbol('String'),
  LongStr: Symbol('LongStr'),
  Number: Symbol('Number'),
  DateTime: Symbol('DateTime'),
  Boolean: Symbol('Boolean'),
  Decimal: Symbol('Decimal'),
  Array: Symbol('Array'),
  Object: Symbol('Object'),
  Any: Symbol('Any')
}

export type DatabaseType = 'mysql' | 'sqlite'

export const MiddleNames = {
  select: '',
  create: 'create',
  update: 'update',
  save: 'save',
  delete: 'destroy',
  valid: 'validation',
  before: 'before',
  after: 'after'
}
