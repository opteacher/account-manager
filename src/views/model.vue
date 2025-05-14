<template>
  <MainLayout>
    <EditableTable
      :api="{
        all: () => api.all(mname, { copy: copies[mname] }),
        add: (record: any) => api.add(mname, record),
        update: (record: any) => api.update(mname, record.key, record),
        remove: (record: any) => api.remove(mname, record.key)
      }"
      title="@"
      description="使用ssh登录时请确保本地系统已安装sshpass应用，Windows系统需安装Linux子系统，并在子系统中安装sshpass！"
      sclHeight="h-full"
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
      @add="() => router.push(`/${project.name}/page/n/edit`)"
      @edit="(record: any) => router.push(`/${project.name}/page/${record.key}/edit`)"
    >
      <template v-if="route.path === `/${project.name}/endpoint`" #expandedRowRender="{ record }">
        {{ record }}
      </template>
      <template v-if="route.path === `/${project.name}/page`" #slots="{ record }">
        <a-table
          class="slot-table"
          size="small"
          :pagination="false"
          :columns="[
            { title: '步骤', dataIndex: 'index' },
            { title: 'xpath', dataIndex: 'xpath' },
            { title: '操作类型', dataIndex: 'itype' },
            { title: '加密值', dataIndex: 'valEnc' },
            { title: '值', dataIndex: 'value' }
          ]"
          :data-source="record.slots"
        >
          <template #bodyCell="{ column, text, index, record }">
            <template v-if="column.dataIndex === 'index'">
              {{ index + 1 }}
            </template>
            <template v-else-if="column.dataIndex === 'valEnc'">
              {{ text ? '加密' : '不加密' }}
            </template>
            <template v-else-if="column.dataIndex === 'value'">
              {{ record.valEnc ? '●●●●●●●●' : text }}
            </template>
          </template>
        </a-table>
      </template>
      <template v-if="route.path === `/${project.name}/page`" #operaBefore="{ record }">
        <a-button type="primary" size="small" @click.stop="() => onLgnPgClick(record)">
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
import { TinyEmitter as Emitter } from 'tiny-emitter'
import Mapper, { createByFields } from '@lib/types/mapper'
import api from '@/apis/model'
import { genDftFmProps } from '@/utils'
import Column from '@lib/types/column'
import project from '@/jsons/project.json'
import Page from '@/types/page'
import { onMounted, reactive, ref, watch } from 'vue'
import Model from '@/types/model'
import Table from '@/types/table'
import useChromeStore from '@/stores/chrome'
import { copies } from '@/types/index'

const route = useRoute()
const router = useRouter()
const mname = ref<string>('')
const model = reactive<Model>(new Model())
const table = reactive<Table>(new Table())
const columns = ref<Column[]>([])
const mapper = ref<Mapper>(new Mapper())
const emitter = new Emitter()
const chrome = useChromeStore()

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
async function onLgnPgClick(pgInfo: Page) {
  await window.ipcRenderer.invoke(
    'login-page',
    JSON.stringify(pgInfo),
    JSON.stringify(chrome.$state)
  )
}
async function onRecordsRefresh(records: any[], pcsFun: (pcsData: any) => void) {
  for (let record of records) {
    record.slots = await Promise.all(
      record.slots.map(async (slot: any) => {
        if (slot.valEnc) {
          slot.value = await window.ipcRenderer.invoke(
            'decode-value',
            localStorage.getItem('token'),
            JSON.stringify(slot.value)
          )
        }
        return slot
      })
    )
  }
  pcsFun(records)
}
</script>

<style>
.slot-table .ant-table {
  margin-block: 0 !important;
  margin-inline: 0 !important;
}
</style>
