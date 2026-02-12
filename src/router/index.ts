import { invokeIPC } from '@/apis/ipc'
import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import Model from '../views/model.vue'
import login from '../views/login.vue'
import project from '@/jsons/project.json'
import Endpoint from '../views/endpoint.vue'
import useGlobalStore from '@/stores/global'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: `/${project.name}/`
  },
  {
    path: `/${project.name}/`,
    redirect: `/${project.name}/login`
  },
  {
    path: `/${project.name}/:mname`,
    name: 'model',
    component: Model,
    meta: { reqLogin: true }
  },
  {
    path: `/${project.name}/endpoint/:eid/edit`,
    name: 'Endpoint',
    component: Endpoint,
    meta: { reqLogin: true }
  },
  {
    path: '/login_platform/login',
    name: 'login',
    component: login
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach(async (to, _from, next) => {
  if (to.matched.some(record => record.meta.reqLogin) && true) {
    try {
      await invokeIPC('api:account:verify', useGlobalStore().token)
      next()
    } catch (e) {
      next({
        path: '/login_platform/login',
        query: {
          redirect: to.fullPath
        }
      })
    }
  } else {
    next() // 确保一定要调用 next()
  }
})

export default router
