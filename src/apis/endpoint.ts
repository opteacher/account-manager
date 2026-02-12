import { invokeIPC } from './ipc'

export async function createEndpoint(data: any, sessionId: string) {
  return invokeIPC('api:endpoint:create', data, sessionId)
}

export default (eid: number) => ({
  sshCmd: {
    exec: (command: string) =>
      invokeIPC('api:endpoint:ssh-cmd', eid, command)
  }
})
