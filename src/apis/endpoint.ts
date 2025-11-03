import { reqPost } from '@lib/utils'

export default (eid: number) => ({
  sshCmd: {
    exec: (command: string) =>
      reqPost(`endpoint/${eid}`, { command }, { type: 'api', action: 'ssh-cmd/exec' })
  }
})
