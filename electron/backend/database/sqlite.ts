const Database = require('better-sqlite3')

import type { DatabaseConfig } from '../config'
import type { IDatabase, ModelStruct, ModelOptions, ModelInfo, SelectOptions, SaveOptions, WhereCondition, ForeignKeyCollection } from './database'

import { MiddleNames } from './database'

export class SQLite implements IDatabase {
  private db: any = null
  private models: Map<string, ModelInfo> = new Map()

  public PropTypes = {
    Id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
    String: 'TEXT',
    LongStr: 'TEXT',
    Number: 'INTEGER',
    DateTime: 'TEXT',
    Boolean: 'INTEGER',
    Decimal: 'REAL',
    Array: 'TEXT',
    Object: 'TEXT',
    Any: 'BLOB'
  }

  public Middles = MiddleNames

  constructor(private config: DatabaseConfig) {}

  connect() {
    if (this.db) {
      return Promise.resolve(this)
    }

    return new Promise<SQLite>((resolve) => {
      const dbPath = this.config.database || ':memory:'
      this.db = new Database(dbPath)
      this.db.pragma('journal_mode = WAL')
      console.log('SQLite database connected:', dbPath)
      resolve(this)
    })
  }

  disconnect() {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }

  private structTypeToSqlType(propType: string): string {
    if (propType === this.PropTypes.Id) return 'INTEGER PRIMARY KEY AUTOINCREMENT'
    if (propType === this.PropTypes.String) return 'TEXT'
    if (propType === this.PropTypes.LongStr) return 'TEXT'
    if (propType === this.PropTypes.Number) return 'INTEGER'
    if (propType === this.PropTypes.DateTime) return 'TEXT'
    if (propType === this.PropTypes.Boolean) return 'INTEGER'
    if (propType === this.PropTypes.Decimal) return 'REAL'
    if (propType === this.PropTypes.Array) return 'TEXT'
    if (propType === this.PropTypes.Object) return 'TEXT'
    if (propType === this.PropTypes.Any) return 'BLOB'
    return 'TEXT'
  }

  static getRefCollection(struct: ModelStruct): ForeignKeyCollection {
    const ret: ForeignKeyCollection = {}
    for (const [key, val] of Object.entries(struct)) {
      const value = Array.isArray(val) && val.length ? val[0] : val
      if (value && value.ref) {
        ret[key] = { ref: value.ref }
        if (Array.isArray(val) && val.length) {
          ret[key].array = val.length
        }
        if (typeof value.belong === 'undefined') {
          ret[key].belong = !ret[key].array
        } else {
          ret[key].belong = value.belong
        }
      }
    }
    return ret
  }

  defineModel(name: string, struct: ModelStruct, options: ModelOptions = {}): ModelInfo {
    if (!options.middle) {
      options.middle = {}
    }
    if (!options.operate) {
      options.operate = {}
    }

    const setOperate = (name: 'select' | 'update' | 'create' | 'delete') => {
      if (!options.operate![name]) {
        options.operate![name] = { columns: Object.keys(struct) }
      }
    }
    setOperate('select')
    setOperate('update')
    setOperate('create')
    setOperate('delete')

    const tableName = name.toLowerCase()
    const columns: string[] = []

    if (options.timestamps) {
      columns.push('createdAt TEXT DEFAULT CURRENT_TIMESTAMP')
      columns.push('updatedAt TEXT DEFAULT CURRENT_TIMESTAMP')
    }

    for (const [pname, prop] of Object.entries(struct)) {
      const foreignProps = SQLite.getRefCollection(struct)
      if (Object.keys(foreignProps).includes(pname)) {
        continue
      }

      const propType = prop?.type || prop

      if (propType === this.PropTypes.Array) {
        columns.push(`${pname} TEXT`)
      } else if (propType === this.PropTypes.Object || prop === this.PropTypes.Object) {
        columns.push(`${pname} TEXT`)
      } else if (prop === this.PropTypes.Boolean) {
        columns.push(`${pname} INTEGER DEFAULT 0`)
      } else if (propType === this.PropTypes.Id) {
        columns.push(`${pname} INTEGER PRIMARY KEY AUTOINCREMENT`)
      } else if (typeof propType === 'string' && propType.startsWith('INTEGER PRIMARY KEY')) {
        columns.push(`${pname} ${propType}`)
      } else {
        columns.push(`${pname} ${this.structTypeToSqlType(propType)}`)
      }

      if (prop?.index) {
        columns[columns.length - 1] += ' UNIQUE'
      }

      if (typeof prop?.default !== 'undefined') {
        if (prop.default === Date.now) {
          columns[columns.length - 1] += ` DEFAULT (datetime('now'))`
        } else {
          columns[columns.length - 1] += ` DEFAULT ${this.escapeValue(prop.default)}`
        }
      }
    }

    const createTableSQL = `CREATE TABLE IF NOT EXISTS ${tableName} (${columns.join(', ')})`
    if (this.db) {
      this.db.exec(createTableSQL)
      console.log(`Table ${tableName} created`)
    }

    const modelInfo: ModelInfo = { name, struct, options, tableName, model: null }
    this.models.set(name, modelInfo)

    return modelInfo
  }

