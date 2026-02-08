<template>
  <div class="model-container">
    <div class="model-header">
      <a-typography-title class="page-title" :level="3">
        {{ model.label }}
      </a-typography-title>
      <a-typography-paragraph class="page-description">
        使用 SSH 登录时请确保本地系统已安装 sshpass 应用，Windows 系统需安装 Linux
        子系统，并在子系统中安装 sshpass
      </a-typography-paragraph>
    </div>

    <div class="model-content">
      <EditableTable
        :api="{
          all: () =>
            api.all(mname, { copy: copies[mname], type: mname === 'endpoint' ? 'api' : 'mdl' }),
          add: (record: any) => api.add(mname, record),
          update: (record: any) => api.update(mname, record.key, record),
          remove: (record: any) => api.remove(mname, record.key)
        }"
        :title="model.label"
        description="管理您的数据记录"
        sclHeight="calc(100vh - 200px)"
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
          <div class="expanded-row">
            <EditableTable
              :api="{
                all: () =>
                  api
                    .get('endpoint', endpoint.key, { copy: Endpoint.copy })
                    .then((ep: Endpoint) => ep.pages),
                remove: (pg: Page) =>
                  api
                    .link(['endpoint', endpoint.key], ['fkPages', pg.key], false)
                    .then(() => api.remove('page', pg.key))
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
          </div>
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
                <a-button size="small" @click="() => (upload.isFolder = true)">文件夹</a-button>
              </a-input-group>
            </a-upload>
          </a-space>
        </template>
        <template v-if="route.path === `/${project.name}/endpoint`" #extra>
          <a-space>
            <a-button v-if="idChrome" @click="onCfgDlgOpen" class="config-btn">
              <template #icon><MoreOutlined /></template>
              配置
            </a-button>
            <a-tooltip v-else placement="bottomRight">
              <template #title>
                <WarningOutlined />
                还未指定 Chrome 执行文件！
              </template>
              <a-button type="primary" danger class="config-btn" @click="onCfgDlgOpen">
                <template #icon><MoreOutlined /></template>
                配置
              </a-button>
            </a-tooltip>
          </a-space>
        </template>
      </EditableTable>
    </div>

    <FormDialog
      title="上传文件（夹）"
      :mapper="upload.mapper"
      :emitter="upload.emitter"
      :new-fun="() => ({ localPath: '', destPath: [], isFolder: false, coverExists: true })"
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
          <a-button @click="refresh" class="refresh-btn">
            <template #icon><SyncOutlined /></template>
          </a-button>
        </a-input-group>
        <template v-else>
          <a-upload
            name="file"
            :showUploadList="false"
            @change="onChromeSelect"
            class="chrome-upload"
          >
            <a-button :type="formState.chromeExecPath ? 'primary' : 'default'">
              指定 Chrome 执行文件
            </a-button>
          </a-upload>
          <span class="chrome-path-display">{{ formState.chromeExecPath }}</span>
        </template>
      </template>
    </FormDialog>
  </div>
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
import { getProp, newOne, reqGet, rmvEndsOf } from '@lib/utils'
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
      onChange: async (_form: { destPath: string[] }, to?: string[]) => {
        upload.emitter.emit('update:mprop', { 'destPath.loading': true })
        const destPath = to || []
        const paths = (await eptAPI(upload.epKey).sshCmd.exec(
          `find /${destPath.join('/')} -type d -maxdepth 1`
        )) as string[]
        let options = getProp(upload.mapper, 'destPath.options')
        for (let i = 0; i < destPath.length; ++i) {
          const option = options.find((itm: any) => itm.value === destPath[i])
          if (!option) {
            throw new Error('Cannot find option for ' + destPath[i])
          }
          if (i === destPath.length - 1) {
            option.children = paths.map(p => ({ value: p, label: p }))
          } else {
            options = option.children as any[]
          }
        }
        upload.emitter.emit('update:mprop', {
          'destPath.loading': false
        })
      }
    },
    isFolder: {
      type: 'Switch',
      label: '是否为文件夹',
      disabled: true
    },
    coverExists: {
      type: 'Switch',
      label: '覆盖已存在文件'
    }
  }),
  isFolder: false,
  epKey: -1,
  emitter: new TinyEmitter(),
  loading: false
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
  await window.ipcRenderer.invoke('login-endpoint', JSON.stringify(epInfo), JSON.stringify(chrome))
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
      await api.link(['account', payload.sub], ['fkEndpoints', endpoint.key])
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
  let suffix = file.webkitRelativePath.substring(file.webkitRelativePath.indexOf('/') + 1)
  if (navigator.platform.startsWith('Win')) {
    suffix = suffix.split('/').join('\\')
  }
  const rootPath = rmvEndsOf(file.path, suffix)
  upload.emitter.emit('update:visible', {
    show: true,
    object: {
      localPath: upload.isFolder ? rootPath : file.path,
      isFolder: upload.isFolder,
      coverExists: true
    }
  })
  upload.emitter.emit('update:mprop', { 'destPath.loading': true })
  const paths = (await eptAPI(endpoint.key).sshCmd.exec('find / -type d -maxdepth 1')) as string[]
  upload.emitter.emit('update:mprop', {
    'destPath.options': paths.map(p => ({ value: p, label: p })),
    'destPath.loading': false
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

<style scoped>
.model-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--gray-50);
}

.model-header {
  background: white;
  padding: 24px;
  border-bottom: 1px solid var(--border);
}

.page-title {
  margin: 0 0 8px 0;
  color: var(--text-primary);
  font-weight: var(--font-semibold);
  font-size: var(--text-2xl);
}

.page-description {
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}

.model-content {
  flex: 1;
  padding: 24px;
  overflow: hidden;
}

.expanded-row {
  padding: 16px;
  background: var(--gray-50);
  border-radius: var(--radius-base);
}

.config-btn {
  height: 32px;
  border-radius: var(--radius-sm);
  font-weight: var(--font-medium);
  font-size: var(--text-sm);
}

.config-btn:hover {
  background: var(--gray-50);
}

.chrome-upload {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chrome-path-display {
  color: var(--text-secondary);
  font-size: var(--text-sm);
}

.refresh-btn {
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.ant-table-thead > tr > th) {
  background: var(--gray-50);
  color: var(--text-primary);
  font-weight: var(--font-semibold);
  font-size: var(--text-sm);
  border-bottom: 2px solid var(--border);
}

:deep(.ant-table-tbody > tr > td) {
  color: var(--text-primary);
  font-size: var(--text-sm);
  padding: 12px 16px;
}

:deep(.ant-table-tbody > tr:hover > td) {
  background: var(--primary-50);
}

:deep(.ant-table-cell-fix-left) {
  border-left: none;
}

:deep(.ant-table-cell-fix-right) {
  border-right: none;
}

@media (max-width: 768px) {
  .model-header {
    padding: 16px;
  }

  .model-content {
    padding: 16px;
  }

  .page-title {
    font-size: var(--text-xl);
  }
}
</style>
