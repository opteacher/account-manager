import { getDatabase } from '../database/init'
import { getEndpointModel, getAccountModel, getPageModel } from '../models'
import { execSync } from 'child_process'
import * as path from 'path'

export async function allByUser(userId: number, options?: any) {
  const db = getDatabase()
  const Account = getAccountModel()
  const account = await db.select(Account, { _index: userId })
  if (!account) {
    throw new Error('Account not found')
  }
  const Endpoint = getEndpointModel()
  const condition: any = {}
  if (options?.limit) {
    condition.limit = options.limit
  }
  const endpoints = await db.select(Endpoint, condition)
  return endpoints.filter((ep: any) => ep.fkEndpoints && ep.fkEndpoints.includes(userId))
}

export async function getOne(endpointId: number) {
  const db = getDatabase()
  const Endpoint = getEndpointModel()
  return await db.select(Endpoint, { _index: endpointId })
}

export async function remove(endpointId: number) {
  const db = getDatabase()
  const Endpoint = getEndpointModel()
  const Page = getPageModel()
  const endpoint = await db.select(Endpoint, { _index: endpointId })
  if (!endpoint) {
    throw new Error('Endpoint not found')
  }

  if (endpoint.fkPages && endpoint.fkPages.length) {
    await Promise.all(endpoint.fkPages.map((pageId: number) => db.remove(Page, { _index: pageId })))
  }

  return db.remove(Endpoint, { _index: endpointId })
}

export async function execSshCmd(endpointId: number, command: string) {
  const db = getDatabase()
  const Endpoint = getEndpointModel()
  const endpoint = await db.select(Endpoint, { _index: endpointId })
  if (!endpoint || !endpoint.fkPages || endpoint.fkPages.length === 0) {
    throw new Error('SSH端没有账户信息！')
  }

  const Page = getPageModel()
  const page = await db.select(Page, { _index: endpoint.fkPages[0] })
  if (!page || !page.url) {
    throw new Error('Page not found or has no URL')
  }

  const [host, port] = page.url.split(':')
  const username = page.slots?.find((slot: any) => slot.element?.xpath === 'username')?.value || 'root'
  const password = page.slots?.find((slot: any) => slot.element?.xpath === 'password')?.value

  if (!password) {
    throw new Error('SSH password not found')
  }

  const cmd = [
    `sshpass -p${password} ssh`,
    port ? `-p${port}` : '',
    '-o StrictHostKeyChecking=no',
    `${username}@${host}`,
    command
  ].filter((x: string) => x).join(' ')

  try {
    return execSync(cmd).toString('utf8').split('\n').filter((x: string) => x).slice(1).map((p: string) => path.basename(p))
  } catch (error: any) {
    throw new Error(`SSH command failed: ${error.message}`)
  }
}
