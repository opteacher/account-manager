<template>
  <div :style="{ width: sideWid + 'px' }">
    <div class="h-full flex flex-col">
      <a-spin wrapperClassName="flex-1" tip="页面元素收集中..." :spinning="collecting">
        <a-tree
          class="overflow-auto absolute top-0 bottom-0 left-0 right-0"
          :auto-expand-parent="true"
          :tree-data="props.treeData"
          v-model:expendedKeys="expKeys"
          :selectedKeys="props.selKeys"
          @select="(selKeys: string[]) => emit('update:selKeys', selKeys)"
        >
          <template #title="{ dataRef }">
            {{ dataRef.element ? dataRef.element.tagName : dataRef.title }}&nbsp;
            <template v-if="dataRef.element">
              <span v-if="dataRef.element.id">#{{ dataRef.element.id }}</span>
              <span v-else-if="dataRef.element.clazz">.{{ dataRef.element.clazz }}</span>
            </template>
          </template>
        </a-tree>
      </a-spin>
      <a-collapse v-model:activeKey="actKey" :bordered="false">
        <a-collapse-panel v-if="props.selKeys.length" key="1">
          <template #header>
            <a-tooltip>
              <template #title>{{ props.selKeys[0] }}</template>
              <p class="mb-0 w-64 whitespace-nowrap overflow-hidden text-ellipsis">
                {{ props.selKeys[0] }}
              </p>
            </a-tooltip>
          </template>
          <FormGroup
            layout="vertical"
            :mapper="slotMapper"
            :form="slotForm"
            :rules="{
              value: [{ required: true, message: '必须填入值！' }]
            }"
            @update:fprop="
              values => Object.entries(values).map(([k, v]) => setProp(slotForm, k, v))
            "
          >
            <template #valuePFX="{ formState }">
              <a-button @click="() => setProp(formState, 'valEnc', !formState.valEnc)">
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
        <a-collapse-panel v-else-if="props.form.slots.length" key="2">
          <template #header>
            已关联槽&nbsp;
            <a-tag v-if="props.form.slots.length" color="#f50">
              {{ props.form.slots.length }}
            </a-tag>
          </template>
          <a-descriptions :column="1">
            <a-descriptions-item v-for="slot in props.form.slots" :key="slot.xpath">
              <template #label>
                <a-tooltip>
                  <template #title>{{ slot.xpath }}</template>
                  <a
                    class="w-32 whitespace-nowrap overflow-hidden text-ellipsis"
                    @click="() => emit('update:selKeys', [slot.xpath])"
                  >
                    {{ slot.xpath }}
                  </a>
                </a-tooltip>
              </template>
              <div class="flex-1 flex justify-between">
                <span v-if="slot.valEnc">●●●●</span>
                <span v-else>{{ slot.value }}</span>
                <a-button size="small" type="text" danger @click="() => onSlotRemove(slot.xpath)">
                  <template #icon><DeleteOutlined /></template>
                </a-button>
              </div>
            </a-descriptions-item>
          </a-descriptions>
        </a-collapse-panel>
      </a-collapse>
    </div>
  </div>
</template>

<script setup lang="ts">
import FormGroup from '@lib/components/FormGroup.vue'
import Mapper from '@lib/types/mapper'
import {
  CloseOutlined,
  LockOutlined,
  UnlockOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons-vue'
import { Cond } from '@lib/types'
import { Modal, TreeProps } from 'ant-design-vue'
import { createVNode, PropType, reactive, ref, watch } from 'vue'
import Page, { Slot } from '@/types/page'
import { setProp } from '@lib/utils'

const emit = defineEmits(['update:selKeys', 'update:locEleMod'])
const props = defineProps({
  collecting: { type: Boolean, required: true },
  form: { type: Object as PropType<Page>, required: true },
  selKeys: { type: Array as PropType<(string | number)[]>, required: true },
  treeData: { type: Object as PropType<TreeProps['treeData']>, required: true }
})
const slotMapper = new Mapper({
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
    display: [new Cond({ key: 'itype', cmp: '!=', val: 'click' })]
  },
  valEnc: {
    label: '加密值',
    type: 'Checkbox',
    display: false
  }
})
const sideWid = ref(300)
const actKey = ref<string[]>([])
const expKeys = ref([])
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
      props.form.slots.splice(
        props.form.slots.findIndex(slot => slot.xpath === xpath),
        1
      )
    }
  })
}
</script>
