<template>
  <a-layout class="h-full overflow-y-hidden">
    <a-layout-header class="pl-0 pr-5 flex">
      <div class="h-full p-2.5 bg-white" style="width: 200px">
        <div class="h-full bg-gray-300 rounded-sm" />
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
      <a-layout-sider
        class="h-full flex flex-col"
        width="200"
        v-model:collapsed="collapsed"
        :trigger="null"
        collapsible
      >
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
          <a-menu-item key="page/n/edit">
            <FormOutlined />
            <span>编辑页面</span>
          </a-menu-item>
          <a-menu-item v-if="sideKeys.includes('page/n/view')" key="page/n/view">
            <EyeOutlined />
            <span>查看页面</span>
          </a-menu-item>
        </a-menu>
        <a-menu>
          <a-menu-item class="text-center" @click="() => (collapsed = !collapsed)">
            <menu-unfold-outlined v-if="collapsed" class="text-lg" />
            <menu-fold-outlined v-else class="text-lg" />
          </a-menu-item>
        </a-menu>
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
import router from '../router'
import { SelectInfo } from 'ant-design-vue/lib/menu/src/interface'
import { type Component, onMounted, reactive, ref } from 'vue'
import project from '@/jsons/project.json'
import models from '@/jsons/models.json'
import { useRoute } from 'vue-router'
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

const route = useRoute()
const sdNavMdls = ref<{ name: string; label: string; icon: string }[]>([])
const sideKeys = reactive<string[]>([])
const openKeys = reactive<string[]>([])
const collapsed = ref(false)

onMounted(async () => {
  const mdls = Object.values(models).filter((model: any) => model.disp)
  for (const mname of Object.keys(models)) {
    try {
      await api.all(mname, { axiosConfig: { params: { limit: 1 } } })
    } catch (e) {
      mdls.splice(
        mdls.findIndex((mdl: any) => mdl.name === mname),
        1
      )
    }
  }
  sdNavMdls.value = mdls as { name: string; label: string; icon: string }[]
  actSideKeys(route.path)
})
router.beforeEach(to => actSideKeys(to.path))

function actSideKeys(path: string) {
  const subPath = rmvStartsOf(path, `/${project.name}/`)
  let fixPath = subPath
  if (/\/?page\/\d+\/edit$/.test(subPath)) {
    fixPath = 'page/n/edit'
  } else if (/\/?page\/\d+\/view$/.test(subPath)) {
    fixPath = 'page/n/view'
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
