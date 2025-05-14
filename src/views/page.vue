<template>
  <MainLayout>
    <div class="h-full flex flex-col">
      <div class="flex space-x-2.5">
        <a-input-group class="flex-1 flex" compact size="large">
          <a-select
            :disabled="route.params.pid !== 'n'"
            :options="[
              { label: '网页登录', value: 'web' },
              { label: '终端SSH', value: 'ssh' }
            ]"
            v-model:value="page.form.login"
            @change="onLgnTypeChange"
          />
          <a-input
            allowClear
            v-model:value="page.form.url"
            :placeholder="placeholders[page.form.login]"
            @pressEnter="onPageUpdate"
          >
            <template #prefix><RightOutlined /></template>
            <template #clearIcon><CloseCircleFilled @click="() => (page.curURL = '')" /></template>
          </a-input>
          <a-button
            v-if="page.form.login === 'ssh'"
            :type="page.form.slots.length ? 'primary' : 'default'"
            @click="onAuthSshShow"
          >
            <template #icon><KeyOutlined /></template>
            {{ page.form.slots.length ? '已认证' : '认证' }}
          </a-button>
          <a-button @click="onPageUpdate" :loading="page.collecting">
            <template #icon><SendOutlined /></template>
            {{ page.form.login === 'ssh' ? '登录' : '跳转' }}
          </a-button>
        </a-input-group>
        <FormDialog
          title="SSH认证"
          width="30vw"
          :mapper="authMapper"
          :emitter="authSSh.emitter"
          :newFun="() => newOne(AuthSSH)"
          @submit="onAuthSshSubmit"
        />
        <a-button
          type="primary"
          size="large"
          :disabled="page.collecting"
          @click="() => page.emitter.emit('update:visible', { show: true, object: page.form })"
        >
          保存
        </a-button>
      </div>
      <div v-if="page.form.login === 'ssh'" class="flex-1 flex mt-5">
        <SshPanel :curURL="page.curURL" />
      </div>
      <div v-else-if="page.form.login === 'web'" class="flex-1 flex mt-5">
        <WebPanel
          ref="pageRef"
          :curURL="page.curURL"
          :collecting="page.collecting"
          :form="page.form"
          :eleDict="page.eleDict"
          v-model:selKeys="page.selKeys"
          v-model:locEleMod="page.locEleMod"
        />
        <SlotSideBar
          :collecting="page.collecting"
          :form="page.form"
          :tree-data="page.treeData"
          v-model:selKeys="page.selKeys"
          v-model:locEleMod="page.locEleMod"
        />
      </div>
    </div>
  </MainLayout>
  <FormDialog
    title="保存页面"
    width="30vw"
    :mapper="pageMapper"
    :emitter="page.emitter"
    :newFun="() => newOne(Endpoint)"
    @submit="onPageSave"
  >
    <template #nameSFX="{ formState }">
      <a-button @click="() => setProp(formState, 'name', formState.url)">直接使用URL命名</a-button>
    </template>
  </FormDialog>
</template>

<script setup lang="ts">
import MainLayout from '@/layouts/main.vue'
import { SendOutlined, RightOutlined, CloseCircleFilled, KeyOutlined } from '@ant-design/icons-vue'
import { onMounted, reactive, ref } from 'vue'
import pgAPI from '@/apis/page'
import { TreeProps } from 'ant-design-vue'
import { newOne, setProp, until } from '@lib/utils'
import Mapper, { createByFields } from '@lib/types/mapper'
import mdlAPI from '@/apis/model'
import { useRoute } from 'vue-router'
import Page, { Slot } from '@/types/page'
import FormDialog from '@lib/components/FormDialog.vue'
import { TinyEmitter } from 'tiny-emitter'
import { Cond } from '@lib/types'
import AuthSSH from '@/types/authSSH'
import SshPanel from '@/components/sshPanel.vue'
import WebPanel from '@/components/webPanel.vue'
import SlotSideBar from '@/components/slotSideBar.vue'
import PageEle from '@/types/pageEle'
import { data as models } from '@/jsons/models.json'
import Field from '@lib/types/field'
import Endpoint from '@/types/endpoint'

