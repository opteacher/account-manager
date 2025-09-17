<template>
  <div class="flex-1 overflow-hidden">
    <div v-if="curURL" class="h-full relative">
      <div v-if="true" class="h-full text-center relative z-50 bg-black opacity-10">
        <a-spin
          class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          tip="页面元素收集中..."
        />
      </div>
      <div
        ref="dspPgCtnr"
        class="overflow-auto absolute left-0 top-0 bottom-0 right-0"
        @scroll="onCtnrScroll"
      >
        <webview
          class="w-full h-full border-none overflow-hidden"
          :src="curURL"
          ref="dspPage"
          disablewebsecurity
          nodeintegrationinsubframes
          webpreferences="allowRunningInsecureContent"
          @did-stop-loading="onPageLoaded"
          @console-message="(e: any) => console.log(e.message)"
        />
      </div>
      <a-space
        class="z-50 rounded-md p-1 absolute bottom-5 left-5"
        :style="{ 'background-color': 'rgba(100, 100, 100, 0.5)' }"
      >
        <a-tooltip>
          <template #title>选择页面元素</template>
          <a-button
            :type="locEleMod ? 'primary' : 'text'"
            :disabled="collecting"
            @click="() => emit('update:locEleMod', !locEleMod)"
          >
            <template #icon><AimOutlined :style="{ color: 'rgba(155, 155, 155)' }" /></template>
          </a-button>
        </a-tooltip>
        <a-tooltip>
          <template #title>选择轮廓颜色</template>
          <a-button type="text" :disabled="collecting" @click="() => (stkClrVsb = true)">
            <template #icon>
              <BorderOutlined :style="{ color: selStkColor }" />
            </template>
          </a-button>
        </a-tooltip>
        <a-modal v-model:open="stkClrVsb" title="选择框颜色" @ok="() => (stkClrVsb = false)">
          <ColorSelect v-model:color="selStkColor" />
        </a-modal>
        <a-tooltip>
          <template #title>关闭网页遮罩</template>
          <a-button
            :type="maskVsb ? 'text' : 'primary'"
            :danger="!maskVsb"
            :disabled="collecting"
            @click="() => (maskVsb = !maskVsb)"
          >
            <template #icon>
              <StopOutlined :class="maskVsb ? 'text-red-700' : 'text-white'" />
            </template>
          </a-button>
        </a-tooltip>
      </a-space>
      <a-dropdown :trigger="['contextmenu']">
        <div
          class="absolute top-0 left-0 bottom-4 right-4"
          :style="{ display: maskVsb ? 'block' : 'none' }"
          @wheel="onMaskScroll"
        >
          <svg
            class="w-full h-full"
            @mousemove="onMouseMove"
            @click="() => emit('update:locEleMod', false)"
            @mouseup="onMouseUp"
          >
            <rect
              v-if="selRect.width"
              :x="selRect.x + maskOffset[0]"
              :y="selRect.y + maskOffset[1]"
              :rx="4"
              :ry="4"
              :width="selRect.width"
              :height="selRect.height"
              :style="{
                'fill-opacity': 0,
                'stroke-width': 3,
                stroke: selStkColor
              }"
            />
            <rect
              v-for="slot in form.slots.filter((slot: any) => slot.xpath in eleDict)"
              :key="slot.xpath"
              class="cursor-pointer"
              :class="{ invisible: selKeys.includes(slot.xpath) }"
              :x="eleDict[slot.xpath].rectBox.x + maskOffset[0]"
              :y="eleDict[slot.xpath].rectBox.y + maskOffset[1]"
              :rx="4"
              :ry="4"
              :width="eleDict[slot.xpath].rectBox.width"
              :height="eleDict[slot.xpath].rectBox.height"
              :style="{
                'fill-opacity': 0,
                'stroke-width': 3,
                stroke: slotStkColor
              }"
              @click="() => emit('update:selKeys', [slot.xpath])"
            />
          </svg>
          <a-button
            v-if="selRect.width"
            class="absolute"
            danger
            type="text"
            size="small"
            :style="{
              top: maskOffset[1] + selRect.y + 'px',
              left: maskOffset[0] + selRect.x + selRect.width + 5 + 'px'
            }"
            @click="() => emit('update:selKeys', [])"
          >
            <template #icon><CloseOutlined /></template>
          </a-button>
          <a-tag
            v-for="(slot, index) in form.slots.filter((slot: any) => slot.xpath in eleDict)"
            :key="slot.xpath"
            class="absolute cursor-pointer"
            :class="{ invisible: selKeys.includes(slot.xpath) }"
            :style="{
              top: maskOffset[1] + eleDict[slot.xpath].rectBox.y + 'px',
              left:
                maskOffset[0] +
                eleDict[slot.xpath].rectBox.x +
                eleDict[slot.xpath].rectBox.width +
                5 +
                'px'
            }"
            :color="slotStkColor"
            @click="() => emit('update:selKeys', [slot.xpath])"
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
    </div>
    <div v-else class="h-full relative">
      <a-typography-paragraph class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
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
            <a-typography-text type="secondary">给登录表单的元素绑定账户信息</a-typography-text>
          </li>
          <li>
            <a-typography-text type="secondary">
              点击【保存】绑定网页元素与账户信息
            </a-typography-text>
          </li>
        </ol>
      </a-typography-paragraph>
    </div>
    <a-modal v-model:open="delSlotVsb">
      <template #title>
        <ExclamationCircleOutlined class="text-red-600" />
        &nbsp;确定删除该操作步骤吗？
      </template>
      <a-checkbox v-model:checked="delSlotNexts">
        是否删除之后的步骤？不删操作顺序会乱建议删除
      </a-checkbox>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, PropType, reactive, ref } from 'vue'
