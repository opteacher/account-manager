<template>
  <MainLayout>
    <div class="h-full flex flex-col">
      <div class="flex space-x-2.5">
        <a-input-group class="flex-1 flex" compact size="large">
          <a-select
            :options="[
              { label: '网页登录', value: 'web' },
              { label: '终端SSH', value: 'ssh' }
            ]"
            v-model:value="page.form.login"
          />
          <a-input
            allowClear
            v-model:value="page.form.url"
            :placeholder="placeholders[page.form.login]"
            @pressEnter="onPageUpdate"
          >
            <template #prefix><RightOutlined /></template>
            <template #clearIcon><CloseCircleFilled @click="onFmUrlClear" /></template>
          </a-input>
          <a-button
            @click="() => onPageUpdate()"
            :loading="collecting"
          >
            <template #icon><SendOutlined /></template>
            跳转
          </a-button>
        </a-input-group>
        <a-button
          type="primary"
          size="large"
          :disabled="collecting"
          @click="() => page.emitter.emit('update:visible', { show: true, object: page.form })"
        >
          保存
        </a-button>
      </div>
      <iframe v-if="page.form.login === 'ssh'" class="flex-1 flex mt-5" src="http://192.168.1.11:7681" />
      <div v-else-if="page.form.login === 'web'" class="flex-1 flex mt-5">
        <div class="flex-1">
          <a-spin v-if="curUrl" tip="页面元素收集中..." :spinning="collecting">
            <iframe
              class="w-full h-full border-none"
              :src="curUrl"
              ref="dspPage"
              @load="onPageLoad"
            />
            <a-dropdown :trigger="['contextmenu']">
              <div
                class="absolute left-0 right-0"
                :style="{ height: dspRect.height + 'px' }"
                @scroll="onPageScroll"
                @mousemove="onMouseMove"
                @click="() => setProp(operas, 'locEleMod', false)"
                @mouseup="onMouseUp"
              >
                <svg class="w-full" :style="{ height: dspRect.sclHgt + 'px' }">
                  <rect
                    v-if="selRect.width"
                    :x="selRect.x"
                    :y="selRect.y"
                    :rx="4"
                    :ry="4"
                    :width="selRect.width"
                    :height="selRect.height"
                    :style="{
                      'fill-opacity': 0,
                      'stroke-width': 3,
                      stroke: operas.selStkColor
                    }"
                  />

                  <rect
                    v-for="slot in page.form.slots"
                    :key="slot.xpath"
                    class="cursor-pointer"
                    :class="{ invisible: page.selKeys.includes(slot.xpath) }"
                    :x="page.elMapper[slot.xpath].rectBox.x"
                    :y="page.elMapper[slot.xpath].rectBox.y"
                    :rx="4"
                    :ry="4"
                    :width="page.elMapper[slot.xpath].rectBox.width"
                    :height="page.elMapper[slot.xpath].rectBox.height"
                    :style="{
                      'fill-opacity': 0,
                      'stroke-width': 3,
                      stroke: operas.slotStkColor
                    }"
                    @click="() => setProp(page, 'selKeys', [slot.xpath])"
                  />
                </svg>
                <a-tag
                  v-for="(slot, index) in page.form.slots"
                  :key="slot.xpath"
                  class="absolute cursor-pointer"
                  :class="{ invisible: page.selKeys.includes(slot.xpath) }"
                  :style="{
                    top: page.elMapper[slot.xpath].rectBox.y + 'px',
                    right:
                      page.elMapper[slot.xpath].rectBox.x +
                      page.elMapper[slot.xpath].rectBox.width +
                      'px'
                  }"
                  :color="operas.slotStkColor"
                  @click="() => setProp(page, 'selKeys', [slot.xpath])"
                >
                  {{ index + 1 }}
                </a-tag>
              </div>
              <template #overlay>
                <a-menu @click="onRgtMnuClick">
                  <a-menu-item key="select">检查</a-menu-item>
                  <a-menu-item key="clear">清空选择</a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </a-spin>
          <div v-else class="h-full relative">
            <a-typography-paragraph
              class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            >
              <ol>
                <li>
                  <a-typography-text type="secondary">登录类型选择【网页登录】</a-typography-text>
                </li>
                <li>
                  <a-typography-text type="secondary">在【地址栏】输入网址</a-typography-text>
                </li>
                <li>
                  <a-typography-text type="secondary">
                    点击【跳转】加载网页并收集网页元素
                  </a-typography-text>
                </li>
                <li>
                  <a-typography-text type="secondary">
                    给登录表单的元素绑定账户信息
                  </a-typography-text>
                </li>
                <li>
                  <a-typography-text type="secondary">
                    点击【保存】绑定网页元素与账户信息
                  </a-typography-text>
                </li>
              </ol>
            </a-typography-paragraph>
          </div>
        </div>
        <div :style="{ width: operas.sideWid + 'px' }">
          <div class="h-full flex flex-col">
            <a-space>
              <a-tooltip>
                <template #title>选择页面元素</template>
                <a-button
                  :type="operas.locEleMod ? 'primary' : 'text'"
                  :disabled="collecting"
                  @click="onLocEleClick"
                >
                  <template #icon><AimOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip>
                <template #title>选择轮廓颜色</template>
                <a-button
                  type="text"
                  :disabled="collecting"
                  @click="() => setProp(operas, 'stkClrVsb', true)"
                >
                  <template #icon>
                    <icon :style="{ color: operas.selStkColor }">
                      <template #component>
                        <svg width="1em" height="1em" fill="currentColor" viewBox="0 0 1024 1024">
                          <rect :x="0" :y="0" :width="1024" :height="1024" :rx="20" :ry="20" />
                        </svg>
                      </template>
                    </icon>
                  </template>
                </a-button>
              </a-tooltip>
            </a-space>
            <a-spin wrapperClassName="flex-1" tip="页面元素收集中..." :spinning="collecting">
              <a-tree
                class="overflow-auto absolute top-0 bottom-0 left-0 right-0"
                :auto-expand-parent="true"
                :tree-data="page.treeData"
                v-model:expendedKeys="page.expKeys"
                v-model:selectedKeys="page.selKeys"
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
            <a-collapse v-model:activeKey="operas.actKey" :bordered="false">
              <a-collapse-panel v-if="page.selKeys.length" key="1" :header="page.selKeys[0]">
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
                  <CloseOutlined @click="() => setProp(page, 'selKeys', [])" />
                </template>
              </a-collapse-panel>
              <a-collapse-panel v-else-if="page.form.slots.length" key="2">
                <template #header>
                  已关联槽&nbsp;
                  <a-tag v-if="page.form.slots.length" color="#f50">
                    {{ page.form.slots.length }}
                  </a-tag>
                </template>
                <a-descriptions :column="1">
                  <a-descriptions-item v-for="slot in page.form.slots" :key="slot.xpath">
                    <template #label>
                      <a @click="() => setProp(page, 'selKeys', [slot.xpath])">{{ slot.xpath }}</a>
                    </template>
                    <div class="flex-1 flex justify-between">
                      <span v-if="slot.valEnc">●●●●</span>
                      <span v-else>{{ slot.value }}</span>
                      <a-button
                        size="small"
                        type="text"
                        danger
                        @click="() => onSlotRemove(slot.xpath)"
                      >
                        <template #icon><DeleteOutlined /></template>
                      </a-button>
                    </div>
                  </a-descriptions-item>
                </a-descriptions>
              </a-collapse-panel>
            </a-collapse>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
  <a-modal
    v-model:open="operas.stkClrVsb"
    title="选择框颜色"
    @ok="() => setProp(operas, 'stkClrVsb', false)"
  >
    <ColorSelect v-model:color="operas.selStkColor" />
  </a-modal>
  <FormDialog
    title="保存页面"
    width="40vw"
    :mapper="pageMapper"
    :emitter="page.emitter"
    :newFun="() => newOne(Page)"
    @submit="onPageSave"
  />
