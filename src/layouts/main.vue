<template>
  <a-layout class="h-full overflow-y-hidden">
    <a-layout-header class="pl-0 pr-5 flex">
      <div class="h-full p-2.5 bg-white" :style="{ width: '200px' }">
        <div
          class="h-full bg-gray-300 rounded-sm hover:cursor-pointer hover:bg-gray-200"
          @click="() => router.push('/')"
        />
      </div>
      <div class="flex flex-1 leading-16 justify-between">
        <div />
        <a-popover v-if="(project.auth as any).model" placement="bottomRight">
          <template #content>
            <a-button type="primary" danger ghost @click="onLogoutClick">退出</a-button>
          </template>
          <a-button class="h-full w-16 rounded-none text-gray-300 hover:text-primary" type="text">
            <template #icon><UserOutlined class="text-2xl leading-none" /></template>
          </a-button>
        </a-popover>
      </div>
    </a-layout-header>
    <a-layout class="h-full">
      <a-layout-sider width="200" v-model:collapsed="collapsed" :trigger="null" collapsible>
        <a-menu
          :selectedKeys="sideKeys"
          :openKeys="openKeys"
          mode="inline"
          class="flex-1 border-r-0"
          theme="dark"
          @select="onMuItmSelect"
        >
          <a-menu-item key="home">
            <HomeOutlined />
            <span>首页</span>
          </a-menu-item>
          <a-menu-item v-for="model in sdNavMdls" :key="model.name">
            <keep-alive v-if="model.icon">
              <component :is="getIconCompo(model.icon)" />
            </keep-alive>
            <span>{{ model.label }}</span>
          </a-menu-item>
          <a-menu-item key="endpoint/n/edit">
            <FormOutlined />
            <span>编辑页面</span>
          </a-menu-item>
          <a-menu-item v-if="sideKeys.includes('page/n/view')" key="page/n/view">
            <EyeOutlined />
            <span>查看页面</span>
          </a-menu-item>
        </a-menu>
        <a-button class="w-full rounded-none" size="large" @click="() => (collapsed = !collapsed)">
          <template #icon>
            <menu-unfold-outlined v-if="collapsed" class="text-lg" />
            <menu-fold-outlined v-else class="text-lg" />
          </template>
        </a-button>
      </a-layout-sider>
      <a-layout>
        <a-layout-content class="bg-gray-300 p-2.5 m-0 h-full">
          <div class="bg-white h-full p-2.5"><slot /></div>
        </a-layout-content>
      </a-layout>
    </a-layout>
  </a-layout>
</template>

<script lang="ts" setup>
import { SelectInfo } from 'ant-design-vue/lib/menu/src/interface'
import { type Component, onMounted, reactive, ref } from 'vue'
import project from '@/jsons/project.json'
import models from '@/jsons/models.json'
import { useRoute, useRouter } from 'vue-router'
import {
  UserOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  HomeOutlined,
  FormOutlined,
  EyeOutlined
} from '@ant-design/icons-vue'
import api from '@/apis/model'
import { rmvStartsOf } from '@lib/utils'
import * as antdIcons from '@ant-design/icons-vue/lib/icons'
import Model from '@/types/model'

const route = useRoute()
const router = useRouter()
const sdNavMdls = ref<Model[]>([])
const sideKeys = reactive<string[]>([])
const openKeys = reactive<string[]>([])
const collapsed = ref(true)

onMounted(async () => {
  const mdls = models.data.filter((model: any) => model.disp)
  for (const mname of mdls.map(mdl => mdl.name)) {
    try {
      await api.all(mname, { messages: { notShow: true }, axiosConfig: { params: { limit: 1 } } })
    } catch (e) {
      mdls.splice(
        mdls.findIndex((mdl: any) => mdl.name === mname),
        1
      )
    }
  }
  sdNavMdls.value = mdls.map(mdl => Model.copy(mdl))
  actSideKeys(route.path)
})
router.beforeEach(to => actSideKeys(to.path))

function actSideKeys(path: string) {
  const subPath = rmvStartsOf(path, `/${project.name}/`)
  let fixPath = subPath
  if (/\/?endpoint\/\d+\/edit$/.test(subPath)) {
    fixPath = 'endpoint/n/edit'
  } else if (/\/?endpoint\/\d+\/view$/.test(subPath)) {
    fixPath = 'endpoint/n/view'
  }
  sideKeys.splice(0, sideKeys.length, fixPath)
}
function onMuItmSelect(params: SelectInfo) {
  router.push(`/${project.name}/${(params.keyPath || []).join('/')}`)
}
function onLogoutClick() {
  window.localStorage.removeItem('token')
  router.replace({ path: `/${project.name}/login`, replace: true })
}
function getIconCompo(name: string): Component {
  return (antdIcons as Record<string, Component>)[name]
}
</script>

<style>
.ant-layout-sider-children {
  @apply flex;
  @apply flex-col;
}
</style>
