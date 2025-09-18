<template>
  <div class="h-full flex flex-col">
    <a-page-header @back="onGo2BackPage">
      <template #title>
        <a-space>
          <a-typography-title class="mb-0" :level="3">登录端 /</a-typography-title>
          <a-form v-if="endpoint.edit" layout="inline" :model="endpoint">
            <a-form-item
              name="edtName"
              :rules="[{ required: true, message: '必须输入登录端名！' }]"
            >
              <a-input v-model:value="endpoint.edtName" allowClear :disabled="endpoint.collecting">
                <template #suffix>
                  <a-button size="small" type="link" @click="onEpTitleSave">
                    <template #icon><CheckOutlined /></template>
                  </a-button>
                  <a-button
                    size="small"
                    type="link"
                    danger
                    @click="() => setProp(endpoint, 'edit', false)"
                  >
                    <template #icon><CloseOutlined /></template>
                  </a-button>
                </template>
              </a-input>
            </a-form-item>
          </a-form>
          <a-typography-title v-else class="mb-0" :level="3">
            {{ endpoint.ins.name }}
          </a-typography-title>
        </a-space>
        <a-button
          v-if="!endpoint.edit"
          type="link"
          :disabled="endpoint.collecting"
          @click="onEpTitleChange"
        >
          <template #icon><EditOutlined /></template>
        </a-button>
      </template>
      <template #backIcon>
        <ArrowLeftOutlined v-if="endpoint.pgIdx > 0" />
      </template>
      <template #tags>
        <a-tag color="blue">
          <template #icon><BorderlessTableOutlined /></template>
          页面{{ endpoint.pgIdx + 1 }}
        </a-tag>
      </template>
      <template #extra>
        <a-input-group class="flex-1 flex" compact size="large">
          <a-select
            disabled
            :options="[
              { label: '网页登录', value: 'web' },
              { label: '终端SSH', value: 'ssh' }
            ]"
            v-model:value="endpoint.ins.login"
            @change="onLgnTypeChange"
          />
          <a-input
            class="flex-1 min-w-[30vw]"
            allowClear
            v-model:value="endpoint.form.url"
            :placeholder="placeholders[endpoint.ins.login]"
            @pressEnter="onPageCommit"
          >
            <template #prefix><RightOutlined /></template>
            <template #clearIcon>
              <CloseCircleFilled @click="() => (endpoint.curURL = '')" />
            </template>
          </a-input>
          <a-button
            v-if="endpoint.ins.login === 'ssh'"
            :type="endpoint.form.slots.length ? 'primary' : 'default'"
            @click="onAuthSshShow"
          >
            <template #icon><KeyOutlined /></template>
            {{ endpoint.form.slots.length ? '已认证' : '认证' }}
          </a-button>
          <a-button type="primary" @click="onPageCommit" :loading="endpoint.collecting">
            <template #icon><SendOutlined /></template>
            {{ endpoint.ins.login === 'ssh' ? '登录' : '跳转' }}
          </a-button>
        </a-input-group>
      </template>
    </a-page-header>
    <FormDialog
      title="SSH认证"
      width="30vw"
      :mapper="authMapper"
      :emitter="authSSh.emitter"
      :newFun="() => newOne(AuthSSH)"
      @submit="onAuthSshSubmit"
    />
    <div v-if="endpoint.ins.login === 'ssh'" class="flex-1 flex mt-5">
      <SshPanel :curURL="endpoint.curURL" />
    </div>
    <div v-else-if="endpoint.ins.login === 'web'" class="flex-1 flex mt-5">
      <StepSideBar class="mx-2 w-80" :endpoint="endpoint.ins" @click="onGo2NextPage" />
      <WebEleSelect
        ref="pageRef"
        :curURL="endpoint.curURL"
        :emitter="endpoint.emitter"
        :hlEles="endpoint.form.slots.map(slot => slot.xpath)"
      >
        <template #empty>
          <ol>
            <li>
              <a-typography-text type="secondary">登录类型选择【网页登录】</a-typography-text>
            </li>
            <li>
              <a-typography-text type="secondary">在【地址栏】输入网址</a-typography-text>
            </li>
            <li>
              <a-typography-text type="secondary">
                点击【跳转】加载网页并收集网页元素
              </a-typography-text>
            </li>
            <li>
              <a-typography-text type="secondary">给登录表单的元素绑定账户信息</a-typography-text>
            </li>
            <li>
              <a-typography-text type="secondary">
                点击【保存】绑定网页元素与账户信息
              </a-typography-text>
            </li>
          </ol>
        </template>
        <template #sideBottom>
          <SlotSideBar
            :form="endpoint.form"
            :collecting="endpoint.collecting"
            v-model:selKeys="endpoint.selKeys"
          />
        </template>
      </WebEleSelect>
    </div>
  </div>
  <FormDialog
    title="新增登录端"
    :mapper="epMapper"
    :emitter="endpoint.emitter"
    :newFun="() => newOne(Endpoint)"
    @submit="onEndpointSave"
  />
</template>

<script setup lang="ts">
import {
  SendOutlined,
  RightOutlined,
  CloseCircleFilled,
  KeyOutlined,
  BorderlessTableOutlined,
  ArrowLeftOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined
} from '@ant-design/icons-vue'
import { onMounted, reactive, ref, watch } from 'vue'
import { newOne, reqPut, setProp } from '@lib/utils'
import Mapper, { createByFields } from '@lib/types/mapper'
import mdlAPI from '@/apis/model'
import { useRoute, useRouter } from 'vue-router'
import Page, { Slot } from '@/types/page'
import FormDialog from '@lib/components/FormDialog.vue'
import { TinyEmitter } from 'tiny-emitter'
import { Cond } from '@lib/types'
import AuthSSH from '@/types/authSSH'
import SshPanel from '@/components/sshPanel.vue'
import SlotSideBar from '@/components/slotSideBar.vue'
import { data as models } from '@/jsons/models.json'
import Field from '@lib/types/field'
import Endpoint from '@/types/endpoint'
import { WebviewTag } from 'electron'
import lgnAPI from '@/apis/login'
import StepSideBar from '@/components/stepSideBar.vue'
import WebEleSelect from '@lib/components/WebEleSelect.vue'

