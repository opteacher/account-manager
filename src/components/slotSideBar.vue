<template>
  <a-collapse v-model:activeKey="actKey" :bordered="false">
    <a-collapse-panel v-if="slotForm.element.xpath" key="1">
      <template #header>
        <a-tooltip>
          <template #title>{{ slotForm.element.xpath }}</template>
          <p class="mb-0 w-64 whitespace-nowrap overflow-hidden text-ellipsis">
            {{ slotForm.element.xpath }}
          </p>
        </a-tooltip>
      </template>
      <FormGroup
        layout="vertical"
        :fld-wid="24"
        :mapper="slotMapper"
        :form="slotForm"
        :rules="{
          value: [{ required: true, message: '必须填入值！' }]
        }"
        @update:fprop="values => Object.entries(values).map(([k, v]) => setProp(slotForm, k, v))"
      >
        <template #valuePFX="{ formState }: any">
          <a-button @click="() => onValEncSwitch(formState)">
            <template #icon>
              <LockOutlined v-if="formState.encrypt" />
              <UnlockOutlined v-else />
            </template>
          </a-button>
        </template>
      </FormGroup>
      <a-button class="w-full" type="primary" @click="onSlotSave">提交</a-button>
      <template #extra>
        <CloseOutlined @click="() => emitter.emit('stop-select')" />
      </template>
    </a-collapse-panel>
    <a-collapse-panel v-else-if="slots.length" key="2">
      <template #header>
        已关联槽&nbsp;
        <a-tag v-if="slots.length" color="#f50">
          {{ slots.length }}
        </a-tag>
      </template>
      <a-list class="slot-list" item-layout="horizontal">
        <template v-for="slot in slots" :key="slot.xpath">
          <a-list-item class="p-0">
            <a-list-item-meta>
              <template #title>
                <a-tooltip>
                  <template #title>{{ slot.element.xpath }}</template>
                  <a class="truncate" @click="() => emitter.emit('iden-ele', slot.element.xpath)">
                    {{ slot.element.xpath }}
                  </a>
                </a-tooltip>
              </template>
            </a-list-item-meta>
            <div v-if="slot.encrypt">●●●●</div>
            <div v-else>{{ slot.value }}</div>
            <template #actions>
              <a-button
                size="small"
                type="text"
                danger
                @click="() => onSlotRemove(slot.element.xpath)"
              >
                <template #icon><MinusCircleOutlined /></template>
              </a-button>
            </template>
          </a-list-item>
        </template>
      </a-list>
    </a-collapse-panel>
  </a-collapse>
</template>

<script setup lang="ts">
import FormGroup from '@lib/components/FormGroup.vue'
import Mapper from '@lib/types/mapper'
import {
  CloseOutlined,
  LockOutlined,
  UnlockOutlined,
  MinusCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons-vue'
import { Cond } from '@lib/types'
import { Modal } from 'ant-design-vue'
import { createVNode, PropType, reactive, ref } from 'vue'
import { setProp } from '@lib/utils'
import { TinyEmitter } from 'tiny-emitter'
import PageEle from '@lib/types/pageEle'
import PgOper, { otypes } from '@lib/types/pgOper'

const emit = defineEmits(['slotDel', 'submit'])
const props = defineProps({
  collecting: { type: Boolean, required: true },
  slots: { type: Array as PropType<PgOper[]>, required: true },
  emitter: { type: TinyEmitter, required: true }
})
const slotMapper = reactive(
  new Mapper({
    otype: {
      label: '填入方式',
      type: 'Select',
      options: Object.entries(otypes).map(([value, { label }]) => ({ value, label }))
    },
    value: {
      label: '填入值',
      type: 'Input',
      visible: false,
      display: [new Cond({ key: 'otype', cmp: '!=', val: 'click' })]
    },
    encrypt: {
      label: '加密值',
      type: 'Checkbox',
      display: false
    }
  })
)
const actKey = ref<string[]>([])
const slotForm = reactive<PgOper>(new PgOper())

props.emitter.on('ele-selected', (ele?: PageEle) => {
  slotForm.reset()
  if (!ele) {
    return
  }
  PageEle.copy(ele, slotForm.element, true)
  actKey.value = ['1']
  setProp(slotMapper, 'value.type', slotForm.encrypt ? 'Password' : 'Input')
})

function onSlotSave() {
  const idSlot = props.slots.find(slot => slot.element.xpath === slotForm.element.xpath)
  if (idSlot) {
    PgOper.copy(slotForm, idSlot, true)
  } else {
    props.slots.push(PgOper.copy(slotForm))
  }
  slotForm.reset()
  emit('submit', props.slots)
}
function onSlotRemove(xpath: string) {
  Modal.confirm({
    title: '确定删除该槽？',
    icon: createVNode(ExclamationCircleOutlined),
    onOk() {
      emit(
        'slotDel',
        props.slots.splice(
          props.slots.findIndex(slot => slot.element.xpath === xpath),
          1
        )
      )
    }
  })
}
function onValEncSwitch(formState: PgOper) {
  formState.encrypt = !formState.encrypt
  formState.value = ''
  setProp(slotMapper, 'value.type', formState.encrypt ? 'Password' : 'Input')
}
</script>

<style>
.slot-list .ant-list-item-meta-title {
  @apply truncate;
}
.slot-list .ant-list-item-action {
  @apply ms-0 !important;
}
</style>
