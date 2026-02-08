<template>
  <a-config-provider :locale="zhCN">
    <a-layout class="h-full overflow-hidden">
      <a-layout-header
        v-if="route.path !== '/login_platform/login'"
        class="app-header"
      >
        <div class="header-content">
          <a-space class="logo-section" align="center" @click="onLogoClick">
            <a-avatar class="logo-avatar" :src="logo" />
            <a-typography-title v-if="!collapsed" class="logo-title" :level="5">
              密钥登录管理平台
            </a-typography-title>
          </a-space>

          <div class="header-actions">
            <a-popover v-if="(project.auth as any).model" placement="bottomRight">
              <template #content>
                <div class="user-dropdown">
                  <a-button type="text" class="dropdown-item" @click="onProfileClick">
                    <UserOutlined class="item-icon" />
                    个人中心
                  </a-button>
                  <a-divider class="dropdown-divider" />
                  <a-button type="text" danger class="dropdown-item" @click="onLogoutClick">
                    <LogoutOutlined class="item-icon" />
                    退出登录
                  </a-button>
                </div>
              </template>
              <a-button class="user-button" type="text">
                <UserOutlined class="user-icon" />
              </a-button>
            </a-popover>
          </div>
        </div>
      </a-layout-header>

      <a-layout class="h-full">
        <a-layout-sider
          v-if="route.path !== '/login_platform/login'"
          width="200"
          v-model:collapsed="collapsed"
          :trigger="null"
          collapsible
          class="app-sider"
        >
          <div class="sider-content">
            <a-menu
              :selectedKeys="sideKeys"
              :openKeys="openKeys"
              mode="inline"
              class="sider-menu"
              theme="light"
              @select="onMuItmSelect"
            >
              <a-menu-item v-for="model in sdNavMdls" :key="model.name">
                <template #icon>
                  <component :is="getIconCompo(model.icon)" />
                </template>
                <span>{{ model.label }}</span>
              </a-menu-item>
              <a-menu-item key="endpoint/n/edit">
                <template #icon>
                  <FormOutlined />
                </template>
                <span>编辑页面</span>
              </a-menu-item>
            </a-menu>

            <a-button
              class="collapse-button"
              size="large"
              @click="() => (collapsed = !collapsed)"
            >
              <template #icon>
                <MenuUnfoldOutlined v-if="collapsed" class="collapse-icon" />
                <MenuFoldOutlined v-else class="collapse-icon" />
              </template>
            </a-button>
          </div>
        </a-layout-sider>

        <a-layout>
          <a-layout-content class="app-content">
            <div class="content-wrapper">
              <router-view />
            </div>
          </a-layout-content>
        </a-layout>
      </a-layout>
    </a-layout>
  </a-config-provider>
</template>

<script lang="ts" setup>
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import { SelectInfo } from 'ant-design-vue/lib/menu/src/interface'
import { type Component, onMounted, reactive, ref } from 'vue'
import project from '@/jsons/project.json'
import models from '@/jsons/models.json'
import { useRoute, useRouter } from 'vue-router'
import {
  UserOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  FormOutlined,
  LogoutOutlined
} from '@ant-design/icons-vue'
import api from '@/apis/model'
import { rmvStartsOf } from '@lib/utils'
import * as antdIcons from '@ant-design/icons-vue/lib/icons'
import Model from '@/types/model'
import logo from '@/assets/Emblem.png'
import useGlobalStore from './stores/global'

const store = useGlobalStore()
const route = useRoute()
const router = useRouter()
const sdNavMdls = ref<Model[]>([])
const sideKeys = reactive<string[]>([])
const openKeys = reactive<string[]>([])
const collapsed = ref(false)

onMounted(refresh)
router.beforeEach(to => refresh(to.path))

async function refresh(toPath?: string) {
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
  actSideKeys(toPath || route.path)
}

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
  store.token = ''
  router.replace({ path: `/${project.name}/login`, replace: true })
}

function onProfileClick() {
  router.push(`/${project.name}/profile`)
}

function onLogoClick() {
  router.push(`/${project.name}/`)
}

function getIconCompo(name: string): Component {
  return (antdIcons as Record<string, Component>)[name]
}
</script>

<style scoped>
.app-header {
  background: white;
  border-bottom: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  padding: 0;
  height: 64px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  padding: 0 24px;
  max-width: 1920px;
  margin: 0 auto;
}

.logo-section {
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.logo-section:hover {
  opacity: 0.8;
}

.logo-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
}

.logo-title {
  margin: 0 0 0 12px;
  color: var(--text-primary);
  font-weight: var(--font-semibold);
  letter-spacing: -0.01em;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.user-button {
  padding: 8px;
  height: auto;
  color: var(--text-secondary);
}

.user-button:hover {
  color: var(--primary);
  background: var(--primary-50);
}

.user-icon {
  font-size: 20px;
}

.user-dropdown {
  min-width: 160px;
}

.dropdown-item {
  width: 100%;
  height: 40px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--text-sm);
  color: var(--text-primary);
  text-align: left;
}

.dropdown-item:hover {
  color: var(--primary);
  background: var(--primary-50);
}

.dropdown-item.danger {
  color: var(--error-500);
}

.dropdown-item.danger:hover {
  color: var(--error-600);
  background: var(--error-50);
}

.item-icon {
  font-size: 16px;
}

.dropdown-divider {
  margin: 4px 0;
}

.app-sider {
  background: white;
  border-right: 1px solid var(--border);
}

.sider-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sider-menu {
  flex: 1;
  border-right: none;
  padding: 8px 0;
}

:deep(.sider-menu .ant-menu-item) {
  margin: 4px 8px;
  border-radius: var(--radius-sm);
  height: 40px;
  line-height: 40px;
  color: var(--text-primary);
  font-size: var(--text-sm);
  transition: all 0.2s ease;
}

:deep(.sider-menu .ant-menu-item:hover) {
  color: var(--primary);
  background: var(--primary-50);
}

:deep(.sider-menu .ant-menu-item-selected) {
  color: white;
  background: var(--primary);
  font-weight: var(--font-medium);
}

:deep(.sider-menu .ant-menu-item-selected .anticon) {
  color: white;
}

.collapse-button {
  width: 100%;
  height: 48px;
  border-top: 1px solid var(--border);
  border-radius: 0;
  background: white;
  color: var(--text-secondary);
}

.collapse-button:hover {
  color: var(--primary);
  background: var(--gray-50);
}

.collapse-icon {
  font-size: 18px;
}

.app-content {
  background: var(--gray-50);
  overflow-y: auto;
}

.content-wrapper {
  min-height: calc(100vh - 64px);
  padding: 24px;
}

@media (max-width: 768px) {
  .header-content {
    padding: 0 16px;
  }

  .logo-title {
    display: none;
  }

  .content-wrapper {
    padding: 16px;
  }

  .app-sider {
    position: absolute;
    z-index: 1000;
    height: calc(100vh - 64px);
    box-shadow: var(--shadow-lg);
  }
}
</style>
