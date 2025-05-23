<template>
  <MainLayout>
    <EditableTable
      :api="{
        all: () => api.all(mname, { copy: copies[mname] }),
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
      @after-save="onRecordEdit"
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
        <a-button type="primary" size="small" @click.stop="() => onLoginClick(record)">
          登录
        </a-button>
      </template>
    </EditableTable>
  </MainLayout>
</template>

<script setup lang="ts">
import MainLayout from '@/layouts/main.vue'
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
import useChromeStore from '@/stores/chrome'
import { copies } from '@/types/index'
import Endpoint from '@/types/endpoint'
import { newOne, reqGet } from '@lib/utils'
import SlotsTable from '@/components/slotsTable.vue'

const route = useRoute()
const router = useRouter()
const mname = ref<string>('')
const model = reactive<Model>(new Model())
const table = reactive<Table>(new Table())
const columns = ref<Column[]>([])
const mapper = ref<Mapper>(new Mapper())
const emitter = new Emitter()
const chrome = useChromeStore()
const pgModel = models.data.find((mdl: any) => mdl.name === 'page')
const pgCols = computed<Column[]>(() => [
  new Column('#', 'no', { width: 80 }),
  ...(pgModel?.table.columns || []).map((col: any) => Column.copy(col))
])
const pgEmitter = new TinyEmitter()

onMounted(refresh)
watch(() => route.params.mname, refresh)

function refresh() {
  mname.value = route.params.mname as string
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
function onRecordEdit(record: any) {
  if (mname.value === 'endpoint') {
    const endpoint = Endpoint.copy(record)
    router.push(`/${project.name}/endpoint/${endpoint.key}/edit`)
  }
}
async function onRecordExpand() {
  if (mname.value === 'endpoint') {
    pgEmitter.emit('refresh')
  }
}
</script>