const placeholders = {
  web: '输入网址（必须带http或https前缀）',
  ssh: '输入SSH地址（host:port）'
}
const pageMapper = createByFields(
  models.find(mdl => mdl.name === 'endpoint')?.form.fields.map(fld => Field.copy(fld)) || []
)
const authMapper = new Mapper({
  atype: {
    type: 'Radio',
    style: 'button',
    options: [
      { label: '一般认证', value: 'basic' },
      { label: 'id文件', value: 'idfile' }
    ]
  },
  username: {
    label: '用户名',
    type: 'Input',
    rules: [{ required: true, message: '必须输入用户名！' }],
    display: [Cond.create('atype', '=', 'basic')]
  },
  password: {
    label: '密码',
    type: 'Password',
    display: [Cond.create('atype', '=', 'basic')]
  },
  idRsaFile: {
    label: 'idRsa公钥文件',
    type: 'UploadFile',
    display: [Cond.create('atype', '=', 'idfile')]
  }
})
const route = useRoute()
const page = reactive<{
  form: Page
  collecting: boolean
  curURL: string
  eleDict: Record<string, PageEle>
  treeData: TreeProps['treeData']
  expKeys: (string | number)[]
  selKeys: (string | number)[]
  locEleMod: boolean
  emitter: TinyEmitter
}>({
  form: Page.copy({ url: 'http://124.28.221.82:8096' }),
  collecting: false,
  curURL: '',
  eleDict: {},
  treeData: [],
  expKeys: [],
  selKeys: [],
  locEleMod: false,
  emitter: new TinyEmitter()
})
const pageRef = ref<{ dspPage: HTMLIFrameElement | null }>({
  dspPage: null
})
const authSSh = reactive({
  emitter: new TinyEmitter()
})

onMounted(refresh)

async function refresh() {
  if (!route.params.pid || route.params.pid === 'n') {
    return
  }
  const pgInf = await mdlAPI.get('page', route.params.pid)
  Page.copy(pgInf, page.form, true)
  for (const slot of page.form.slots) {
    if (slot.valEnc) {
      slot.value = await window.ipcRenderer.invoke(
        'decode-value',
        localStorage.getItem('token'),
        JSON.stringify(slot.value)
      )
    }
  }
  await onPageUpdate()
}
async function onPageUpdate() {
  page.collecting = true
  switch (page.form.login) {
    case 'web':
      {
        page.curURL = page.form.url
        await until(() => Promise.resolve(pageRef.value.dspPage == null))
        const result = await pgAPI.colcElements(
          page.curURL,
          pageRef.value.dspPage?.getBoundingClientRect() as DOMRect
        )
        page.eleDict = Object.fromEntries(result.elements.map((el: any) => [el.xpath, el]))
        page.treeData = result.treeData
        page.selKeys = []
      }
      break
    case 'ssh':
      {
        const [host, port] = page.form.url.split(':')
        const sshHost = import.meta.env.VITE_BASE_HOST
        const sshPort = import.meta.env.VITE_SSH_PORT
        const unSlot = page.form.slots.find(slot => slot.xpath === 'username')
        const username = unSlot ? unSlot.value : 'root'
        const pwdSlot = page.form.slots.find(slot => slot.xpath === 'password')
        const password = pwdSlot ? pwdSlot.value : undefined
        page.curURL = [
          `http://${sshHost}:${sshPort}/?arg=-c&arg=`,
          password ? `sshpass%20-p${password}%20ssh` : 'ssh',
          port ? `-p${port}` : '',
          '-o%20StrictHostKeyChecking=no',
          `${username}@${host}`
        ].join('%20')
      }
      break
  }
  page.collecting = false
}
async function onPageSave(_form: any, next: Function) {
  await mdlAPI.update('page', route.params.pid || 'n', page.form, { type: 'api' })
  page.form.reset()
  next()
  await refresh()
}
function onLgnTypeChange(lgnType: 'ssh' | 'web') {
  page.form.reset()
  page.form.login = lgnType
  page.curURL = ''
}
function onAuthSshSubmit(authSSH: AuthSSH, next: Function) {
  page.form.slots = []
  switch (authSSH.atype) {
    case 'basic':
      page.form.slots.push(
        Slot.copy({
          xpath: 'username',
          value: authSSH.username,
          valEnc: false
        })
      )
      page.form.slots.push(
        Slot.copy({
          xpath: 'password',
          value: authSSH.password,
          valEnc: true
        })
      )
      break
    case 'idfile':
      page.form.slots.push(
        Slot.copy({
          xpath: 'idRsaFile',
          value: authSSH.idRsaFile
        })
      )
      break
  }
  next()
}
function onAuthSshShow() {
  authSSh.emitter.emit('update:visible', {
    show: true,
    object: {
      atype: 'basic',
      ...Object.fromEntries(page.form.slots.map(slot => [slot.xpath, slot.value]))
    }
  })
}
</script>

<style>
.ant-tree-title {
  word-break: keep-all !important;
  white-space: nowrap !important;
}

.ant-spin-container {
  position: relative !important;
}
</style>
