<script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import { ElButton, ElForm, ElFormItem, ElInput, ElMessage } from 'element-plus'
  import ContentWrap from '@/components/ContentWrap/index.vue'
  import ImageUpload from '@/components/FileUpload/ImageUpload.vue'
  import type { UserInfo } from '@/api/login/types'
  import { getProfileApi, updateProfileApi } from '@/api/system/profile'
  import { useUserStore } from '@/store/modules/user'

  const userStore = useUserStore()

  const loading = ref(false)
  const saving = ref(false)
  const profile = ref<UserInfo | null>(null)
  const nickname = ref('')
  const avatar = ref('')

  const loadProfile = async () => {
    loading.value = true
    try {
      const res = await getProfileApi()
      profile.value = res?.data ?? null
      nickname.value = res?.data?.nickname ?? ''
      avatar.value = res?.data?.avatar ?? ''
    } finally {
      loading.value = false
    }
  }

  const saveProfile = async () => {
    if (!nickname.value.trim()) {
      ElMessage.warning('昵称不能为空')
      return
    }
    saving.value = true
    try {
      const res = await updateProfileApi({ nickname: nickname.value.trim(), avatar: avatar.value })
      const updated = res?.data
      if (updated) {
        userStore.setUserInfo(updated)
        profile.value = updated
      }
      ElMessage.success('保存成功')
    } finally {
      saving.value = false
    }
  }

  onMounted(loadProfile)
</script>

<template>
  <ContentWrap title="个人中心" message="维护个人资料与头像; 修改密码请在右上角用户菜单中操作">
    <div class="profile-card">
      <div class="avatar-area">
        <div class="avatar-title">头像</div>
        <ImageUpload
          v-model="avatar"
          :multiple="false"
          :limit="1"
          accept=".jpg,.jpeg,.png,.gif,.webp,.bmp"
          :readonly="saving"
          tip="建议正方形图片"
        />
      </div>

      <el-form v-loading="loading" label-width="100px" class="profile-form">
        <el-form-item label="用户名">
          <el-input :model-value="profile?.username ?? '-'" disabled />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="nickname" maxlength="64" show-word-limit placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="最后登录时间">
          <el-input :model-value="profile?.lastLoginTime ?? '-'" disabled />
        </el-form-item>
        <el-form-item label="注册时间">
          <el-input :model-value="profile?.gmtCreated ?? '-'" disabled />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="saving" :disabled="loading" @click="saveProfile">
            保存
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </ContentWrap>
</template>

<style lang="less" scoped>
  .profile-card {
    display: flex;
    flex-wrap: wrap;
    gap: 40px;
    padding: 24px;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 12px;
  }

  .avatar-area {
    width: 240px;
  }

  .avatar-title {
    margin-bottom: 10px;
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .profile-form {
    min-width: 320px;
    flex: 1;
    max-width: 560px;
  }
</style>