</template>

<script setup lang="ts">
import MainLayout from '@/layouts/main.vue'
import Icon, {
  SendOutlined,
  RightOutlined,
  CloseCircleFilled,
  AimOutlined,
  CloseOutlined,
  LockOutlined,
  UnlockOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons-vue'
import { computed, createVNode, nextTick, onMounted, reactive, ref, watch } from 'vue'
import pgAPI from '@/apis/page'
import { Modal, TreeProps } from 'ant-design-vue'
import ColorSelect from '@lib/components/ColorSelect.vue'
import { newOne, setProp } from '@lib/utils'
import { RectBox, inRect } from '@/utils'
import FormGroup from '@lib/components/FormGroup.vue'
import Mapper from '@lib/types/mapper'
import mdlAPI from '@/apis/model'
import { useRoute } from 'vue-router'
import Page, { Slot } from '@/types/page'
import FormDialog from '@lib/components/FormDialog.vue'
import { TinyEmitter } from 'tiny-emitter'

type PageEle = {
  xpath: string
  tagName: string
  rectBox: RectBox
}
const placeholders = {
  web: '输入网址',
  ssh: '输入SSH地址（username:password@host:port）'
}
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
    type: 'Input'
  },
  valEnc: {
    label: '加密值',
    type: 'Checkbox',
    display: false
  }
})
const pageMapper = new Mapper({
  name: {
    label: '名称',
    type: 'Input',
    rules: [{ required: true, message: '必须填入名称！' }]
  }
})

const route = useRoute()
const page = reactive<{
  form: Page
  elMapper: Record<string, PageEle>
  treeData: TreeProps['treeData']
  expKeys: (string | number)[]
  selKeys: (string | number)[]
  emitter: TinyEmitter
}>({
  form: new Page(),
  elMapper: {},
  treeData: [],
  expKeys: [],
  selKeys: [],
  emitter: new TinyEmitter()
})
const curUrl = ref('')
const operas = reactive<{
  locEleMod: boolean
  selStkColor: string
  slotStkColor: string
  stkClrVsb: boolean
  actKey: string[]
  sideWid: number
}>({
  locEleMod: false,
  selStkColor: 'red',
  slotStkColor: 'green',
  stkClrVsb: false,
  actKey: ['1'],
  sideWid: 300
})
const collecting = ref(false)
const dspPage = ref<HTMLIFrameElement | null>(null)
const dspRect = reactive<{ width: number; height: number; sclWid: number; sclHgt: number }>({
  width: 0,
  height: 0,
  sclWid: 0,
  sclHgt: 0
})
const selRect = computed<RectBox>(() => {
  if (!page.selKeys.length) {
    return { x: 0, y: 0, width: 0, height: 0 }
  }
  return page.elMapper[page.selKeys[0]].rectBox
})
const slotForm = reactive<Slot>(new Slot())