const placeholders = {
  web: '输入网址（必须带http或https前缀）',
  ssh: '输入SSH地址（host:port）'
}
const epMapper = createByFields(
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
const router = useRouter()
const endpoint = reactive<{
  ins: Endpoint
  edit: boolean
  edtName: string
  form: Page
  collecting: boolean
  curURL: string
  selKeys: (string | number)[]
  emitter: TinyEmitter
  nextPage: boolean
  pgIdx: number
}>({
  ins: new Endpoint(),
  edit: false,
  edtName: '',
  form: Page.copy({ url: 'http://124.28.221.82:8096' }),
  collecting: false,
  curURL: '',
  selKeys: [],
  emitter: new TinyEmitter(),
  nextPage: false,
  pgIdx: 0
})
const pageRef = ref<{ dspPage: WebviewTag | null }>({
  dspPage: null
})
const authSSh = reactive({
  emitter: new TinyEmitter()
})

onMounted(refresh)
watch(() => route.fullPath, refresh)

async function refresh() {
  if (!route.params.eid || route.params.eid === 'n') {
    endpoint.emitter.emit('update:visible', true)
    return
  }
  const epInf = await mdlAPI.get('endpoint', route.params.eid)
  Endpoint.copy(epInf, endpoint.ins, true)
  await endpoint.ins.decodeSlots()
  if (endpoint.ins.pages.length) {
    Page.copy(endpoint.ins.pages[endpoint.pgIdx], endpoint.form, true)
    onPageCommit()
  }
  endpoint.edit = false
}
function onPageCommit() {
  endpoint.collecting = true
  switch (endpoint.ins.login) {
    case 'web':
      if (endpoint.form.url) {
        if (endpoint.form.url === endpoint.curURL) {
          endpoint.emitter.emit('reload', true)
        } else {
          endpoint.curURL = endpoint.form.url
        }
      } else {
        endpoint.emitter.emit('reload')
      }
      break
    case 'ssh':
      {
        const [host, port] = endpoint.form.url.split(':')
        const sshHost = import.meta.env.VITE_BASE_HOST
        const sshPort = import.meta.env.VITE_SSH_PORT
        const unSlot = endpoint.form.slots.find(slot => slot.xpath === 'username')
        const username = unSlot ? unSlot.value : 'root'
        const pwdSlot = endpoint.form.slots.find(slot => slot.xpath === 'password')
        const password = pwdSlot ? pwdSlot.value : undefined
        endpoint.curURL = [
          `http://${sshHost}:${sshPort}/?arg=-c&arg=`,
          password ? `sshpass%20-p${password}%20ssh` : 'ssh',
          port ? `-p${port}` : '',
          '-o%20StrictHostKeyChecking=no',
          `${username}@${host}`
        ].join('%20')
        endpoint.collecting = false
      }
      break
  }
}
async function onEndpointSave(_form: any, next: Function) {
  const newEp = await mdlAPI.add('endpoint', endpoint.form, { copy: Endpoint.copy })
  const { payload } = await lgnAPI.verify()
  await mdlAPI.link('account', payload.sub, 'fkEndpoints', newEp.key)
  endpoint.form.reset()
  next()
  await refresh()
}
function onLgnTypeChange(lgnType: 'ssh' | 'web') {
  endpoint.form.reset()
  endpoint.ins.login = lgnType
  endpoint.curURL = ''
}
function onAuthSshSubmit(authSSH: AuthSSH, next: Function) {
  endpoint.form.slots = []
  switch (authSSH.atype) {
    case 'basic':
      endpoint.form.slots.push(
        Slot.copy({
          xpath: 'username',
          value: authSSH.username,
          valEnc: false
        })
      )
      endpoint.form.slots.push(
        Slot.copy({
          xpath: 'password',
          value: authSSH.password,
          valEnc: true
        })
      )
      break
    case 'idfile':
      endpoint.form.slots.push(
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
      ...Object.fromEntries(endpoint.form.slots.map(slot => [slot.xpath, slot.value]))
    }
  })
}
function onGo2BackPage() {
  router.push(`/login_platform/endpoint/${endpoint.ins.key}/edit`)
}
async function onGo2NextPage(pgIdx?: number) {
  if (!pageRef.value.dspPage) {
    return
  }
  if (typeof pgIdx !== 'undefined') {
    for (let i = 0; i < pgIdx; ++i) {
      await endpoint.ins.pages[i].execSlots(pageRef.value.dspPage)
    }
    endpoint.pgIdx = pgIdx
  } else {
    await endpoint.form.execSlots(pageRef.value.dspPage)
    endpoint.pgIdx++
  }
  if (endpoint.pgIdx < endpoint.ins.pages.length) {
    Page.copy(endpoint.ins.pages[endpoint.pgIdx], endpoint.form, true)
  } else {
    endpoint.form.reset()
  }
  onPageCommit()
}
function onEpTitleChange() {
  endpoint.edit = true
  endpoint.edtName = endpoint.ins.name
}
async function onEpTitleSave() {
  await reqPut('endpoint', endpoint.ins.key, { name: endpoint.edtName })
  await refresh()
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
