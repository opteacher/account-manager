import axios from 'axios'
import { makeRequest } from '@lib/utils'
import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import Model from '../views/model.vue'
import login from '../views/login.vue'
import project from '@/jsons/project.json'
import Home from '../views/home.vue'
import Endpoint from '../views/endpoint.vue'
import View from '../views/view.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: `/${project.name}/`
  },
  {
    path: `/${project.name}/`,
    redirect: `/${project.name}/home`
  },
  {
    path: `/${project.name}/home`,
    name: 'Home',
    component: Home,
    meta: { reqLogin: true }
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
  },
  {
    path: '/login_platform/page/:pid/view',
    name: 'View',
    component: View,
    meta: { reqLogin: true }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach(async (to, _from, next) => {
  if (to.matched.some(record => record.meta.reqLogin) && true) {
    try {
      const result = await makeRequest(
        axios.post([
          '/login_platform',
          '/api/v1/',
          'account',
          '/verify'
        ].join(''), undefined, {
          headers: { authorization: 'Bearer ' + (localStorage.getItem('token') || '') }
        })
      )
      if (result.error) {
        throw new Error(result.data.error)
      }
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