import ColorSelect from '@lib/components/ColorSelect.vue'
import {
  AimOutlined,
  StopOutlined,
  BorderOutlined,
  CloseOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons-vue'
import Page from '@/types/page'
import PageEle from '@/types/pageEle'
import { RectBox } from '@/utils'
import { inRect } from '@/utils'
import { WebviewTag } from 'electron'
import { until } from '@lib/utils'

const emit = defineEmits(['update:selKeys', 'update:locEleMod', 'pageLoaded'])
const props = defineProps({
  curURL: { type: String, required: true },
  collecting: { type: Boolean, required: true },
  form: { type: Object as PropType<Page>, required: true },
  eleDict: { type: Object as PropType<Record<string, PageEle>>, default: () => ({}) },
  selKeys: { type: Array as PropType<(string | number)[]>, required: true },
  locEleMod: { type: Boolean, required: true }
})
const selRect = computed<RectBox>(() => {
  if (!props.selKeys.length) {
    return { x: 0, y: 0, width: 0, height: 0 }
  }
  return props.eleDict[props.selKeys[0]].rectBox
})
const dspRect = reactive<{ width: number; height: number; sclWid: number; sclHgt: number }>({
  width: 0,
  height: 0,
  sclWid: 0,
  sclHgt: 0
})
const dspPage = ref<WebviewTag | null>(null)
const dspPgCtnr = ref<HTMLElement | null>(null)
const stkClrVsb = ref(false)
const selStkColor = ref('red')
const slotStkColor = ref('green')
const maskVsb = ref(true)
const maskOffset = reactive([0, 0])
const delSlotVsb = ref(false)
const delSlotNexts = ref(false)
defineExpose({ dspPage })

onMounted(async () => {
  await until(async () => dspPage.value !== null)
  dspPage.value?.addEventListener('dom-ready', () =>
    dspPage.value?.executeJavaScript(
      'window.addEventListener("load", () => console.log("page-loaded"))'
    )
  )
})

function onRgtMnuClick({ key }: { key: 'check' | 'clear' }) {
  if (key === 'clear') {
    emit('update:selKeys', [])
  }
}
async function onPageLoaded() {
  setTimeout(() => emit('pageLoaded'), 2000)
  try {
    dspRect.width = dspPage.value?.clientWidth as number
    dspRect.height = dspPage.value?.clientHeight as number
    const doc = window.document
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
  } catch (e) {
    console.error(e)
  }
}
function onPageScroll(e: Event) {
  nextTick(() => {
    dspPage.value?.scrollTo({
      top: (e.target as any).scrollTop,
      behavior: 'smooth'
    })
  })
}
function onMouseMove(e: MouseEvent) {
  e.preventDefault()
  if (!props.locEleMod) {
    return
  }
  const el = poiOnEle(e.offsetX, e.offsetY)
  emit('update:selKeys', el ? [el.xpath] : [])
}
function onMouseUp(e: MouseEvent) {
  if (e.button === 2) {
    e.preventDefault()
    const el = poiOnEle(e.offsetX, e.offsetY)
    emit('update:selKeys', el ? [el.xpath] : [])
  }
}
function poiOnEle(x: number, y: number): PageEle | null {
  const els = []
  for (const el of Object.values(props.eleDict)) {
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
function onMaskScroll(e: WheelEvent) {
  dspPgCtnr.value?.scroll({ top: dspPgCtnr.value?.scrollTop + e.deltaY, behavior: 'smooth' })
}
function onCtnrScroll(e: any) {
  console.log(e)
  maskOffset[1] = (e.target as HTMLElement).scrollTop
  maskOffset[0] = (e.target as HTMLElement).scrollLeft
}
</script>
