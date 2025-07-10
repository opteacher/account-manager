<template>
  <div
    class="px-5 py-12 h-full flex items-center"
    :style="{
      'justify-content': lgnProps.align,
      'background-color': lgnProps.bkgdColor
    }"
  >
    <div
      class="px-5 py-8"
      :style="{
        'border-radius': `${lgnProps.radius}px`,
        width: `${lgnProps.width}%`,
        'background-color': lgnProps.fmBkgdColor
      }"
    >
      <a-typography-title class="text-center mb-10" :level="2">
        {{ lgnProps.title }}
      </a-typography-title>
      <a-result v-if="flags.succeed" status="success" title="账户注册成功！">
        <template #extra>
          <a-button type="primary" @click="onLoginAftReg">直接登录</a-button>
          <a-button @click="onRetLgnPage">回到登录页</a-button>
        </template>
      </a-result>
      <a-form
        v-else
        :model="formState"
        :label-col="{ span: lgnProps.hasLabel ? lgnProps.lblWidth : 0 }"
        :wrapper-col="{ span: lgnProps.hasLabel ? 24 - lgnProps.lblWidth : 24 }"
        @finish="onFinish"
      >
        <FormItem
          v-for="(mapper, key) of lgnMapper"
          :key="key"
          :skey="key"
          :mapper="mapper"
          :form="formState"
          @update:fprop="(fm: any) => setProp(formState, key.toString(), fm[key])"
        />

        <a-form-item
          v-if="lgnProps.logAccount && !formState.register"
          name="remember"
          :wrapper-col="{ offset: lgnProps.lblWidth }"
        >
          <a-checkbox v-model:checked="formState.remember">记住</a-checkbox>
        </a-form-item>

        <a-form-item :wrapper-col="{ offset: 4, span: 8 }">
          <a-button class="px-8" type="primary" size="large" html-type="submit">
            {{ formState.register ? '注册' : '登录' }}
          </a-button>
          <span v-if="lgnProps.registerable" class="ml-5">
            或
            <a-button
              type="link"
              @click="() => setProp(formState, 'register', !formState.register)"
            >
              {{ formState.register ? '前往登录' : '前往注册' }}
            </a-button>
          </span>
        </a-form-item>
      </a-form>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, reactive } from 'vue'
import MidLgn from '@/types/midLgn'
import Field from '@lib/types/field'
import { useRouter } from 'vue-router'
import api from '@/apis/login'
import project from '@/jsons/project.json'
import { createByFields } from '@lib/types/mapper'
import { setProp } from '@lib/utils'
import { Cond } from '@lib/types'
import { Rule } from 'ant-design-vue/es/form'

const router = useRouter()
const lgnProps = reactive(MidLgn.copy(project.middle.login))
const formState = reactive(
  Object.fromEntries(
    project.auth.props
      .map((prop: any) => [prop.name, ''])
      .concat([['repeatPassword', '']])
      .concat([['remember', true]])
      .concat([['register', false]])
  )
)
const lgnMapper = createByFields(
  [
    {
      label: '账户名',
      desc: '',
      ftype: 'Input',
      rules: [
        {
          required: true,
          message: '必须输入账户！',
          trigger: 'blur'
        }
      ],
      refer: 'username',
      placeholder: '',
      extra: {},
      key: '66163279ca32f3b75d88ea16'
    },
    {
      label: '密码',
      desc: '',
      ftype: 'Password',
      rules: [
        {
          required: true,
          message: '必须输入密码！',
          trigger: 'blur'
        }
      ],
      refer: 'password',
      placeholder: '',
      extra: {},
      key: '66163279ca32f3b75d88ea17'
    },
    {
      label: '重复密码',
      desc: '',
      ftype: 'Password',
      rules: [
        {
          required: true,
          message: '必须重复密码！',
          trigger: 'blur'
        },
        {
          trigger: 'blur',
          validator: async (_rule: Rule, value: string) => {
            if (value !== formState.password) {
              return Promise.reject('重复密码与原密码不一致！')
            } else {
              return Promise.resolve()
            }
          }
        }
      ],
      refer: 'repeatPassword',
      placeholder: '',
      display: [Cond.create('register', '=', true)],
      extra: {},
      key: '66163279ca32f3b75d88ea18'
    }
  ].map((field: any) => {
    const ret = Field.copy(field)
    if (!lgnProps.hasLabel) {
      ret.label = ''
    }
    return ret
  }) as Field[]
)
const flags = reactive({
  succeed: false
})

onMounted(async () => {
  if (localStorage.getItem('token')) {
    const result = await api.verifyDeep()
    if (!result.error) {
      router.replace(`/${project.name}/`)
    }
  }
})

async function onFinish(values: any) {
  if (formState.register) {
    const result = await api.register(values)
    if (result.error) {
      return
    }
    flags.succeed = true
  } else {
    const result = await api.login(values)
    if (result.token) {
      localStorage.setItem('token', result.token)
      router.push(`/${project.name}/`)
    }
  }
}
function onResetForm() {
  for (const prop of project.auth.props) {
    formState[prop.name] = ''
  }
  formState.repeatPassword = ''
  formState.remember = true
  formState.register = false
}
function onRetLgnPage() {
  onResetForm()
  flags.succeed = false
}
async function onLoginAftReg() {
  formState.register = false
  await onFinish(formState)
  flags.succeed = false
}
</script>
