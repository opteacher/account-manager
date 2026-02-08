<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1 class="login-title">{{ lgnProps.title }}</h1>
        <p class="login-subtitle">安全可靠的账号管理平台</p>
      </div>

      <a-result
        v-if="flags.succeed"
        class="success-result"
        status="success"
        title="账户注册成功"
      >
        <template #subTitle>
          <p>您的账户已创建完成，现在可以登录使用</p>
        </template>
        <template #extra>
          <a-space :size="12">
            <a-button type="primary" size="large" @click="onLoginAftReg">
              直接登录
            </a-button>
            <a-button size="large" @click="onRetLgnPage">
              返回登录页
            </a-button>
          </a-space>
        </template>
      </a-result>

      <a-form
        v-else
        ref="formRef"
        :model="formState"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 18 }"
        class="login-form"
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
          :wrapper-col="{ offset: 6, span: 18 }"
          class="remember-checkbox"
        >
          <a-checkbox v-model:checked="formState.remember">记住登录状态</a-checkbox>
        </a-form-item>

        <a-form-item :wrapper-col="{ offset: 6, span: 18 }" class="submit-section">
          <div class="submit-row">
            <a-tooltip>
              <template #title>修复浏览器环境</template>
              <a-button type="text" class="fix-btn" @click="onFixBtnClick">
                <template #icon><ToolOutlined /></template>
              </a-button>
            </a-tooltip>

            <a-space :size="12" class="submit-buttons">
              <a-button type="primary" size="large" html-type="submit" class="submit-btn">
                {{ formState.register ? '立即注册' : '立即登录' }}
              </a-button>
              <a-button
                v-if="lgnProps.registerable"
                type="link"
                class="toggle-link"
                @click="() => setProp(formState, 'register', !formState.register)"
              >
                {{ formState.register ? '已有账号？前往登录' : '没有账号？前往注册' }}
              </a-button>
            </a-space>
          </div>
        </a-form-item>
      </a-form>

      <div class="login-footer">
        <p class="footer-text">© 2025 密钥登录管理平台 | 仅供内部使用</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import MidLgn from '@/types/midLgn'
import Field from '@lib/types/field'
import { useRouter } from 'vue-router'
import api from '@/apis/login'
import project from '@/jsons/project.json'
import { createByFields } from '@lib/types/mapper'
import { setProp } from '@lib/utils'
import { Cond } from '@lib/types'
import { Rule } from 'ant-design-vue/es/form'
import { ToolOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import useGlobalStore from '@/stores/global'

const store = useGlobalStore()
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
      label: '用户名',
      desc: '',
      ftype: 'Input',
      rules: [
        {
          required: true,
          message: '请输入用户名',
          trigger: 'blur'
        }
      ],
      refer: 'username',
      placeholder: '请输入用户名',
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
          message: '请输入密码',
          trigger: 'blur'
        }
      ],
      refer: 'password',
      placeholder: '请输入密码',
      extra: {},
      key: '66163279ca32f3b75d88ea17'
    },
    {
      label: '确认密码',
      desc: '',
      ftype: 'Password',
      rules: [
        {
          required: true,
          message: '请确认密码',
          trigger: 'blur'
        },
        {
          trigger: 'blur',
          validator: async (_rule: Rule, value: string) => {
            if (value !== formState.password) {
              return Promise.reject('两次输入的密码不一致')
            } else {
              return Promise.resolve()
            }
          }
        }
      ],
      refer: 'repeatPassword',
      placeholder: '请再次输入密码',
      display: [Cond.create('register', '==', true)],
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
  if (store.token) {
    const result = await api.verifyDeep()
    if (!result.error) {
      router.replace(`/${project.name}/endpoint`)
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
    if (result.sessionId) {
      store.token = result.sessionId
      router.push(`/${project.name}/endpoint`)
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

function onFixBtnClick() {
  store.token = ''
  message.success('浏览器环境已修复')
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #F9FAFB 0%, #E5E7EB 100%);
  padding: 24px;
}

.login-card {
  width: 100%;
  max-width: 480px;
  background: var(--surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 40px;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-title {
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin: 0 0 12px 0;
  letter-spacing: -0.02em;
}

.login-subtitle {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: 0;
  line-height: var(--leading-normal);
}

.success-result {
  margin: 24px 0;
}

.login-form {
  margin: 24px 0;
}

:deep(.ant-form-item-label > label) {
  font-size: var(--text-sm);
  color: var(--text-primary);
  font-weight: var(--font-medium);
}

:deep(.ant-input),
:deep(.ant-input-password) {
  border-radius: var(--radius-sm);
  border-color: var(--border);
  padding: 10px 12px;
  font-size: var(--text-sm);
  transition: all 0.2s ease;
}

:deep(.ant-input:hover),
:deep(.ant-input-password:hover) {
  border-color: var(--gray-300);
}

:deep(.ant-input:focus),
:deep(.ant-input-password:focus) {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-50);
}

:deep(.ant-input-password-icon) {
  color: var(--text-tertiary);
  cursor: pointer;
}

.remember-checkbox {
  margin-bottom: 8px;
}

:deep(.remember-checkbox .ant-checkbox-wrapper) {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

:deep(.remember-checkbox .ant-checkbox-checked .ant-checkbox-inner) {
  background-color: var(--primary);
  border-color: var(--primary);
}

.submit-section {
  margin-top: 24px;
}

.submit-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.fix-btn {
  color: var(--text-tertiary);
  padding: 8px;
}

.fix-btn:hover {
  color: var(--text-secondary);
  background: var(--gray-100);
}

.submit-buttons {
  flex: 1;
  justify-content: flex-end;
}

.submit-btn {
  height: 40px;
  padding: 0 32px;
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  border-radius: var(--radius-sm);
  border: none;
  box-shadow: 0 2px 4px rgba(26, 115, 232, 0.2);
}

.submit-btn:hover {
  background: var(--primary-hover);
  border-color: var(--primary-hover);
  box-shadow: 0 4px 8px rgba(26, 115, 232, 0.3);
}

.submit-btn:active {
  background: var(--primary-active);
  border-color: var(--primary-active);
}

.toggle-link {
  font-size: var(--text-sm);
  color: var(--primary);
  padding: 8px 16px;
  font-weight: var(--font-normal);
}

.toggle-link:hover {
  color: var(--primary-hover);
  background: var(--primary-50);
}

:deep(.ant-result-success .ant-result-icon > .anticon) {
  color: var(--success-500);
}

:deep(.ant-result-title) {
  font-size: var(--text-xl);
  color: var(--text-primary);
  font-weight: var(--font-semibold);
}

:deep(.ant-result-subtitle) {
  color: var(--text-secondary);
  margin-top: 8px;
}

.login-footer {
  text-align: center;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--border);
}

.footer-text {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  margin: 0;
}

@media (max-width: 640px) {
  .login-container {
    padding: 16px;
  }

  .login-card {
    padding: 24px;
  }

  .login-title {
    font-size: var(--text-2xl);
  }

  .submit-row {
    flex-direction: column;
    gap: 16px;
  }

  .submit-buttons {
    width: 100%;
    flex-direction: column;
  }

  .toggle-link {
    width: 100%;
    text-align: center;
  }
}
</style>
