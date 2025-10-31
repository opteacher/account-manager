<template>
  <iframe v-if="url" class="w-full" :src="url" />
  <div v-else class="w-full relative">
    <a-typography-paragraph class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
      <ol>
        <li>
          <a-typography-text type="secondary">在【地址栏】输入主机地址和SSH端口</a-typography-text>
        </li>
        <li>
          <a-typography-text type="secondary">
            如登录非root账户或需输入秘钥，点击【认证】保存账户信息
          </a-typography-text>
        </li>
        <li>
          <a-typography-text type="secondary">点击【跳转】尝试登录</a-typography-text>
        </li>
        <li>
          <a-typography-text type="secondary">点击【保存】录入SSH登录信息</a-typography-text>
        </li>
      </ol>
    </a-typography-paragraph>
  </div>
</template>

<script setup lang="ts">
defineProps({
  url: { type: String, requred: true }
})
</script>
