import type { IDatabase } from '../database'
import type { ModelInfo } from '../database/database'

let PageModel: ModelInfo | null = null

export function definePageModel(db: IDatabase): ModelInfo {
  const Page = db.defineModel('page',
    {
      id: db.PropTypes.Id,
      url: db.PropTypes.LongStr,
      slots: db.PropTypes.Array
    },
    {
      router: {
        methods: ['POST', 'DELETE', 'PUT', 'GET']
      },
      timestamps: true
    }
  )
  PageModel = Page
  return Page
}

export function getPageModel(): ModelInfo {
  if (!PageModel) {
    throw new Error('Page model not defined. Call definePageModel() first.')
  }
  return PageModel
}

export const Page = {
  get model() {
    return getPageModel().model
  }
}

export default Page
