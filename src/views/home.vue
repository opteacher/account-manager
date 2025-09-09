<template>
  <MainLayout>
    <FormGroup class="w-[60vw]" :lblWid="6" :mapper="mapper" :form="formState" :rules="[]">
      <template #chromeExecPath>
        <a-space>
          <a-input-group class="flex" compact>
            <a-select class="flex-1" v-model:value="formState.chromeExecPath">
              <a-select-option value="Option1">Option1</a-select-option>
              <a-select-option value="Option2">Option2</a-select-option>
            </a-select>
            <a-button><template #icon><SyncOutlined /></template></a-button>
          </a-input-group>
          <a-upload name="file" :showUploadList="false" @change="onChromeSelect">
            <a-button :type="formState.chromeExecPath ? 'primary' : 'default'">
              指定 chrome 执行文件
            </a-button>
          </a-upload>
          <span>
            {{ formState.chromeExecPath }}
          </span>
        </a-space>
      </template>
    </FormGroup>
  </MainLayout>
</template>

<script setup lang="ts">
import MainLayout from '@/layouts/main.vue'
import useGlobalStore from '@/stores/global'
import Mapper from '@lib/types/mapper'
import { UploadChangeParam } from 'ant-design-vue'
import FormGroup from '@lib/components/FormGroup.vue'
import { onMounted, reactive } from 'vue'
import {  SyncOutlined } from '@ant-design/icons-vue'

const mapper = new Mapper({
  chromeExecPath: {
    label: 'Chrome 执行文件路径',
    type: 'Unknown'
  }
})
const formState = reactive(useGlobalStore())

onMounted(async () => {
  const result = await window.ipcRenderer.invoke('detect-chrome')
  console.log(result)
})

function onChromeSelect(e: UploadChangeParam) {
  if (!e.file.originFileObj) {
    return
  }
  formState.chromeExecPath = e.file.originFileObj?.path as string
}
</script>
