import { ipcMain } from 'electron'
import * as accountService from '../services/account'
import * as endpointService from '../services/endpoint'
import * as pageService from '../services/page'

export interface IPCResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

function wrapIPC<T>(fn: (...args: any[]) => Promise<T>) {
  return async (_event: Electron.IpcMainInvokeEvent, ...args: any[]): Promise<IPCResponse<T>> => {
    try {
      const deserializedArgs = args.map(arg => {
        if (typeof arg === 'string') {
          try {
            return JSON.parse(arg)
          } catch {
            return arg
          }
        }
        return arg
      })

      const result = await fn(...deserializedArgs)
      return { success: true, data: result }
    } catch (error: any) {
      return { success: false, error: error.message || String(error) }
    }
  }
}

export function registerAccountHandlers() {
  console.log('Registering account handlers...')
  console.log('accountService methods:', Object.keys(accountService))

  ipcMain.handle('api:account:sign', wrapIPC(accountService.sign))

  ipcMain.handle('api:account:register', wrapIPC(accountService.register))

  ipcMain.handle('api:account:verify', wrapIPC(async (sessionId: string) => {
    const session = await accountService.verify(sessionId)
    return { userId: session.userId, username: session.username }
  }))

  console.log('Account handlers registered')
}

export function registerEndpointHandlers() {
  ipcMain.handle('api:endpoint:get', wrapIPC(async (endpointId: number) => {
    return await endpointService.getOne(endpointId)
  }))

  ipcMain.handle('api:endpoint:list', wrapIPC(async (sessionId: string) => {
    const session = await accountService.verify(sessionId)
    return await endpointService.allByUser(session.userId)
  }))

  ipcMain.handle('api:endpoint:delete', wrapIPC(async (endpointId: number) => {
    return await endpointService.remove(endpointId)
  }))

  ipcMain.handle('api:endpoint:ssh-cmd', wrapIPC(async (endpointId: number, command: string) => {
    return await endpointService.execSshCmd(endpointId, command)
  }))
}

export function registerPageHandlers() {
  ipcMain.handle('api:page:save', wrapIPC(async (endpointId: number, pageId: number | 'n', pageData: any, sessionId: string) => {
    const session = await accountService.verify(sessionId)
    return await pageService.saveOne(endpointId, pageId, pageData, session.userId)
  }))
}

export function registerAllIPCHandlers() {
  registerAccountHandlers()
  registerEndpointHandlers()
  registerPageHandlers()
  console.log('All IPC handlers registered')
}
