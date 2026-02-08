import type { IDatabase } from '../database'
import type { ModelInfo } from '../database/database'

let RecordModel: ModelInfo | null = null

export function defineRecordModel(db: IDatabase): ModelInfo {
  const Record = db.defineModel('record',
    {
      id: db.PropTypes.Id,
      ip: db.PropTypes.String,
      fkEndpoint: { type: db.PropTypes.Id, ref: 'endpoint', belong: true }
    },
    {
      router: {
        methods: ['POST', 'DELETE', 'PUT', 'GET', 'LINK']
      },
      timestamps: true
    }
  )
  RecordModel = Record
  return Record
}

export function getRecordModel(): ModelInfo {
  if (!RecordModel) {
    throw new Error('Record model not defined. Call defineRecordModel() first.')
  }
  return RecordModel
}

export const Record = {
  get model() {
    return getRecordModel().model
  }
}

export default Record
