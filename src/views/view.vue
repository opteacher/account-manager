<template>
  <MainLayout>
    <iframe id="vwPage" class="w-full h-full" :src="page.url" />
  </MainLayout>
</template>

<script setup lang="ts">
import MainLayout from '@/layouts/main.vue'
import { onMounted, reactive } from 'vue'
import { useRoute } from 'vue-router'
import Page from '../types/page.ts'
import api from '../apis/model.ts'
import xpath from 'xpath'

const route = useRoute()
const page = reactive(new Page())

onMounted(async () => {
  Page.copy(await api.get('page', route.params.pid), page)
  const vwPage = document.getElementById('vwPage') as HTMLIFrameElement
  vwPage.onload = () => {
    const vwWdws = vwPage.contentWindow
    const vwDoc = vwWdws?.document
    for (const step of page.slots) {
      console.log(xpath.select(step.xpath, vwDoc as Document))
    }
  }
})
</script>
