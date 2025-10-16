import { defineStore } from 'pinia'

const useGlobalStore = defineStore('global', {
  state: () => ({
    token: '',
    chromeExecPath: '',
    backendBaseURL: ''
  }),
  persist: true
})

export default useGlobalStore