  buildAssocs() {
    console.log('SQLite does not enforce foreign keys in same way as Sequelize')
  }

  private escapeValue(value: any): string {
    if (value === null || value === undefined) return 'NULL'
    if (typeof value === 'string') {
      return `'${value.replace(/'/g, "''")}'`
    }
    if (typeof value === 'number') return String(value)
    if (typeof value === 'boolean') return value ? '1' : '0'
    if (typeof value === 'object') {
      return `'${JSON.stringify(value).replace(/'/g, "''")}'`
    }
    return String(value)
  }

  private encodeArray(arr: any[]): string {
    return JSON.stringify(arr)
  }

  private decodeArray(str: string | unknown): any[] {
    try {
      const strValue = String(str)
      const parsed = JSON.parse(strValue)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  private encodeObject(obj: any): string {
    return JSON.stringify(obj)
  }

  private decodeObject(str: string | unknown): any {
    try {
      const strValue = String(str)
      return JSON.parse(strValue)
    } catch {
      return undefined
    }
  }

  select(mdlInf: ModelInfo, condition: WhereCondition = {}, options: SelectOptions = {}): Promise<any[]> {
    if (!this.db) {
      throw new Error('Database not connected')
    }

    let sql = `SELECT `
    let params: any[] = []

    if (options.selCols && options.selCols.length > 0) {
      sql += options.selCols.join(', ')
    } else {
      sql += '*'
    }

    sql += ` FROM ${mdlInf.tableName}`

    const whereClause = this.buildWhereClause(condition, params)
    if (whereClause) {
      sql += ` WHERE ${whereClause}`
    }

    if (condition.order_by) {
      const orderClauses = Object.entries(condition.order_by).map(([col, dir]) => `${col} ${dir.toUpperCase()}`)
      sql += ` ORDER BY ${orderClauses.join(', ')}`
    }

    if (condition.limit) {
      sql += ` LIMIT ${parseInt(String(condition.limit))}`
    }

    if (condition.offset) {
      sql += ` OFFSET ${parseInt(String(condition.offset))}`
    }

    const stmt = this.db.prepare(sql)
    const results = stmt.all(...params) as any[]
    const processedResults = results.map((row: any) => this.processRow(row, mdlInf.struct))

    if (condition._index !== undefined) {
      const index = parseInt(String(condition._index))
      return Promise.resolve([processedResults.find(r => r.id === index)].filter(Boolean))
    }

    return Promise.resolve(processedResults)
  }

  private buildWhereClause(condition: WhereCondition, params: any[]): string {
    const clauses: string[] = []

    if (condition._index !== undefined) {
      clauses.push(`id = ?`)
      params.push(condition._index)
    }

    for (const [key, value] of Object.entries(condition)) {
      if (['_index', 'order_by', 'offset', 'limit'].includes(key)) {
        continue
      }

      if (Array.isArray(value)) {
        const op = value[0]
        const val = value[1]

        switch (op) {
          case '<':
            clauses.push(`${key} < ?`)
            params.push(val)
            break
          case '>':
            clauses.push(`${key} > ?`)
            params.push(val)
            break
          case '<=':
            clauses.push(`${key} <= ?`)
            params.push(val)
            break
          case '>=':
            clauses.push(`${key} >= ?`)
            params.push(val)
            break
          case '==':
            if (val && val.toLowerCase() === 'null') {
              clauses.push(`${key} IS NULL`)
            } else {
              clauses.push(`${key} = ?`)
              params.push(val)
            }
            break
          case '!=':
            if (val && val.toLowerCase() === 'null') {
              clauses.push(`${key} IS NOT NULL`)
            } else {
              clauses.push(`${key} != ?`)
              params.push(val)
            }
            break
          case 'in':
            if (Array.isArray(val)) {
              const placeholders = val.map(() => '?').join(', ')
              clauses.push(`${key} IN (${placeholders})`)
              params.push(...val)
            }
            break
          case 'like':
            clauses.push(`${key} LIKE ?`)
            params.push(val)
            break
        }
      } else if (value === 'null') {
        clauses.push(`${key} IS NULL`)
      } else {
        clauses.push(`${key} = ?`)
        params.push(value)
      }
    }

    return clauses.join(' AND ')
  }

  private processRow(row: any, struct: ModelStruct): any {
    const processed: any = {}

    for (const [key, value] of Object.entries(row)) {
      const prop = struct[key]

      if (prop === this.PropTypes.Array || prop?.type === this.PropTypes.Array) {
        processed[key] = this.decodeArray(value)
      } else if (prop === this.PropTypes.Object || prop?.type === this.PropTypes.Object) {
        processed[key] = this.decodeObject(value)
      } else if (prop === this.PropTypes.Boolean || prop?.type === this.PropTypes.Boolean) {
        processed[key] = value === 1
      } else if (prop === this.PropTypes.Number || prop?.type === this.PropTypes.Number) {
        processed[key] = typeof value === 'string' ? parseInt(value) : value
      } else if (prop === this.PropTypes.Decimal || prop?.type === this.PropTypes.Decimal) {
        processed[key] = typeof value === 'string' ? parseFloat(value) : value
      } else {
        processed[key] = value
      }
    }

    return processed
  }

  exec(sql: string, params: any = []): any {
    if (!this.db) {
      throw new Error('Database not connected')
    }

    const stmt = this.db.prepare(sql)
    return stmt.all(...params)
  }

  async save(mdlInf: ModelInfo, values: Record<string, any>, condition: WhereCondition = {}, options: SaveOptions = {}): Promise<any> {
    if (!this.db) {
      throw new Error('Database not connected')
    }

    const updMode = (options.updMode?.toLowerCase() || 'cover') as 'cover' | 'append' | 'delete'

    if (condition._index !== undefined) {
      return this.saveOne(mdlInf, parseInt(String(condition._index)), values, updMode)
    }

    const results = await this.select(mdlInf, condition, { selCols: ['id'] })
    if (results.length > 0) {
      return Promise.all(results.map((entity: any) => this.saveOne(mdlInf, entity.id, values, updMode)))
    }

    return this.insertOne(mdlInf, values)
  }

  private async insertOne(mdlInf: ModelInfo, values: Record<string, any>): Promise<any> {
    if (!this.db) {
      throw new Error('Database not connected')
    }

    const columns: string[] = []
    const params: any[] = []
    const processedValues: Record<string, any> = {}

    for (const [key, value] of Object.entries(values)) {
      if (mdlInf.struct[key] === undefined) continue

      columns.push(key)
      processedValues[key] = value
    }

    for (const col of columns) {
      const value = processedValues[col]
      const prop = mdlInf.struct[col]

      if (prop === this.PropTypes.Array || prop?.type === this.PropTypes.Array) {
        params.push(this.encodeArray(value))
      } else if (prop === this.PropTypes.Object || prop?.type === this.PropTypes.Object) {
        params.push(this.encodeObject(value))
      } else if (prop === this.PropTypes.Boolean || prop?.type === this.PropTypes.Boolean) {
        params.push(value ? 1 : 0)
      } else {
        params.push(value)
      }
    }

    const placeholders = columns.map(() => '?').join(', ')
    const sql = `INSERT INTO ${mdlInf.tableName} (${columns.join(', ')}) VALUES (${placeholders})`

    const stmt = this.db.prepare(sql)
    const info = stmt.run(...params)

    const lastId = info.lastInsertRowid as number
    const inserted = await this.select(mdlInf, { _index: lastId })
    return inserted[0]
  }

  private async saveOne(mdlInf: ModelInfo, id: number, values: Record<string, any>, updMode: 'cover' | 'append' | 'delete'): Promise<any> {
    if (!this.db) {
      throw new Error('Database not connected')
    }

    const existing = await this.select(mdlInf, { _index: id })
    if (!existing || existing.length === 0) {
      throw new Error(`Record with id ${id} not found`)
    }

    const updates: string[] = []
    const params: any[] = []

    for (const [key, value] of Object.entries(values)) {
      if (mdlInf.struct[key] === undefined) continue

      const current = existing[0][key]
      const prop = mdlInf.struct[key]

      let finalValue = value

      switch (updMode) {
        case 'append':
          if (typeof current === 'number') {
            finalValue = current + value
          } else if (Array.isArray(current)) {
            finalValue = [...current, ...(Array.isArray(value) ? value : [value])]
          } else if (typeof current === 'string') {
            finalValue = current + value
          }
          break
        case 'delete':
          if (typeof current === 'number') {
            finalValue = 0
          } else if (typeof current === 'string') {
            finalValue = ''
          } else if (Array.isArray(current)) {
            finalValue = current.filter((v: any) => v !== value)
          }
          break
        case 'cover':
        default:
          finalValue = value
          break
      }

      updates.push(`${key} = ?`)

      if (prop === this.PropTypes.Array || prop?.type === this.PropTypes.Array) {
        params.push(this.encodeArray(finalValue))
      } else if (prop === this.PropTypes.Object || prop?.type === this.PropTypes.Object) {
        params.push(this.encodeObject(finalValue))
      } else if (prop === this.PropTypes.Boolean || prop?.type === this.PropTypes.Boolean) {
        params.push(finalValue ? 1 : 0)
      } else {
        params.push(finalValue)
      }
    }

    if (updates.length === 0) {
      return existing[0]
    }

    params.push(id)
    const sql = `UPDATE ${mdlInf.tableName} SET ${updates.join(', ')}, updatedAt = datetime('now') WHERE id = ?`

    const stmt = this.db.prepare(sql)
    stmt.run(...params)

    const updated = await this.select(mdlInf, { _index: id })
    return updated[0]
  }

  remove(mdlInf: ModelInfo, condition: WhereCondition): Promise<number> {
    if (!this.db) {
      throw new Error('Database not connected')
    }

    const params: any[] = []
    const whereClause = this.buildWhereClause(condition, params)

    if (!whereClause) {
      throw new Error('No condition provided for delete operation')
    }

    const sql = `DELETE FROM ${mdlInf.tableName} WHERE ${whereClause}`

    const stmt = this.db.prepare(sql)
    const result = stmt.run(...params)

    return Promise.resolve(result.changes)
  }

  sync(): Promise<any> {
    console.log('SQLite sync - table already created in defineModel')
    return Promise.resolve(undefined)
  }

  count(mdlInf: ModelInfo, condition: WhereCondition = {}): Promise<number> {
    const params: any[] = []
    let sql = `SELECT COUNT(*) as count FROM ${mdlInf.tableName}`

    const whereClause = this.buildWhereClause(condition, params)
    if (whereClause) {
      sql += ` WHERE ${whereClause}`
    }

    const stmt = this.db!.prepare(sql)
    const result = stmt.get(...params) as { count: number } | undefined

    return Promise.resolve(result?.count || 0)
  }

  max(mdlInf: ModelInfo, column: string): Promise<number> {
    const sql = `SELECT MAX(${column}) as max FROM ${mdlInf.tableName}`
    const stmt = this.db!.prepare(sql)
    const result = stmt.get() as { max: number | null } | undefined

    return Promise.resolve(result?.max || 0)
  }
}
