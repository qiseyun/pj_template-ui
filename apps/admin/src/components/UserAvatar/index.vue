<script setup lang="ts">
  import { onBeforeUnmount, ref, watch } from 'vue'
  import { fetchPreviewBlob } from '@/api/system/file'
  import defaultAvatar from '@/assets/imgs/avatar.jpg'

  /**
   * 用户头像: 传入 sys_file 文件id, 带鉴权拉取展示; 无头像/加载失败回退默认图
   */
  const props = withDefaults(
    defineProps<{
      fileId?: string | null
      alt?: string
    }>(),
    { fileId: null, alt: '' }
  )

  const src = ref('')
  let objUrl: string | undefined

  const release = () => {
    if (objUrl) {
      URL.revokeObjectURL(objUrl)
      objUrl = undefined
    }
  }

  const load = async () => {
    release()
    if (!props.fileId) {
      src.value = ''
      return
    }
    try {
      const blob = await fetchPreviewBlob(props.fileId)
      objUrl = URL.createObjectURL(blob)
      src.value = objUrl
    } catch {
      // 加载失败回退默认头像
      src.value = ''
    }
  }

  watch(
    () => props.fileId,
    () => load(),
    { immediate: true }
  )

  onBeforeUnmount(release)
</script>

<template>
  <img :src="src || defaultAvatar" :alt="alt || 'avatar'" class="user-avatar" />
</template>

<style lang="less" scoped>
  .user-avatar {
    display: block;
    object-fit: cover;
    border-radius: 50%;

    /* 尺寸由使用方(外部 class)控制, 此处不写宽高避免覆盖 */
  }
</style>
