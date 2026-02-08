<template>
  <div class="endpoint-container">
    <a-page-header class="page-header">
      <template #title>
        <div class="header-title-section">
          <a-typography-title class="page-title" :level="3">
            {{ endpoint.edit ? '编辑登录端' : endpoint.ins.name }}
          </a-typography-title>
          <a-form v-if="endpoint.edit" layout="inline" :model="endpoint" class="title-form">
            <a-form-item
              name="edtName"
              :rules="[{ required: true, message: '必须输入登录端名！' }]"
              class="inline-form-item"
            >
              <a-input
                v-model:value="endpoint.edtName"
                allowClear
                :disabled="endpoint.collecting"
                class="title-input"
                placeholder="输入登录端名称"
              >
                <template #suffix>
                  <a-space>
                    <a-button size="small" type="link" class="action-btn" @click="onEpTitleSave">
                      <template #icon><CheckOutlined /></template>
                      保存
                    </a-button>
                    <a-button
                      size="small"
                      type="link"
                      danger
                      class="action-btn"
                      @click="() => setProp(endpoint, 'edit', false)"
                    >
                      <template #icon><CloseOutlined /></template>
                      取消
                    </a-button>
                  </a-space>
                </template>
              </a-input>
            </a-form-item>
          </a-form>
        </div>
      </template>
      <template #backIcon>
        <a-button
          v-if="endpoint.pgIdx > 0"
          type="text"
          class="back-btn"
          @click="onGoBack"
        >
          <ArrowLeftOutlined />
        </a-button>
      </template>
      <template #tags>
        <a-tag class="page-tag" color="blue">
          <template #icon><BorderlessTableOutlined /></template>
          页面{{ endpoint.pgIdx + 1 }}
        </a-tag>
      </template>
      <template #extra>
        <div class="header-actions">
          <a-select
            disabled
            :options="[
              { label: '网页登录', value: 'web' },
              { label: '终端SSH', value: 'ssh' }
            ]"
            v-model:value="endpoint.ins.login"
            @change="onLgnTypeChange"
            class="login-type-select"
          />
          <a-input
            class="url-input"
            allowClear
            v-model:value="endpoint.page.url"
            :placeholder="placeholders[endpoint.ins.login]"
            @pressEnter="onPageCommit"
          >
            <template #prefix><RightOutlined class="input-icon" /></template>
            <template #clearIcon>
              <CloseCircleFilled class="clear-icon" @click="() => (endpoint.curURL = '')" />
            </template>
          </a-input>
          <a-button
            v-if="endpoint.ins.login === 'ssh'"
            :type="endpoint.page.slots.length ? 'default' : 'primary'"
            class="auth-btn"
            @click="onAuthSshShow"
          >
            <template #icon><KeyOutlined /></template>
            {{ endpoint.page.slots.length ? '已认证' : '认证' }}
          </a-button>
          <a-button type="primary" class="submit-btn" @click="onPageCommit" :loading="endpoint.collecting">
            <template #icon><SendOutlined /></template>
            {{ endpoint.ins.login === 'ssh' ? '登录' : '跳转' }}
          </a-button>
        </div>
      </template>
    </a-page-header>

    <FormDialog
      title="SSH认证"
      width="600px"
      :mapper="authMapper"
      :emitter="authSSh.emitter"
      :newFun="() => newOne(AuthSSH)"
      @submit="onAuthSshSubmit"
    />

    <div class="content-wrapper">
      <div v-if="endpoint.ins.login === 'ssh'" class="ssh-content">
        <SshPanel :url="endpoint.curURL" />
      </div>
      <div v-else-if="endpoint.ins.login === 'web'" class="web-content">
        <StepSideBar :endpoint="endpoint.ins" @click="onGo2NextPage">
          <template #bottom>
            <SlotSideBar
              :slots="endpoint.page.slots"
              :collecting="endpoint.collecting"
              :emitter="endpoint.emitter"
              @slotDel="onSlotsSave"
              @submit="onSlotsSave"
            />
          </template>
        </StepSideBar>
        <PgEleSelect
          ref="pageRef"
          v-model:loading="endpoint.collecting"
          :url="endpoint.curURL"
          :emitter="endpoint.emitter"
          :hlEles="endpoint.page.slots.map(slot => slot.element.xpath)"
          :sbarWid="300"
          :addrBar="false"
        >
          <template #empty>
            <div class="empty-guide">
              <a-typography-title :level="5" class="guide-title">
                操作指引
              </a-typography-title>
              <ol class="guide-list">
                <li>登录类型选择【网页登录】</li>
                <li>在【地址栏】输入网址</li>
                <li>点击【跳转】加载网页并收集网页元素</li>
                <li>给登录表单的元素绑定账户信息</li>
                <li>点击【保存】绑定网页元素与账户信息</li>
              </ol>
            </div>
          </template>
        </PgEleSelect>
      </div>
    </div>

    <FormDialog
      title="新增登录端"
      :mapper="epMapper"
      :emitter="endpoint.emitter"
      :newFun="() => newOne(Endpoint)"
      @submit="onEndpointSave"
    />
  </div>
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
import Page from '@/types/page'
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
import PgEleSelect from '@lib/components/PgEleSelect.vue'
import { detectNetwork } from '@/apis'
import PgOper from '@lib/types/pgOper'

