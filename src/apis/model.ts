export interface ModelAPIResponse<T = any> {
  data?: T
  result?: T
  error?: string
  message?: string
}

function transformResponse<T>(response: any): T {
  if (typeof response.data !== 'undefined') {
    return response.data
  }
  if (typeof response.result !== 'undefined') {
    return response.result
  }
  if (typeof response.error !== 'undefined') {
    throw new Error(response.error)
  }
  if (typeof response.message !== 'undefined') {
    return response.message
  }
  return response
}

export default {
  add: async (mname: string, data: any) => {
    const response = await window.ipcRenderer.invoke(`api:${mname}:create`, data)
    return transformResponse(response)
  },

  get: async (mname: string, key: any, options?: any) => {
    const response = await window.ipcRenderer.invoke(`api:${mname}:get`, key, options)
    return transformResponse(response)
  },

  remove: async (mname: string, key: any, options?: any) => {
    const response = await window.ipcRenderer.invoke(`api:${mname}:delete`, key, options)
    return transformResponse(response)
  },

  update: async (mname: string, key: any, data?: any, options?: any) => {
    const response = await window.ipcRenderer.invoke(`api:${mname}:update`, key, data, options)
    return transformResponse(response)
  },

  all: async (mname: string, options?: any) => {
    const response = await window.ipcRenderer.invoke(`api:${mname}:list`, options)
    return transformResponse(response)
  },

  link: async (
    parent: [string, any],
    child: [string, any],
    link = true
  ) => {
    const response = await window.ipcRenderer.invoke(
      `api:${parent[0]}:link`,
      parent[1],
      child[0],
      child[1],
      link
    )
    return transformResponse(response)
  }
}
