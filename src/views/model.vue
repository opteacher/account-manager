<template>
  <EditableTable
    :api="{
        all: () => api.all(mname, { copy: copies[mname], type: mname === 'endpoint' ? 'api' : 'mdl' }),
        add: (record: any) => api.add(mname, record),
        update: (record: any) => api.update(mname, record.key, record),
        remove: (record: any) => api.remove(mname, record.key)
      }"
    :title="model.label"
    description="使用ssh登录时请确保本地系统已安装sshpass应用，Windows系统需安装Linux子系统，并在子系统中安装sshpass！"
    sclHeight="h-full"
    :dlgWidth="model.form.width + 'vw'"
    :columns="columns"
    :mapper="mapper"
    :new-fun="() => genDftFmProps(model.props)"
    :emitter="emitter"
    :size="table.size"
    :pagable="table.hasPages"
    :refOptions="table.refresh"
    :dspCols="table.colDspable"
    :editable="table.operable.includes('可编辑')"
    :addable="table.operable.includes('可增加')"
    :delable="table.operable.includes('可删除')"
    :clkable="false"
    @refresh="onRecordsRefresh"
    @after-save="(record: any) => onRecordEdit(record, true)"
    @edit="onRecordEdit"
    @expand="onRecordExpand"
  >
    <template
      v-if="route.path === `/${project.name}/endpoint`"
      #expandedRowRender="{ record: endpoint }"
    >
      <EditableTable
        :api="{
            all: () => api.get('endpoint', endpoint.key, { copy: Endpoint.copy }).then((ep: Endpoint) => ep.pages),
            remove: (pg: Page) => api.link('endpoint', endpoint.key, 'fkPages', pg.key, false).then(() => api.remove('page', pg.key))
          }"
        title="页面列表"
        :columns="pgCols"
        :emitter="pgEmitter"
        :new-fun="() => newOne(Page)"
        :clkable="false"
        @add="() => onRecordEdit(endpoint)"
      >
        <template #no="{ key }">{{ key }}</template>
        <template #slots="{ record: page }">
          <SlotsTable :record="page" />
        </template>
      </EditableTable>
    </template>
    <template v-if="route.path === `/${project.name}/page`" #slots="{ record }">
      <SlotsTable :record="record" />
    </template>
    <template v-if="route.path === `/${project.name}/endpoint`" #operaBefore="{ record }">
      <a-space>
        <a-button type="primary" size="small" @click.stop="() => onLoginClick(record)">
          登录
        </a-button>
        <a-upload
          v-if="record.login === 'ssh'"
          :showUploadList="false"
          :directory="upload.isFolder"
          :beforeUpload="(file: File) => onUpldFlsChange(file, record)"
        >
          <a-input-group compact>
            <a-button size="small" @click="() => (upload.isFolder = false)">上传文件</a-button>
            <a-button size="small" @click="() => (upload.isFolder = true)">夹</a-button>
          </a-input-group>
        </a-upload>
      </a-space>
    </template>
    <template v-if="route.path === `/${project.name}/endpoint`" #extra>
      <a-button v-if="idChrome" @click="onCfgDlgOpen">
        <template #icon><MoreOutlined /></template>
      </a-button>
      <a-tooltip v-else placement="bottomRight">
        <template #title>
          <WarningOutlined />
          还未没有指定Chrome执行文件！
        </template>
        <a-button type="primary" danger @click="onCfgDlgOpen">
          <template #icon><MoreOutlined /></template>
        </a-button>
      </a-tooltip>
    </template>
  </EditableTable>
  <FormDialog
    title="上传文件（夹）"
    :mapper="upload.mapper"
    :emitter="upload.emitter"
    :new-fun="() => ({ localPath: '', destPath: '', isFolder: false })"
    @submit="onUpldFlsSubmit"
  />
  <FormDialog
    title="基础配置"
    :lbl-wid="6"
    :mapper="cfgMapper"
    :emitter="cfgEmitter"
    :newFun="() => ({ chromeExecPath: '' })"
    @submit="onCfgSubmit"
  >
    <template #chromeExecPath>
      <a-input-group v-if="chromePaths.length" class="flex" compact>
        <a-select class="flex-1" v-model:value="formState.chromeExecPath">
          <a-select-option v-for="path in chromePaths" :value="path">{{ path }}</a-select-option>
        </a-select>
        <a-button @click="refresh">
          <template #icon><SyncOutlined /></template>
        </a-button>
      </a-input-group>
      <template v-else>
        <a-upload name="file" :showUploadList="false" @change="onChromeSelect">
          <a-button :type="formState.chromeExecPath ? 'primary' : 'default'">
            指定 chrome 执行文件
          </a-button>
        </a-upload>
        <span>
          {{ formState.chromeExecPath }}
        </span>
      </template>
    </template>
  </FormDialog>
</template>

<script setup lang="ts">
import models from '@/jsons/models.json'
import { useRoute, useRouter } from 'vue-router'
import { TinyEmitter as Emitter, TinyEmitter } from 'tiny-emitter'
import Mapper, { createByFields } from '@lib/types/mapper'
import api from '@/apis/model'
import { genDftFmProps } from '@/utils'
import Column from '@lib/types/column'
import project from '@/jsons/project.json'
import Page from '@/types/page'
import { onMounted, reactive, ref, watch, computed } from 'vue'
import Model from '@/types/model'
import Table from '@/types/table'
import useGlobalStore from '@/stores/global'
import { copies } from '@/types/index'
import Endpoint from '@/types/endpoint'
import { newOne, reqGet, rmvEndsOf } from '@lib/utils'
import SlotsTable from '@/components/slotsTable.vue'
import lgnAPI from '@/apis/login'
import { MoreOutlined, SyncOutlined, WarningOutlined } from '@ant-design/icons-vue'
import FormDialog from '@lib/components/FormDialog.vue'
import { Upload as AUpload, UploadChangeParam } from 'ant-design-vue'
import eptAPI from '@/apis/endpoint'