const router = useRouter()
const route = useRoute()

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
    offset: 4,
    options: [
      { label: '一般认证', value: 'basic' },
      { label: 'id文件', value: 'idfile' }
    ]
  },
  username: {
    label: '用户名',
    type: 'Input',
    rules: [{ required: true, message: '必须输入用户名！' }],
    display: [Cond.create('atype', '==', 'basic')]
  },
  password: {
    label: '密码',
    type: 'Password',
    display: [Cond.create('atype', '==', 'basic')]
  },
  idRsaFile: {
    label: 'idRsa公钥文件',
    type: 'UploadFile',
    display: [Cond.create('atype', '==', 'idfile')]
  }
})

const endpoint = reactive<{
  ins: Endpoint
  edit: boolean
  edtName: string
  page: Page
  collecting: boolean
  curURL: string
  emitter: TinyEmitter
  nextPage: boolean
  pgIdx: number
}>({
  ins: new Endpoint(),
  edit: false,
  edtName: '',
  page: Page.copy({ url: 'http://124.28.221.82:8096' }),
  collecting: false,
  curURL: '',
  emitter: new TinyEmitter(),
  nextPage: false,
  pgIdx: 0
})

const pageRef = ref<{ webviewRef: WebviewTag | null }>({
  webviewRef: null
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
    Page.copy(endpoint.ins.pages[endpoint.pgIdx], endpoint.page, true)
    await onPageCommit()
  }
  endpoint.edit = false
}

async function onPageCommit() {
  endpoint.collecting = true
  switch (endpoint.ins.login) {
    case 'web':
      if (endpoint.page.url) {
        if (endpoint.page.url === endpoint.curURL) {
          endpoint.emitter.emit('reload', true)
        } else {
          endpoint.curURL = endpoint.page.url
        }
      } else {
        endpoint.emitter.emit('reload')
      }
      break
    case 'ssh':
      {
        const [host, port] = endpoint.page.url.split(':')
        const baseURL = (await detectNetwork(false)) as string
        const sshHost = baseURL ? baseURL.substring(0, baseURL.lastIndexOf(':')) : ''
        const sshPort = import.meta.env.VITE_SSH_PORT
        const unSlot = endpoint.page.slots.find(slot => slot.element.xpath === 'username')
        const username = unSlot ? unSlot.value : 'root'
        const pwdSlot = endpoint.page.slots.find(slot => slot.element.xpath === 'password')
        const password = pwdSlot ? pwdSlot.value : undefined
        endpoint.curURL = [
          `${sshHost}:${sshPort}/?arg=-c&arg=`,
          password ? `sshpass%20-p${password}%20ssh` : 'ssh',
          port ? `-p${port}` : '',
          '-o%20StrictHostKeyChecking=no',
          `${username}@${host}`
        ].join('%20')
        if (endpoint.page.key === -1) {
          await onSlotsSave()
        }
        endpoint.collecting = false
      }
      break
  }
}

async function onEndpointSave(_form: any, next: Function) {
  const newEp = await mdlAPI.add('endpoint', endpoint.ins, { copy: Endpoint.copy })
  const { payload } = await lgnAPI.verify()
  await mdlAPI.link('account', payload.sub, 'fkEndpoints', newEp.key)
  endpoint.page.reset()
  next()
  await refresh()
}

function onLgnTypeChange(lgnType: 'ssh' | 'web') {
  endpoint.page.reset()
  endpoint.ins.login = lgnType
  endpoint.curURL = ''
}

