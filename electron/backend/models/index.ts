import type { IDatabase } from '../database'
import { defineAccountModel, getAccountModel } from './account'
import { defineEndpointModel, getEndpointModel } from './endpoint'
import { definePageModel, getPageModel } from './page'
import { defineRecordModel, getRecordModel } from './record'

export function defineAllModels(db: IDatabase) {
  defineAccountModel(db)
  defineEndpointModel(db)
  definePageModel(db)
  defineRecordModel(db)
  if (db.buildAssocs) {
    db.buildAssocs()
  }
  console.log('Database models initialized')
}

export function getAllModels() {
  return {
    Account: getAccountModel(),
    Endpoint: getEndpointModel(),
    Page: getPageModel(),
    Record: getRecordModel()
  }
}

export { defineAccountModel, defineEndpointModel, definePageModel, defineRecordModel }
export { getAccountModel, getEndpointModel, getPageModel, getRecordModel }
