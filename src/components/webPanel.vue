<template>
  <div class="flex-1">
    <a-spin v-if="curURL" tip="页面元素收集中..." :spinning="collecting">
      <iframe class="w-full h-full border-none" :src="curURL" ref="dspPage" @load="onPageLoad" />
      <a-space class="z-50 rounded-md bg-gray-300 opacity-50 p-1 absolute top-5 right-5">
        <a-tooltip>
          <template #title>选择页面元素</template>
          <a-button
            :type="locEleMod ? 'primary' : 'text'"
            :disabled="collecting"
            @click="() => emit('update:locEleMod', !locEleMod)"
          >
            <template #icon><AimOutlined /></template>
          </a-button>
        </a-tooltip>
        <a-tooltip>
          <template #title>选择轮廓颜色</template>
          <a-button type="text" :disabled="collecting" @click="() => (stkClrVsb = true)">
            <template #icon>
              <icon :style="{ color: selStkColor }">
                <template #component>
                  <svg width="1em" height="1em" fill="currentColor" viewBox="0 0 1024 1024">
                    <rect :x="0" :y="0" :width="1024" :height="1024" :rx="20" :ry="20" />
                  </svg>
                </template>
              </icon>
            </template>
          </a-button>
        </a-tooltip>
        <a-modal v-model:open="stkClrVsb" title="选择框颜色" @ok="() => (stkClrVsb = false)">
          <ColorSelect v-model:color="selStkColor" />
        </a-modal>
      </a-space>
      <a-dropdown :trigger="['contextmenu']">
        <div
          class="absolute left-0 right-0"
          :style="{ height: dspRect.height + 'px' }"
          @scroll="onPageScroll"
          @mousemove="onMouseMove"
          @click="() => emit('update:locEleMod', false)"
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
                stroke: selStkColor
              }"
            />
            <rect
              v-for="slot in form.slots.filter((slot: any) => slot.xpath in eleDict)"
              :key="slot.xpath"
              class="cursor-pointer"
              :class="{ invisible: selKeys.includes(slot.xpath) }"
              :x="eleDict[slot.xpath].rectBox.x"
              :y="eleDict[slot.xpath].rectBox.y"
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
          <a-tag
            v-for="(slot, index) in form.slots.filter((slot: any) => slot.xpath in eleDict)"
            :key="slot.xpath"
            class="absolute cursor-pointer"
            :class="{ invisible: selKeys.includes(slot.xpath) }"
            :style="{
              top: eleDict[slot.xpath].rectBox.y + 'px',
              right: eleDict[slot.xpath].rectBox.x + eleDict[slot.xpath].rectBox.width + 'px'
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
    </a-spin>
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
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, PropType, reactive, ref } from 'vue'
import ColorSelect from '@lib/components/ColorSelect.vue'
import Icon, { AimOutlined } from '@ant-design/icons-vue'
import Page from '@/types/page'
import PageEle from '@/types/pageEle'
import { RectBox } from '@/utils'
import { inRect } from '@/utils'

const emit = defineEmits(['update:selKeys', 'update:locEleMod'])
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
const dspPage = ref<HTMLIFrameElement | null>(null)
const stkClrVsb = ref(false)
const selStkColor = ref('red')
const slotStkColor = ref('green')
defineExpose({ dspPage })

function onRgtMnuClick({ key }: { key: 'check' | 'clear' }) {
  if (key === 'clear') {
    emit('update:selKeys', [])
  }
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
</script>
