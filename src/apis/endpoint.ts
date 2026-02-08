import { invokeIPC } from './ipc'

export default (eid: number) => ({
  sshCmd: {
    exec: (command: string) =>
      invokeIPC('api:endpoint:ssh-cmd', eid, command)
  }
})
