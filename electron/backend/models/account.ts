import type { IDatabase } from '../database'
import type { ModelInfo } from '../database/database'

let AccountModel: ModelInfo | null = null

export function defineAccountModel(db: IDatabase): ModelInfo {
  const Account = db.defineModel('account',
    {
      id: db.PropTypes.Id,
      username: { type: db.PropTypes.String, index: true, unique: true },
      password: db.PropTypes.String,
      role: db.PropTypes.String,
      privateKey: db.PropTypes.Any,
      publicKey: db.PropTypes.Any,
      fkEndpoints: [{ type: db.PropTypes.Id, ref: 'endpoint', belong: false }]
    },
    {
      router: {
        methods: ['GET', 'DELETE', 'PUT', 'LINK']
      },
      timestamps: true
    }
  )
  AccountModel = Account
  return Account
}

export function getAccountModel(): ModelInfo {
  if (!AccountModel) {
    throw new Error('Account model not defined. Call defineAccountModel() first.')
  }
  return AccountModel
}

export const Account = {
  get model() {
    return getAccountModel().model
  }
}

export default Account
