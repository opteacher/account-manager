import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import Home from '@/views/home.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/account-manager'
  },
  {
    path: '/account-manager',
    redirect: '/account-manager/home'
  },
  {
    path: '/account-manager/home',
    name: 'Home',
    component: Home
  }
]

export default createRouter({
  history: createWebHistory(),
  routes
})