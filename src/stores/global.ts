import { defineStore } from 'pinia'

const useGlobalStore = defineStore('global', {
  state: () => ({
    chromeExecPath: '',
    backendBaseURL: ''
  }),
  persist: true
})

export default useGlobalStore