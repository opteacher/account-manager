import { reqPost } from '@lib/utils'

export default {
  login: (data: any) =>
    reqPost('account/sign', data, {
      type: 'api',
      ignores: ['remember'],
      messages: { succeed: '' }
    }),
  register: (data: any) => reqPost('account', data, { type: 'api', ignores: ['remember'] }),
  verify: () => reqPost('account/verify', undefined, { type: 'api' }),
  verifyDeep: () => reqPost('account/verify/deep', undefined, { type: 'api' })
}