function onAuthSshSubmit(authSSH: AuthSSH, next: Function) {
  endpoint.page.slots = []
  switch (authSSH.atype) {
    case 'basic':
      endpoint.page.slots.push(
        PgOper.copy({
          element: { xpath: 'username' },
          value: authSSH.username,
          encrypt: false
        })
      )
      endpoint.page.slots.push(
        PgOper.copy({
          element: { xpath: 'password' },
          value: authSSH.password,
          encrypt: true
        })
      )
      break
    case 'idfile':
      endpoint.page.slots.push(
        PgOper.copy({
          element: { xpath: 'idRsaFile' },
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
      ...Object.fromEntries(endpoint.page.slots.map(slot => [slot.element.xpath, slot.value]))
    }
  })
}

async function onGo2NextPage(pgIdx?: number) {
  if (!pageRef.value.webviewRef) {
    return
  }
  if (typeof pgIdx !== 'undefined') {
    for (let i = 0; i < pgIdx; ++i) {
      await endpoint.ins.pages[i].execSlots(pageRef.value.webviewRef)
    }
    endpoint.pgIdx = pgIdx
  } else {
    await endpoint.page.execSlots(pageRef.value.webviewRef)
    endpoint.pgIdx++
  }
  if (endpoint.pgIdx < endpoint.ins.pages.length) {
    Page.copy(endpoint.ins.pages[endpoint.pgIdx], endpoint.page, true)
  } else {
    endpoint.page.reset()
  }
  await onPageCommit()
}

function onEpTitleChange() {
  endpoint.edit = true
  endpoint.edtName = endpoint.ins.name
}

async function onEpTitleSave() {
  await reqPut('endpoint', endpoint.ins.key, { name: endpoint.edtName })
  await refresh()
}

async function onSlotsSave(slots?: PgOper[]) {
  if (slots) {
    endpoint.page.slots = slots
  }
  const pgKey = endpoint.page.key === -1 ? 'n' : endpoint.page.key
  await mdlAPI.link('endpoint', endpoint.ins.key, 'page', pgKey, true, {
    type: 'api',
    axiosConfig: { data: endpoint.page }
  })
  endpoint.emitter.emit('stop-select')
  await refresh()
}

function onGoBack() {
  router.back()
}
</script>

<style scoped>
.endpoint-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--gray-50);
}

.page-header {
  background: white;
  border-bottom: 1px solid var(--border);
  padding: 16px 24px;
  margin: 0;
}

.header-title-section {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.page-title {
  margin: 0;
  color: var(--text-primary);
  font-weight: var(--font-semibold);
  letter-spacing: -0.01em;
}

.title-form {
  flex: 1;
}

.inline-form-item {
  margin-bottom: 0;
  width: 100%;
}

.title-input {
  flex: 1;
}

:deep(.title-input .ant-input) {
  border-radius: var(--radius-sm);
  border-color: var(--border);
  font-size: var(--text-sm);
}

.action-btn {
  font-size: var(--text-xs);
  padding: 4px 8px;
  height: auto;
}

.back-btn {
  color: var(--text-secondary);
  padding: 8px;
}

.back-btn:hover {
  color: var(--primary);
  background: var(--primary-50);
}

.page-tag {
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  max-width: 800px;
}

.login-type-select {
  width: 120px;
}

:deep(.login-type-select .ant-select-selector) {
  border-radius: var(--radius-sm);
  border-color: var(--border);
}

.url-input {
  flex: 1;
}

:deep(.url-input .ant-input) {
  border-radius: var(--radius-sm);
  border-color: var(--border);
  font-size: var(--text-sm);
}

:deep(.url-input .ant-input:focus) {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-50);
}

.input-icon {
  color: var(--text-tertiary);
}

.clear-icon {
  color: var(--text-tertiary);
  cursor: pointer;
}

.clear-icon:hover {
  color: var(--text-secondary);
}

.auth-btn {
  height: 40px;
  border-radius: var(--radius-sm);
  font-weight: var(--font-medium);
  font-size: var(--text-sm);
}

.auth-btn:hover {
  background: var(--gray-50);
}

.submit-btn {
  height: 40px;
  padding: 0 24px;
  border-radius: var(--radius-sm);
  font-weight: var(--font-medium);
  font-size: var(--text-sm);
  box-shadow: 0 2px 4px rgba(26, 115, 232, 0.2);
}

.submit-btn:hover {
  background: var(--primary-hover);
  box-shadow: 0 4px 8px rgba(26, 115, 232, 0.3);
}

.content-wrapper {
  flex: 1;
  padding: 24px;
  overflow: hidden;
}

.ssh-content,
.web-content {
  height: 100%;
  display: flex;
  gap: 16px;
}

.empty-guide {
  background: white;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 24px;
  max-width: 400px;
}

.guide-title {
  color: var(--text-primary);
  font-weight: var(--font-semibold);
  margin: 0 0 16px 0;
}

.guide-list {
  margin: 0;
  padding-left: 20px;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}

.guide-list li {
  margin-bottom: 8px;
}

:deep(.ant-tree-title) {
  word-break: keep-all !important;
  white-space: nowrap !important;
}

:deep(.ant-spin-container) {
  position: relative !important;
}

@media (max-width: 768px) {
  .page-header {
    padding: 12px 16px;
  }

  .header-actions {
    flex-wrap: wrap;
    gap: 8px;
  }

  .login-type-select {
    width: 100%;
  }

  .url-input {
    width: 100%;
  }

  .auth-btn,
  .submit-btn {
    width: 100%;
  }

  .content-wrapper {
    padding: 16px;
  }

  .ssh-content,
  .web-content {
    flex-direction: column;
  }

  .empty-guide {
    max-width: 100%;
  }
}
</style>
