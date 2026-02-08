import type { IDatabase } from '../database'
import type { ModelInfo } from '../database/database'

let EndpointModel: ModelInfo | null = null

export function defineEndpointModel(db: IDatabase): ModelInfo {
  const Endpoint = db.defineModel('endpoint',
    {
      id: db.PropTypes.Id,
      name: { type: db.PropTypes.String, index: true },
      icon: db.PropTypes.String,
      fkPages: [{ type: db.PropTypes.Id, ref: 'page', belong: false }],
      login: db.PropTypes.String
    },
    {
      router: {
        methods: ['POST', 'DELETE', 'PUT', 'GET', 'LINK']
      },
      timestamps: true
    }
  )
  EndpointModel = Endpoint
  return Endpoint
}

export function getEndpointModel(): ModelInfo {
  if (!EndpointModel) {
    throw new Error('Endpoint model not defined. Call defineEndpointModel() first.')
  }
  return EndpointModel
}

export const Endpoint = {
  get model() {
    return getEndpointModel().model
  }
}

export default Endpoint
