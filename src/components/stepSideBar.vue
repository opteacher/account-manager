<script setup lang="ts">
import Endpoint from '@/types/endpoint'
import { computed, PropType, ref } from 'vue'
import { Steps as ASteps } from 'ant-design-vue'
import Page, { itypes } from '@/types/page'
import { DownloadOutlined, EditOutlined, SelectOutlined } from '@ant-design/icons-vue'

const emit = defineEmits(['click'])
const props = defineProps({
  endpoint: { type: Object as PropType<Endpoint>, required: true }
})
const items = computed<Page[]>(() =>
  props.endpoint.pages.concat([Page.copy({ url: '执行到下一步' })])
)
const current = ref(0)
const iconDict = {
  input: EditOutlined,
  click: DownloadOutlined,
  select: SelectOutlined
}

function onStepClick(stepIdx: number) {
  emit('click', stepIdx)
}
</script>

<template>
  <a-steps direction="vertical" :current="current" @change="onStepClick">
    <a-step v-for="page in items" :title="page.url">
      <template #description>
        <ul class="list-none ps-0">
          <li v-for="(slot, index) in page.slots" class="truncate space-x-2">
            {{ index + 1 }}.
            <a-tooltip>
              <template #title>{{ itypes[slot.itype] }}</template>
              <component :is="iconDict[slot.itype]" />
            </a-tooltip>
            <a-tooltip>
              <template #title>{{ slot.xpath }}</template>
              <a>{{ slot.xpath }}</a>
            </a-tooltip>
          </li>
        </ul>
      </template>
    </a-step>
  </a-steps>
</template>
