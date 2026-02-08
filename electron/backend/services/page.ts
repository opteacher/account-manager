import { getDatabase } from '../database/init'
import { getEndpointModel, getPageModel, getAccountModel } from '../models'
import * as crypto from 'crypto'

export async function saveOne(endpointId: number, pageId: number | 'n', pageData: any, userId: number): Promise<any> {
  const db = getDatabase()
  const Account = getAccountModel()
  const Endpoint = getEndpointModel()
  const Page = getPageModel()

  const account = await db.select(Account, { _index: userId })
  if (!account) {
    throw new Error('Account not found')
  }

  const privateKey = account.privateKey
  const secret = process.env.SERVER_SECRET || 'default-secret'

  pageData.slots = pageData.slots.map((slot: any) => {
    if (slot.encrypt) {
      const encrypted = crypto.privateEncrypt({
        key: privateKey,
        passphrase: secret
      }, Buffer.from(slot.value))
      return { ...slot, value: encrypted }
    }
    return slot
  })

  const endpoint = await db.select(Endpoint, { _index: endpointId })
  if (!endpoint) {
    throw new Error('Endpoint not found')
  }

  if (!pageId || pageId === 'n') {
    const newPage = await db.save(Page, pageData)
    const currentFkPages = endpoint.fkPages || []
    await db.save(Endpoint, { id: endpointId, fkPages: [...currentFkPages, newPage.id] })
    return newPage
  } else {
    return await db.save(Page, { id: pageId, ...pageData })
  }
}
