<script setup lang="ts">
  import { reactive, ref } from 'vue'
  import {
    ElDialog,
    ElDropdown,
    ElDropdownItem,
    ElDropdownMenu,
    ElForm,
    ElFormItem,
    ElInput,
    ElMessage,
    ElMessageBox,
    ElButton
  } from 'element-plus'
  import { useI18n } from 'vue-i18n'
  import { changePasswordApi, logoutApi } from '@/api/login'
  import { useUserStore } from '@/store/modules/user'

  const userStore = useUserStore()

  const prefixCls = 'v-user-info'

  const { t } = useI18n()

  /* ---------- 修改密码 ---------- */
  const pwdVisible = ref(false)
  const pwdSaving = ref(false)
  const pwdFormRef = ref()
  const pwdForm = reactive({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const pwdRules = {
    oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
    newPassword: [
      { required: true, message: '请输入新密码', trigger: 'blur' },
      { min: 6, max: 32, message: '新密码长度需在 6-32 位之间', trigger: 'blur' }
    ],
    confirmPassword: [
      { required: true, message: '请再次输入新密码', trigger: 'blur' },
      {
        validator: (_rule: unknown, value: string, callback: (error?: Error) => void) => {
          if (value !== pwdForm.newPassword) callback(new Error('两次输入的密码不一致'))
          else callback()
        },
        trigger: 'blur'
      }
    ]
  }

  const openPwdDialog = () => {
    Object.assign(pwdForm, { oldPassword: '', newPassword: '', confirmPassword: '' })
    pwdVisible.value = true
  }

  const submitPwd = async () => {
    if (!pwdFormRef.value) return
    try {
      await pwdFormRef.value.validate()
    } catch {
      return
    }
    pwdSaving.value = true
    try {
      await changePasswordApi({ oldPassword: pwdForm.oldPassword, newPassword: pwdForm.newPassword })
      pwdVisible.value = false
      ElMessage.success('密码修改成功, 请使用新密码重新登录')
      await userStore.logout()
    } catch (error) {
      // 错误提示已由请求层弹出
    } finally {
      pwdSaving.value = false
    }
  }

  const loginOut = async () => {
    try {
      await ElMessageBox.confirm(t('common.loginOutMessage'), t('common.reminder'), {
        confirmButtonText: t('common.ok'),
        cancelButtonText: t('common.cancel'),
        type: 'warning'
      })
    } catch {
      return
    }

    try {
      await logoutApi()
    } finally {
      await userStore.logout()
    }
  }
</script>

<template>
  <ElDropdown class="header-action" :class="prefixCls" trigger="click">
    <div class="flex items-center">
      <img
        src="@/assets/imgs/avatar.jpg"
        alt=""
        class="w-[calc(var(--logo-height)-25px)] rounded-[50%]"
      />
      <span class="<lg:hidden text-14px pl-[5px] text-[var(--top-header-text-color)]">{{
        userStore.userInfo?.nickname || userStore.userInfo?.username
      }}</span>
    </div>
    <template #dropdown>
      <ElDropdownMenu>
        <ElDropdownItem>
          <div @click="openPwdDialog">修改密码</div>
        </ElDropdownItem>
        <ElDropdownItem divided>
          <div @click="loginOut">{{ t('common.loginOut') }}</div>
        </ElDropdownItem>
      </ElDropdownMenu>
    </template>
  </ElDropdown>

  <!-- 修改密码 -->
  <ElDialog v-model="pwdVisible" title="修改密码" width="440px" destroy-on-close>
    <ElForm ref="pwdFormRef" :model="pwdForm" :rules="pwdRules" label-width="90px">
      <ElFormItem label="原密码" prop="oldPassword">
        <ElInput v-model="pwdForm.oldPassword" type="password" show-password placeholder="请输入原密码" />
      </ElFormItem>
      <ElFormItem label="新密码" prop="newPassword">
        <ElInput v-model="pwdForm.newPassword" type="password" show-password placeholder="6-32 位" />
      </ElFormItem>
      <ElFormItem label="确认新密码" prop="confirmPassword">
        <ElInput v-model="pwdForm.confirmPassword" type="password" show-password placeholder="再次输入新密码" />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="pwdVisible = false">取消</ElButton>
      <ElButton type="primary" :loading="pwdSaving" @click="submitPwd">确定</ElButton>
    </template>
  </ElDialog>
</template>
