<template>
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

<script setup lang="ts">
import Page from '@/types/page'
import { PropType } from 'vue'

defineProps({
  record: { type: Object as PropType<Page>, required: true }
})
</script>

<style>
.slot-table .ant-table {
  margin-block: 0 !important;
  margin-inline: 0 !important;
}
</style>
