import * as _ from 'lodash'
import { Sequelize, DataTypes, Op } from 'sequelize'
import * as inflection from 'inflection'

import type { DatabaseConfig } from '../config'
import type { IDatabase } from './database'
import { PropTypes, MiddleNames } from './database'

const { singularize, pluralize } = inflection

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
  tableName: string
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

export class MySQL implements IDatabase {
  private sequelize: Sequelize | null = null
  public models: Map<string, any> = new Map()

  public PropTypes = PropTypes
  public Middles = MiddleNames

  constructor(private _config: DatabaseConfig) {}

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

  connect() {
    if (!this.sequelize) {
      this.sequelize = new Sequelize(
        this._config.database,
        this._config.username,
        this._config.password,
        {
          host: this._config.host,
          port: this._config.port,
          dialect: 'mysql',
          logging: console.log,
          pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
          }
        }
      )
    }
    return this.sequelize
  }

  disconnect() {
    return this.sequelize?.close()
  }

  private encodeValue(value: any): string {
    if (typeof value === 'object') {
      return `o${encodeURIComponent(JSON.stringify(value))}`
    } else if (typeof value === 'number') {
      if (Math.floor(value) === value) {
        return `n${value}`
      } else {
        return `d${value}`
      }
    } else if (typeof value === 'boolean') {
      return `b${value}`
    } else {
      return `s${value}`
    }
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

    const adjStt = _.cloneDeep(struct)
    const foreignProps = MySQL.getRefCollection(struct)
    const foreignKeys = Object.keys(foreignProps)

    for (const [pname, prop] of Object.entries(adjStt)) {
      if (foreignKeys.includes(pname)) {
        delete adjStt[pname]
        continue
      }

      const propType: symbol = prop?.type || prop

      if (propType === PropTypes.Array) {
        adjStt[pname] = {
          type: DataTypes.STRING(4096),
          get(this: any) {
            const strAry = this.getDataValue(pname)
            return strAry ? strAry.split(',').map((t: string) => {
              switch (t[0]) {
                case 'o': return JSON.parse(decodeURIComponent(t.substring(1)))
                case 'n': return parseInt(t.substring(1))
                case 'd': return parseFloat(t.substring(1))
                case 'b': return t.substring(1).toLowerCase() === 'true'
                case 's': default: return t.substring(1)
              }
            }) : []
          },
          set(this: any, value: any) {
            this.setDataValue(pname, value.map((v: any) => this.encodeValue(v)).join(','))
          }
        }
      } else if (propType === PropTypes.Object) {
        adjStt[pname] = {
          type: DataTypes.STRING(4096),
          get(this: any) {
            const value = this.getDataValue(pname)
            return value ? JSON.parse(value) : undefined
          },
          set(this: any, value: any) {
            if (value) {
              this.setDataValue(pname, JSON.stringify(value))
            }
          }
        }
      }

      if (prop?.index) {
        adjStt[pname].unique = true
        delete adjStt[pname].index
      }

      if (typeof prop?.default !== 'undefined') {
        if (prop.default === Date.now) {
          adjStt[pname].defaultValue = new Date()
        } else if (propType === PropTypes.Array) {
          adjStt[pname].defaultValue = prop.default.map((v: any) => this.encodeValue(v)).join(',')
        } else {
          adjStt[pname].defaultValue = prop.default
        }
        delete adjStt[pname].default
      }
    }

    const moptions: any = { hooks: {}, timestamps: options.timestamps }

    for (const [obs, v] of Object.entries(options.middle)) {
      if (!(obs in this.Middles)) {
        continue
      }
      for (const [stage, func] of Object.entries(v)) {
        if (stage === 'doing') {
          console.error('sequelize不支持doing中间件')
          continue
        }
        moptions.hooks[`${stage}${obs}`] = func
      }
    }

    const model = this.sequelize!.define(name, adjStt, moptions)
    const tableName = name.toLowerCase()
    const modelInfo: ModelInfo = { model, name, struct, options, tableName }
    this.models.set(name, modelInfo)

    return modelInfo
  }

  buildAssocs(): any {
    const modelsArray = Array.from(this.models.values())

    for (const model of modelsArray) {
      const foreignProps = MySQL.getRefCollection(model.struct)

      for (const [prop, table] of Object.entries(foreignProps)) {
        let func = table.belong ? 'belongsTo' : 'hasOne'
        if (table.array) {
          func = 'hasMany'
        }

        if (!(table.ref in this.models)) {
          return `${model.name} require model ${table.ref}, import it first!`
        }

        const refModel = this.models.get(table.ref)
        if (refModel) {
          model.model[func](refModel.model, {
            foreignKey: prop,
            constraints: false
          })
        }
      }
    }
  }

  private adjConds(conds: any) {
    for (const [key, val] of Object.entries(conds.where)) {
      if (Array.isArray(val)) {
        switch (val[0]) {
          case '<':
            conds.where[key] = { [Op.lt]: val[1] }
            break
          case '>':
            conds.where[key] = { [Op.gt]: val[1] }
            break
          case '<=':
            conds.where[key] = { [Op.lte]: val[1] }
            break
          case '>=':
            conds.where[key] = { [Op.gte]: val[1] }
            break
          case '==':
            if (val[1].toLowerCase() === 'null') {
              conds.where[key] = { [Op.is]: null }
            } else {
              conds.where[key] = { [Op.eq]: val[1] }
            }
            break
          case '!=':
            if (val[1].toLowerCase() === 'null') {
              conds.where[key] = { [Op.not]: null }
            } else {
              conds.where[key] = { [Op.ne]: val[1] }
            }
            break
          case 'in':
            conds.where[key] = { [Op.in]: Array.isArray(val[1]) ? val[1] : val.slice(1) }
            break
          case 'like':
            conds.where[key] = { [Op.like]: val[1] }
            break
        }
      } else if (val === 'null') {
        conds.where[key] = { [Op.is]: null }
      }
    }
  }

  select(mdlInf: ModelInfo, condition: WhereCondition = {}, options: SelectOptions = {}): Promise<any> {
    if (typeof options.raw === 'undefined') {
      options.raw = true
    }

    const conds: any = {}
    let index = -1

    if (Object.keys(condition).length > 0) {
      if (condition._index) {
        index = parseInt(String(condition._index))
        delete condition._index
      }

      conds.where = { ...condition }
      delete conds.where._index

      if (condition.order_by) {
        conds.order = Object.entries(condition.order_by).map(([prop, order]: [string, string]) => [prop, order.toUpperCase()])
        delete conds.where.order_by
      }

      if (condition.offset) {
        conds.offset = parseInt(String(condition.offset))
        delete conds.where.offset
      }

      if (condition.limit) {
        conds.limit = parseInt(String(condition.limit))
        delete conds.where.limit
      }

      this.adjConds(conds)
    }

    if (options.selCols) {
      conds.attributes = options.selCols
    }

    if (options.rawQuery) {
      conds.raw = options.rawQuery
    }

    if (options.ext) {
      const refs = MySQL.getRefCollection(mdlInf.struct)
      if (Object.keys(refs).length > 0) {
        conds.include = []
        Object.values(refs).forEach(table => {
          const refModel = this.models.get(table.ref)
          if (refModel) {
            conds.include.push({ model: refModel.model })
          }
        })
      }
    }

    if (index !== -1) {
      return mdlInf.model.findByPk(index, conds).then((res: any) => res && options.raw ? res.toJSON() : res)
    } else {
      return mdlInf.model
        .findAll(conds)
        .then((ress: any[]) => ress.filter((res: any) => res))
        .then((ress: any[]) => (options.raw ? ress.map((res: any) => res.toJSON()) : ress))
    }
  }

  exec(sql: string, params: any = {}, options: any = {}): Promise<any> {
    return this.sequelize!.query(sql, {
      replacements: params,
      ...options
    })
  }

  private getUpdateValue(obj: any, key: string, value: any, updMode: 'cover' | 'append' | 'delete'): any {
    const propType = obj[key]
    const currentValue = obj[key]

    switch (updMode) {
      case 'append':
        if (propType === DataTypes.STRING || propType === DataTypes.INTEGER || propType === DataTypes.DECIMAL) {
          return currentValue + value
        } else if (propType === DataTypes.ARRAY) {
          return currentValue.concat(value)
        }
        break
      case 'delete':
        if (propType === DataTypes.STRING) {
          return ''
        } else if (propType === DataTypes.INTEGER || propType === DataTypes.DECIMAL) {
          return 0
        } else if (propType === DataTypes.ARRAY) {
          const existing = currentValue
          const idx = existing.indexOf(value)
          if (idx > -1) {
            existing.splice(idx, 1)
          }
          return existing
        } else if (propType === DataTypes.JSON) {
          const newValue = JSON.parse(JSON.stringify(currentValue))
          delete newValue[value]
          return newValue
        }
        break
      case 'cover':
      default:
        return value
    }
    return value
  }

  async saveOne(mdlInf: ModelInfo, id: number, values: Record<string, any>, options: SaveOptions = {}): Promise<any> {
    const updMode = (options.updMode?.toLowerCase() || 'cover') as 'cover' | 'append' | 'delete'
    const refs = MySQL.getRefCollection(mdlInf.struct)
    const refKeys = Object.keys(refs)
    let obj: any = null

    if (refKeys.length) {
      const res = await mdlInf.model.findAll({
        where: { id },
        include: Object.values(refs).map(table => {
          const refModel = this.models.get(table.ref)
          return refModel ? { model: refModel.model } : null
        }).filter((x: any) => x)
      })
      obj = res[0]
    } else {
      obj = await mdlInf.model.findByPk(id)
    }

    if (!obj) {
      throw new Error(`Record with id ${id} not found`)
    }

    for (const [k, v] of Object.entries(values)) {
      if (refKeys.includes(k)) {
        const refInf = refs[k]
        const key = _.capitalize(_.camelCase(refInf.ref))
        const refMdl = this.models.get(refInf.ref)
        if (!refMdl) continue

        if (!refInf.array) {
          if (updMode !== 'delete') {
            await obj[`set${key}`](await refMdl.model.findByPk(v))
          } else {
            await obj[`set${key}`](null)
          }
        } else {
          const value = Array.isArray(v) ? v : [v]
          switch (updMode) {
            case 'append':
              for (const sv of value) {
                const record = await refMdl.model.findByPk(sv)
                await obj[`add${singularize(key)}`](record)
              }
              break
            case 'delete':
              for (const sv of value) {
                const record = await refMdl.model.findByPk(sv)
                await obj[`remove${singularize(key)}`](record)
              }
              break
            case 'cover':
            default:
              const records = await Promise.all(value.map((sv: any) => refMdl.model.findByPk(sv)))
              await obj[`set${pluralize(key)}`](records)
              break
          }
        }
        continue
      }

      obj[k] = this.getUpdateValue(obj, k, v, updMode)
    }

    return obj.save().then((result: any) => result.toJSON())
  }

  async save(mdlInf: ModelInfo, values: Record<string, any>, condition: WhereCondition = {}, options: SaveOptions = {}): Promise<any> {
    if (condition._index) {
      return this.saveOne(mdlInf, parseInt(String(condition._index)), values, options)
    } else {
      const result = await this.select(mdlInf, condition, { selCols: ['id'] })
      if (result.length) {
        return Promise.all(result.map((entity: any) => this.saveOne(mdlInf, entity.id, values, options)))
      }
    }

    return mdlInf.model.build(values).save().then((result: any) => result.toJSON())
  }

  remove(mdlInf: ModelInfo, condition: WhereCondition): Promise<number> {
    const where = { ...condition }
    if (condition._index) {
      where.id = parseInt(String(condition._index))
      delete where._index
    }
    return mdlInf.model.destroy({ where })
  }

  sync(mdlInf: ModelInfo): Promise<any> {
    return mdlInf.model.sync({ force: true })
  }

  count(mdlInf: ModelInfo, condition: WhereCondition = {}): Promise<number> {
    const conds: any = { where: condition || {} }
    this.adjConds(conds)
    return mdlInf.model.count(conds)
  }

  max(mdlInf: ModelInfo, column: string): Promise<number> {
    return mdlInf.model
      .findOne({
        order: [[column, 'DESC']],
        attributes: [column]
      })
      .then((res: any) => res?.[column] || 0)
  }

  async genId(mdlInf: ModelInfo): Promise<number> {
    const maxId = await this.max(mdlInf, 'id')
    return maxId + 1
  }
}