onMounted(refresh)
watch(
  () => page.selKeys,
  () => {
    if (!page.selKeys.length) {
      slotForm.reset()
      return
    }
    Slot.copy(
      page.form.slots.find(slot => slot.xpath === page.selKeys[0]),
      slotForm,
      true
    )
    slotForm.xpath = page.selKeys[0] as string
    operas.actKey = ['1']
  },
  { deep: true }
)

async function refresh() {
  if (!route.params.pid || route.params.pid === 'n') {
    return
  }
  const pgInf = await mdlAPI.get('page', route.params.pid)
  await onPageUpdate(pgInf.url)
  Page.copy(pgInf, page.form, true)
}
async function onPageUpdate(url?: string) {
  collecting.value = true
  curUrl.value = url || page.form.url
  const result = await pgAPI.colcElements(
    curUrl.value,
    dspPage.value?.getBoundingClientRect() as DOMRect
  )
  page.elMapper = Object.fromEntries(result.elements.map((el: any) => [el.xpath, el]))
  page.treeData = result.treeData
  page.selKeys = []
  collecting.value = false
}
function onFmUrlClear() {
  curUrl.value = ''
}
function onLocEleClick() {
  operas.locEleMod = !operas.locEleMod
}
function onPageLoad() {
  try {
    dspRect.width = dspPage.value?.clientWidth as number
    dspRect.height = dspPage.value?.clientHeight as number
    const doc = dspPage.value?.contentDocument || window.document
    dspRect.sclWid = Math.max(
      doc.body.clientWidth,
      doc.documentElement.clientWidth,
      doc.body.scrollWidth,
      doc.documentElement.scrollWidth
    )
    dspRect.sclHgt = Math.max(
      doc.body.clientHeight,
      doc.documentElement.clientHeight,
      doc.body.scrollHeight,
      doc.documentElement.scrollHeight
    )
    console.log(dspRect.sclHgt)
  } catch (e) {
    console.error(e)
  }
}
function onPageScroll(e: Event) {
  nextTick(() => {
    dspPage.value?.contentWindow?.scrollTo({
      top: (e.target as any).scrollTop,
      behavior: 'smooth'
    })
    console.log(dspPage.value?.contentDocument?.body.scrollTop)
  })
}
function onMouseMove(e: MouseEvent) {
  e.preventDefault()
  if (!operas.locEleMod) {
    return
  }
  const el = poiOnEle(e.offsetX, e.offsetY)
  page.selKeys = el ? [el.xpath] : []
}
function onMouseUp(e: MouseEvent) {
  if (e.button === 2) {
    e.preventDefault()
    const el = poiOnEle(e.offsetX, e.offsetY)
    page.selKeys = el ? [el.xpath] : []
  }
}
function poiOnEle(x: number, y: number): PageEle | null {
  const els = []
  for (const el of Object.values(page.elMapper)) {
    if (inRect({ x, y }, el.rectBox)) {
      els.push(el)
    }
  }
  const minRect = {
    width: Number.MAX_VALUE,
    height: Number.MAX_VALUE,
    el: null as PageEle | null
  }
  for (const el of els) {
    if (el.rectBox.width < minRect.width && el.rectBox.height < minRect.height) {
      minRect.el = el
    }
  }
  return minRect.el
}
function onSlotSave() {
  const idSlot = page.form.slots.find(slot => slot.xpath === page.selKeys[0])
  if (idSlot) {
    idSlot.value = slotForm.value
  } else {
    page.form.slots.push(Slot.copy(slotForm))
  }
  slotForm.reset()
  page.selKeys = []
}
async function onPageSave({ name }: { name: string }, next: Function) {
  console.log(name)
  page.form.name = name
  if (route.params.pid) {
    await mdlAPI.update('page', route.params.pid, page.form)
  } else {
    await mdlAPI.add('page', page.form)
  }
  page.form.reset()
  next()
  await refresh()
}
function onSlotRemove(xpath: string) {
  Modal.confirm({
    title: '确定删除该槽？',
    icon: createVNode(ExclamationCircleOutlined),
    onOk() {
      page.form.slots.splice(
        page.form.slots.findIndex(slot => slot.xpath === xpath),
        1
      )
    }
  })
}
function onRgtMnuClick({ key }: { key: 'check' | 'clear' }) {
  if (key === 'clear') {
    page.selKeys = []
  }
}
</script>

<style>
.ant-tree-title {
  word-break: keep-all !important;
  white-space: nowrap !important;
}

.ant-spin-container {
  position: relative !important;
}
</style>