const route = useRoute()
const router = useRouter()
const mname = computed<string>(() => route.params.mname as string)
const model = reactive<Model>(new Model())
const table = reactive<Table>(new Table())
const columns = ref<Column[]>([])
const mapper = ref<Mapper>(new Mapper())
const emitter = new Emitter()
const chrome = useGlobalStore()
const pgModel = models.data.find((mdl: any) => mdl.name === 'page')
const pgCols = computed<Column[]>(() => [
  new Column('#', 'no', { width: 80 }),
  ...(pgModel?.table.columns || []).map((col: any) => Column.copy(col))
])
const pgEmitter = new TinyEmitter()
const cfgEmitter = new TinyEmitter()
const cfgMapper = new Mapper({
  chromeExecPath: {
    label: 'Chrome 执行文件路径',
    type: 'Unknown'
  }
})
const formState = reactive(useGlobalStore())
const chromePaths = reactive<string[]>([])
const idChrome = computed(() => chrome.chromeExecPath || false)
const upload = reactive({
  mapper: new Mapper({
    localPath: {
      type: 'Text',
      label: '待上传文件'
    },
    destPath: {
      type: 'Cascader',
      label: '投放位置',
      onChange: (_form: any, to: string[]) => {
        console.log(to)
      }
    },
    isFolder: {
      type: 'Checkbox',
      label: '是否为文件夹',
      disabled: true,
      placeholder: ''
    }
  }),
  isFolder: false,
  epKey: -1,
  emitter: new TinyEmitter()
})

onMounted(refresh)
watch(() => route.params.mname, refresh)

async function refresh() {
  if (!mname.value || typeof mname.value === 'undefined') {
    return
  }
  Model.copy(
    models.data.find((mdl: any) => mdl.name === mname.value),
    model,
    true
  )
  Table.copy(model.table, table, true)
  columns.value = table.columns.map((col: any) => Column.copy(col))
  mapper.value = createByFields(model.form.fields)
  emitter.emit('update:mapper', mapper.value)
  emitter.emit('refresh')
  const result = await window.ipcRenderer.invoke('detect-chrome')
  chromePaths.splice(0, chromePaths.length, ...result)
}
async function onLoginClick(epInfo: Endpoint) {
  Endpoint.copy(await reqGet('endpoint', epInfo.key), epInfo)
  await epInfo.decodeSlots()
  await window.ipcRenderer.invoke(
    'login-endpoint',
    JSON.stringify(epInfo),
    JSON.stringify(chrome.$state)
  )
}
async function onRecordsRefresh(records: any[], pcsFun: (pcsData: any) => void) {
  if (mname.value === 'endpoint') {
    for (let endpoint of records as Endpoint[]) {
      if (!endpoint.pages) {
        continue
      }
      await endpoint.decodeSlots()
    }
    pcsFun(records)
  }
}
async function onRecordEdit(record: any, newRcd = false) {
  if (mname.value === 'endpoint') {
    const endpoint = Endpoint.copy(record)
    if (newRcd) {
      const { payload } = await lgnAPI.verify()
      await api.link('account', payload.sub, 'fkEndpoints', endpoint.key)
    }
    router.push(`/${project.name}/endpoint/${endpoint.key}/edit`)
  }
}
async function onRecordExpand() {
  if (mname.value === 'endpoint') {
    pgEmitter.emit('refresh')
  }
}
function onChromeSelect(e: UploadChangeParam) {
  if (!e.file.originFileObj) {
    return
  }
  formState.chromeExecPath = e.file.originFileObj?.path as string
}
function onCfgDlgOpen() {
  cfgEmitter.emit('update:visible', {
    show: true,
    object: { chromeExecPath: chrome.chromeExecPath }
  })
}
function onCfgSubmit(_form: any, done: () => void) {
  done()
}
async function onUpldFlsChange(file: File, endpoint: Endpoint) {
  upload.epKey = endpoint.key
  const rootPath = rmvEndsOf(
    file.path,
    file.webkitRelativePath.substring(file.webkitRelativePath.indexOf('/') + 1)
  )
  upload.emitter.emit('update:visible', {
    show: true,
    object: { localPath: upload.isFolder ? rootPath : file.path, isFolder: upload.isFolder }
  })
  const paths = (await eptAPI(endpoint.key).sshCmd.exec('find / -type d -maxdepth 1')) as string[]
  upload.emitter.emit('update:mprop', {
    'destPath.options': paths.map(p => ({ value: p, label: p }))
  })
  return false
}
async function onUpldFlsSubmit(form: any, callback: Function) {
  const endpoint = (await api.get('endpoint', upload.epKey, { copy: Endpoint.copy })) as Endpoint
  await endpoint.decodeSlots()
  await window.ipcRenderer.invoke('upload-file', JSON.stringify(endpoint), JSON.stringify(form))
  callback()
  upload.epKey = -1
}
</script>
