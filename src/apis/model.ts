import { RequestOptions, reqAll, reqDelete, reqGet, reqLink, reqPost, reqPut } from '@lib/utils'

export default {
  add: (mname: string, data: any, options?: RequestOptions) => reqPost(mname, data, options),
  get: (mname: string, key: any, options?: RequestOptions) => reqGet(mname, key, options),
  remove: (mname: string, key: any, options?: RequestOptions) => reqDelete(mname, key, options),
  update: (mname: string, key: any, data: any, options?: RequestOptions) =>
    reqPut(mname, key, data, options),
  all: (mname: string, options?: RequestOptions) => reqAll(mname, options),
  link: (
    mname: string,
    mkey: string,
    sname: string,
    skey: string,
    link = true,
    options?: RequestOptions
  ) => reqLink({ parent: [mname, mkey], child: [sname, skey] }, link, options)
}
