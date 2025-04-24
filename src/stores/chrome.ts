import { defineStore } from 'pinia'

const useChromeStore = defineStore('chrome', {
  state: () => ({
    execPath: ''
  }),
  persist: true
})

export default useChromeStore