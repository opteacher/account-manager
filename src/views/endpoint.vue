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
            @pressEnter="onPageUpdate"
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
          <a-button @click="onPageUpdate" :loading="endpoint.collecting">
            <template #icon><SendOutlined /></template>
            {{ endpoint.ins.login === 'ssh' ? '登录' : '跳转' }}
          </a-button>
        </a-input-group>
        <a-input-group compact size="large">
          <a-button type="primary" size="large" :disabled="endpoint.collecting" @click="onPageSave">
            保存
          </a-button>
          <a-button
            v-if="endpoint.pgIdx < endpoint.ins.pages.length"
            size="large"
            :disabled="endpoint.collecting"
            @click="onGo2NextPage"
          >
            下一页
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
      <WebPanel
        ref="pageRef"
        :curURL="endpoint.curURL"
        :collecting="endpoint.collecting"
        :form="endpoint.form"
        :eleDict="endpoint.eleDict"
        v-model:selKeys="endpoint.selKeys"
        v-model:locEleMod="endpoint.locEleMod"
        @page-loaded="onPageLoaded"
      />
      <SlotSideBar
        :collecting="endpoint.collecting"
        :form="endpoint.form"
        :tree-data="endpoint.treeData"
        v-model:selKeys="endpoint.selKeys"
        v-model:locEleMod="endpoint.locEleMod"
      />
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
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  BorderlessTableOutlined,
  ArrowLeftOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined
} from '@ant-design/icons-vue'
import { h, onMounted, reactive, ref, watch, createVNode } from 'vue'
import { Button, Modal, notification, TreeProps } from 'ant-design-vue'
import { newOne, reqPut, setProp, until } from '@lib/utils'
import Mapper, { createByFields } from '@lib/types/mapper'
import mdlAPI from '@/apis/model'
import { useRoute, useRouter } from 'vue-router'
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
import { WebviewTag } from 'electron'
import lgnAPI from '@/apis/login'

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
  eleDict: Record<string, PageEle>
  treeData: TreeProps['treeData']
  expKeys: (string | number)[]
  selKeys: (string | number)[]
  locEleMod: boolean
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
  eleDict: {},
  treeData: [],
  expKeys: [],
  selKeys: [],
  locEleMod: false,
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
    await onPageUpdate()
  }
  endpoint.edit = false
}
async function onPageUpdate() {
  endpoint.collecting = true
  switch (endpoint.ins.login) {
    case 'web':
      if (endpoint.form.url) {
        endpoint.curURL = endpoint.form.url
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
      }
      break
  }
  endpoint.collecting = false
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
function onPageSave() {
  Modal.confirm({
    title: '确定插入该页面吗？',
    icon: createVNode(ExclamationCircleOutlined),
    content: createVNode('div', null, '该页面会追加到当前登录端的页面流最后'),
    async onOk() {
      const pgKey = endpoint.form.key === -1 ? 'n' : endpoint.form.key
      await mdlAPI.link('endpoint', endpoint.ins.key, 'page', pgKey, true, {
        type: 'api',
        axiosConfig: { data: endpoint.form }
      })
      const key = `open${Date.now()}`
      notification.open({
        icon: createVNode(CheckCircleOutlined, { style: { color: '#52c41a' } }),
        message: createVNode('h3', null, '页面保存成功！'),
        description: '是否立即执行页面操作并跳转到下个页面继续操作？',
        duration: null,
        key,
        btn: () =>
          h(
            Button,
            {
              type: 'primary',
              onClick: () => {
                notification.close(key)
                onGo2NextPage()
              }
            },
            { default: () => '操作并跳转' }
          )
      })
    }
  })
}
function onGo2BackPage() {
  router.push(`/login_platform/endpoint/${endpoint.ins.key}/edit`)
}
async function onGo2NextPage() {
  if (!pageRef.value.dspPage) {
    return
  }
  for (const slot of endpoint.form.slots) {
    const ele = `document.evaluate('${slot.xpath}', document).iterateNext()`
    switch (slot.itype) {
      case 'input':
        await pageRef.value.dspPage?.executeJavaScript(`${ele}.value = '${slot.value}'`)
        break
      case 'click':
        await pageRef.value.dspPage?.executeJavaScript(`${ele}.click()`)
        break
    }
    await until(async () => pageRef.value != null && !pageRef.value.dspPage?.isLoading())
  }
  endpoint.pgIdx++
  if (endpoint.pgIdx < endpoint.ins.pages.length) {
    Page.copy(endpoint.ins.pages[endpoint.pgIdx], endpoint.form, true)
  } else {
    endpoint.form.reset()
  }
  await onPageUpdate()
}
function onEpTitleChange() {
  endpoint.edit = true
  endpoint.edtName = endpoint.ins.name
}
async function onEpTitleSave() {
  await reqPut('endpoint', endpoint.ins.key, { name: endpoint.edtName })
  await refresh()
}
async function onPageLoaded() {
  const elements = JSON.parse(
    await pageRef.value.dspPage?.executeJavaScript(`
      JSON.stringify(Array.from(document.getElementsByTagName('*')).map(function(el) {
        const tagName = el.tagName.toLowerCase()
        const ret = {
          tagName,
          clazz: el.className,
          rectBox: el.getBoundingClientRect().toJSON()
        }
        if (['style', 'script', 'link', 'meta', 'head', 'header', 'title'].includes(tagName)) {
          return
        }
        if (el === document.body) {
          return { xpath: '/html/body', ...ret }
        }
        if (el.id !== '') {
          return { xpath: '//*[@id="' + el.id + '"]', id: el.id, ...ret }
        }
        let index = 1
        const siblings = el.parentElement && el.parentElement.children
          ? el.parentElement.children : []
        for (const sibling of siblings) {
          if (sibling === el) {
            const prtEl = arguments.callee(el.parentElement)
            return prtEl
              ? {
                  xpath: prtEl.xpath + '/' + tagName + '[' + index + ']',
                  ...ret
                }
              : undefined
          }
          if (sibling.nodeType === 1 && sibling.tagName === el.tagName) {
            index++
          }
        }
      }).filter(el => el))
    `)
  ) as PageEle[]

  let treeData: TreeProps['treeData'] = []
  for (const element of elements) {
    const xpaths = element.xpath.split('/').filter(sec => sec)
    let subNodes = treeData
    let lastNode = null

    for (const [idx, xp] of xpaths.entries()) {
      lastNode = subNodes.find(nd => nd.title === xp)
      if (lastNode) {
        subNodes = lastNode.children || []
      } else {
        const prefix = xpaths[0].startsWith('*') ? '//' : '/'
        lastNode = {
          key: prefix + xpaths.slice(0, idx + 1).join('/'),
          title: xp,
          children: []
        }
        subNodes.push(lastNode)
        subNodes = lastNode.children
      }
    }

    if (lastNode) {
      lastNode.element = element
    }
  }
  endpoint.eleDict = Object.fromEntries(elements.map((el: any) => [el.xpath, el]))
  endpoint.treeData = treeData
  endpoint.selKeys = []
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
