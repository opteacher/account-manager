<template>
  <MainLayout>
    <a-upload name="file" accept=".exe" :showUploadList="false" @change="onChromeSelect">
      <a-button :type="chrome.execPath ? 'primary' : 'default'">指定 chrome 执行文件</a-button>
    </a-upload>
  </MainLayout>
</template>

<script setup lang="ts">
import MainLayout from '@/layouts/main.vue'
import useChromeStore from '@/stores/chrome'
import { UploadChangeParam } from 'ant-design-vue'

const chrome = useChromeStore()

function onChromeSelect(e: UploadChangeParam) {
  if (!e.file.originFileObj) {
    return
  }
  chrome.execPath = e.file.originFileObj?.path as string
  // window.ipcRenderer.invoke('launch-chrome')

}
</script>
