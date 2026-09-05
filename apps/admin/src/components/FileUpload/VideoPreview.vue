<script setup lang="ts">
  import { ref, watch } from 'vue'
  import { ElDialog } from 'element-plus'
  import { fileVideoUrl } from '@/api/system/file'

  /**
   * 视频在线播放弹窗: v-model 控制显隐, fileId 变化时拉取视频(带鉴权 blob)
   */
  const props = withDefaults(
    defineProps<{
      modelValue?: boolean
      fileId?: string | null
      fileName?: string
    }>(),
    { modelValue: false, fileId: null, fileName: '视频播放' }
  )

  const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()

  const src = ref('')
  const loading = ref(false)
  const error = ref('')
  let objectUrl: string | undefined

  const clear = () => {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl)
      objectUrl = undefined
    }
    src.value = ''
    loading.value = false
    error.value = ''
  }

  watch(
    () => props.modelValue,
    async (visible) => {
      if (!visible) {
        clear()
        return
      }
      clear()
      if (!props.fileId) return
      loading.value = true
      try {
        objectUrl = await fileVideoUrl(props.fileId)
        src.value = objectUrl
      } catch {
        error.value = '视频加载失败'
      } finally {
        loading.value = false
      }
    }
  )

  const onClose = () => {
    clear()
    emit('update:modelValue', false)
  }
</script>

<template>
  <ElDialog
    :model-value="modelValue"
    :title="fileName || '视频播放'"
    width="820px"
    append-to-body
    destroy-on-close
    @update:model-value="(v: boolean) => (v ? emit('update:modelValue', v) : onClose())"
  >
    <div v-if="loading" class="video-tip">加载中…</div>
    <div v-else-if="error" class="video-tip video-error">{{ error }}</div>
    <video v-else-if="src" :src="src" class="video-player" controls autoplay />
  </ElDialog>
</template>

<style lang="less" scoped>
  .video-player {
    display: block;
    width: 100%;
    max-height: 66vh;
    background: #000;
    border-radius: 6px;
  }

  .video-tip {
    padding: 40px 0;
    text-align: center;
    color: var(--el-text-color-secondary);
  }

  .video-error {
    color: var(--el-color-danger);
  }
</style>
