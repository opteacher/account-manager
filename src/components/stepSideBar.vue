<script setup lang="ts">
import Endpoint from '@/types/endpoint'
import { computed, PropType, reactive, ref } from 'vue'
import { Steps as ASteps, Step as AStep } from 'ant-design-vue'
import Page from '@/types/page'
import { otypes } from '@lib/types/pgOper'
import { TinyEmitter } from 'tiny-emitter'
import { swchBoolProp } from '@lib/utils'
import FlexDivider from '@lib/components/FlexDivider.vue'

const emit = defineEmits(['click'])
const props = defineProps({
  endpoint: { type: Object as PropType<Endpoint>, required: true },
  disabled: { type: Boolean, default: false }
})
const items = computed<Page[]>(() =>
  props.endpoint.pages.concat([Page.copy({ url: '执行到下一步' })])
)
const current = ref(0)
const divider = reactive({
  width: 300,
  isHide: false,
  emitter: new TinyEmitter()
})

function onStepClick(stepIdx: number) {
  emit('click', stepIdx)
  current.value = stepIdx
}
</script>

<template>
  <div v-if="!divider.isHide" class="pe-2 flex flex-col" :style="{ width: divider.width + 'px' }">
    <div class="flex-1 relative">
      <a-steps direction="vertical" :current="current" @change="onStepClick">
        <a-step
          v-for="(page, index) in items"
          :disabled="disabled"
          :status="current === index ? 'process' : 'wait'"
        >
          <template #title>
            <div class="truncate">{{ page.url }}</div>
          </template>
          <template #description>
            <ul class="list-none ps-0">
              <li v-for="(slot, index) in page.slots" class="truncate space-x-2">
                {{ index + 1 }}.
                <a-tooltip>
                  <template #title>{{ otypes[slot.otype] }}</template>
                  <component :is="otypes[slot.otype].icon" />
                </a-tooltip>
                <a-tooltip>
                  <template #title>{{ slot.element.xpath }}</template>
                  <a>{{ slot.element.xpath }}</a>
                </a-tooltip>
              </li>
            </ul>
          </template>
        </a-step>
      </a-steps>
    </div>
    <slot name="bottom" />
  </div>
  <FlexDivider
    orientation="vertical"
    ctrlSide="leftTop"
    v-model:wid-hgt="divider.width"
    :is-hide="divider.isHide"
    :emitter="divider.emitter"
    :hbtnPos="{ bottom: '10px' }"
    hbtnTxt="步骤"
    @hbtn-click="() => swchBoolProp(divider, 'isHide')"
  />
</template>
