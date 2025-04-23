<template>
  <MainLayout>
    <EditableTable
      :api="{
        all: () => api.all(mname),
        add: (record: any) => api.add(mname, record),
        update: (record: any) => api.update(mname, record.key, record),
        remove: (record: any) => api.remove(mname, record.key)
      }"
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
      @add="() => $router.push(`/${project.name}/page/n/edit`)"
      @edit="(record: any) => $router.push(`/${project.name}/page/${record.id}/edit`)"
    >
      <template v-if="$route.path === `/${project.name}/page`" #slots="{ record }">
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
      <template v-if="$route.path === `/${project.name}/page`" #operaBefore="{ record }">
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
import { useRoute } from 'vue-router'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import { createByFields } from '@lib/types/mapper'
import api from '@/apis/model'
import { genDftFmProps } from '@/utils'
import Column from '@lib/types/column'
import project from '@/jsons/project.json'
import puppeteer from 'puppeteer-core/lib/esm/puppeteer/puppeteer-core-browser.js'
import axios from 'axios'
import { notification } from 'ant-design-vue'
import Page from '@/types/page'

const route = useRoute()
const mname = route.params.mname as string
const model = (models as any)[mname]
const table = model.table
const columns = table.columns.map((col: any) => Column.copy(col))
const mapper = createByFields(model.form.fields)
const emitter = new Emitter()
const baseURL = import.meta.env.PROD ? 'http://127.0.0.1:9222' : undefined

async function onLgnPgClick(pgInfo: Page) {
  let resp = null
  try {
    resp = await axios.get('/json/version', { baseURL })
    if (resp.status !== 200) {
      throw new Error()
    }
    console.log(resp.data)
    let browserWSEndpoint = resp.data.webSocketDebuggerUrl
    if (import.meta.env.DEV) {
      browserWSEndpoint = browserWSEndpoint.replaceAll('ws://127.0.0.1:9222', '')
    }
    const browser = await puppeteer.connect({ browserWSEndpoint })
    const page = await browser.newPage()
    await Promise.all([page.goto(pgInfo.url), page.waitForNavigation()])
  } catch (e) {
    notification.error({
      message: '无法获取浏览器WS端点',
      description: 'Chrome快捷方式–右键属性–目标 在最后添加【--remote-debugging-port=9222】参数'
    })
    return
  }
}
</script>

<style>
.slot-table .ant-table {
  margin-block: 0 !important;
  margin-inline: 0 !important;
}
</style>
