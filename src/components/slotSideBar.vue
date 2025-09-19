<template>
  <a-collapse v-model:activeKey="actKey" :bordered="false">
    <a-collapse-panel v-if="selKeys.length" key="1">
      <template #header>
        <a-tooltip>
          <template #title>{{ selKeys[0] }}</template>
          <p class="mb-0 w-64 whitespace-nowrap overflow-hidden text-ellipsis">
            {{ selKeys[0] }}
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
        <template #valuePFX="{ formState }">
          <a-button @click="() => onValEncSwitch(formState)">
            <template #icon>
              <LockOutlined v-if="formState.valEnc" />
              <UnlockOutlined v-else />
            </template>
          </a-button>
        </template>
      </FormGroup>
      <a-button class="w-full" type="primary" @click="onSlotSave">提交</a-button>
      <template #extra>
        <CloseOutlined @click="() => emit('update:selKeys', [])" />
      </template>
    </a-collapse-panel>
    <a-collapse-panel v-else-if="form.slots.length" key="2">
      <template #header>
        已关联槽&nbsp;
        <a-tag v-if="form.slots.length" color="#f50">
          {{ form.slots.length }}
        </a-tag>
      </template>
      <a-list class="slot-list" item-layout="horizontal">
        <template v-for="slot in form.slots" :key="slot.xpath">
          <a-list-item class="p-0">
            <a-list-item-meta>
              <template #title>
                <a class="truncate" @click="() => emit('update:selKeys', [slot.xpath])">
                  {{ slot.xpath }}
                </a>
              </template>
            </a-list-item-meta>
            <div v-if="slot.valEnc">●●●●</div>
            <div v-else>{{ slot.value }}</div>
            <template #actions>
              <a-button size="small" type="text" danger @click="() => onSlotRemove(slot.xpath)">
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
import { createVNode, PropType, reactive, ref, watch } from 'vue'
import Page, { Slot } from '@/types/page'
import { setProp } from '@lib/utils'

const emit = defineEmits(['update:selKeys', 'slotDel', 'submit'])
const props = defineProps({
  collecting: { type: Boolean, required: true },
  form: { type: Object as PropType<Page>, required: true },
  selKeys: { type: Array as PropType<(string | number)[]>, required: true }
})
const slotMapper = reactive(
  new Mapper({
    itype: {
      label: '填入方式',
      type: 'Select',
      options: [
        {
          label: '输入',
          value: 'input'
        },
        {
          label: '选择',
          value: 'select'
        },
        {
          label: '点击',
          value: 'click'
        }
      ]
    },
    value: {
      label: '填入值',
      type: 'Input',
      visible: false,
      display: [new Cond({ key: 'itype', cmp: '!=', val: 'click' })]
    },
    valEnc: {
      label: '加密值',
      type: 'Checkbox',
      display: false
    }
  })
)
const actKey = ref<string[]>([])
const slotForm = reactive<Slot>(new Slot())

watch(
  () => props.selKeys,
  () => {
    if (!props.selKeys.length) {
      slotForm.reset()
      return
    }
    Slot.copy(
      props.form.slots.find(slot => slot.xpath === props.selKeys[0]),
      slotForm,
      true
    )
    slotForm.xpath = props.selKeys[0] as string
    actKey.value = ['1']
    setProp(slotMapper, 'value.type', slotForm.valEnc ? 'Password' : 'Input')
  },
  { deep: true }
)

function onSlotSave() {
  const idSlot = props.form.slots.find(slot => slot.xpath === props.selKeys[0])
  if (idSlot) {
    Slot.copy(slotForm, idSlot, true)
  } else {
    props.form.slots.push(Slot.copy(slotForm))
  }
  slotForm.reset()
  emit('update:selKeys', [])
}
function onSlotRemove(xpath: string) {
  Modal.confirm({
    title: '确定删除该槽？',
    icon: createVNode(ExclamationCircleOutlined),
    onOk() {
      emit(
        'slotDel',
        props.form.slots.splice(
          props.form.slots.findIndex(slot => slot.xpath === xpath),
          1
        )
      )
    }
  })
}
function onValEncSwitch(formState: any) {
  setProp(formState, 'valEnc', !formState.valEnc)
  setProp(formState, 'value', '')
  setProp(slotMapper, 'value.type', formState.valEnc ? 'Password' : 'Input')
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
