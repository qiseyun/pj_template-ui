<script setup lang="ts">
  import { computed, onBeforeUnmount, ref, watch } from 'vue'
  import { ElButton, ElMessage, ElMessageBox } from 'element-plus'
  import VideoPreview from '@/components/FileUpload/VideoPreview.vue'
  import type { FileRow } from '@/api/system/types'
  import {
    fetchPreviewBlob,
    fileDeleteBatchApi,
    fileDownload,
    fileListByIdsApi,
    fileUpload,
    formatFileSize,
    isImageExt,
    isVideoExt
  } from '@/api/system/file'

  /** 附件上传/展示组件: modelValue 为文件 id 逗号分隔串, 可多文件 */
  const props = withDefaults(
    defineProps<{
      modelValue?: string
      multiple?: boolean
      limit?: number
      accept?: string
      readonly?: boolean
      disabled?: boolean
      sizeLimitMB?: number
      tip?: string
    }>(),
    {
      modelValue: '',
      multiple: true,
      limit: 9,
      accept: '',
      readonly: false,
      disabled: false,
      sizeLimitMB: 200,
      tip: ''
    }
  )

  const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

  const maxCount = computed(() => (props.multiple ? props.limit : 1))
  const ids = computed(() =>
    (props.modelValue || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  )

  interface DisplayItem {
    row: FileRow
    imgUrl?: string
    broken?: boolean
  }

  const items = ref<DisplayItem[]>([])
  const fileInput = ref<HTMLInputElement>()
  const uploading = ref(false)

  const cleanUrls = () => {
    items.value.forEach((it) => {
      if (it.imgUrl) URL.revokeObjectURL(it.imgUrl)
    })
  }

  const reload = async () => {
    const list = ids.value
    cleanUrls()
    items.value = []
    if (!list.length) return
    try {
      const res = await fileListByIdsApi(list)
      const rows = res?.data ?? []
      items.value = rows.map((row) => ({ row }))
      await Promise.all(
        items.value.map(async (it) => {
          if (!isImageExt(it.row.ext)) return
          try {
            const blob = await fetchPreviewBlob(it.row.id)
            it.imgUrl = URL.createObjectURL(blob)
          } catch {
            it.broken = true
          }
        })
      )
    } catch {
      // 错误提示已由请求层弹出
    }
  }

  watch(
    () => props.modelValue,
    () => reload(),
    { immediate: true }
  )

  onBeforeUnmount(cleanUrls)

  const pickFiles = () => {
    if (props.readonly || props.disabled) return
    if (items.value.length >= maxCount.value) {
      ElMessage.warning(`最多上传 ${maxCount.value} 个文件`)
      return
    }
    fileInput.value?.click()
  }

  const onInputChange = async (event: Event) => {
    const input = event.target as HTMLInputElement
    const files = input.files
    if (!files || !files.length) return
    input.value = ''
    const remain = maxCount.value - items.value.length
    const chosen = Array.from(files).slice(0, remain)
    if (chosen.length < files.length) {
      ElMessage.warning(`单次最多再传 ${remain} 个`)
    }
    uploading.value = true
    try {
      for (const file of chosen) {
        if (file.size > props.sizeLimitMB * 1024 * 1024) {
          ElMessage.warning(`文件「${file.name}」超过 ${props.sizeLimitMB}MB 限制`)
          continue
        }
        const row = await fileUpload(file)
        if (props.multiple) {
          items.value.push({ row })
        } else {
          const old = items.value
          cleanUrls()
          items.value = [{ row }]
          const oldIds = old.map((it) => it.row.id)
          if (oldIds.length) {
            try {
              await fileDeleteBatchApi(oldIds)
            } catch {
              // 忽略旧文件删除失败
            }
          }
        }
      }
      emitModel()
      ElMessage.success('上传成功')
    } catch (error) {
      ElMessage.error(error instanceof Error ? error.message : '上传失败')
    } finally {
      uploading.value = false
    }
  }

  const emitModel = () => {
    emit('update:modelValue', items.value.map((it) => it.row.id).join(','))
  }

  const videoVisible = ref(false)
  const videoRow = ref<DisplayItem | null>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- 列表行
  const openVideo = (item: any) => {
    videoRow.value = item
    videoVisible.value = true
  }

  const onDownload = async (item: DisplayItem) => {
    try {
      await fileDownload(item.row)
    } catch (error) {
      ElMessage.error(error instanceof Error ? error.message : '下载失败')
    }
  }

  const onRemove = async (index: number) => {
    if (props.readonly || props.disabled) return
    const item = items.value[index]
    if (!item) return
    try {
      await ElMessageBox.confirm('确定删除该文件吗? 物理文件将一并删除', '提示', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      })
    } catch {
      return
    }
    try {
      await fileDeleteBatchApi([item.row.id])
    } catch {
      return
    }
    if (item.imgUrl) URL.revokeObjectURL(item.imgUrl)
    items.value.splice(index, 1)
    emitModel()
    ElMessage.success('已删除')
  }
</script>

<template>
  <div class="file-attach">
    <div v-if="items.length" class="attach-list">
      <div v-for="(item, index) in items" :key="item.row.id" class="attach-row">
        <img v-if="item.imgUrl" :src="item.imgUrl" class="attach-img" alt="preview" />
        <span v-else class="attach-glyph">📄</span>
        <div class="attach-meta">
          <span class="attach-name" :title="item.row.originalName">
            {{ item.row.originalName || item.row.id }}
          </span>
          <span class="attach-sub">
            {{ formatFileSize(item.row.size) }}
            <template v-if="item.row.createTime"> · {{ item.row.createTime }}</template>
          </span>
        </div>
        <div class="attach-actions">
          <el-button v-if="isVideoExt(item.row.ext)" link type="success" @click="openVideo(item)"
            >播放</el-button
          >
          <el-button link type="primary" @click="onDownload(item)"> 下载 </el-button>
          <el-button v-if="!readonly && !disabled" link type="danger" @click="onRemove(index)">
            删除
          </el-button>
        </div>
      </div>
    </div>

    <div v-if="!readonly && !disabled" class="attach-add" @click="pickFiles">
      <span class="attach-glyph">＋</span>
      <span>{{ uploading ? '上传中…' : '上传附件' }}</span>
      <input
        ref="fileInput"
        type="file"
        :accept="accept"
        :multiple="multiple"
        class="file-input"
        @change="onInputChange"
      />
    </div>

    <div v-if="tip || !items.length" class="attach-tip">
      {{ tip || `点击上传附件(单文件 ≤ ${sizeLimitMB}MB)` }}
    </div>

    <VideoPreview
      v-model="videoVisible"
      :file-id="videoRow?.row.id ?? null"
      :file-name="videoRow?.row.originalName"
    />
  </div>
</template>

<style lang="less" scoped>
  .file-attach {
    width: 100%;
  }

  .attach-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 8px;
  }

  .attach-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    background: var(--el-fill-color-lighter);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
  }

  .attach-img {
    width: 44px;
    height: 44px;
    border-radius: 6px;
    object-fit: cover;
  }

  .attach-glyph {
    display: grid;
    width: 40px;
    height: 40px;
    font-size: 20px;
    background: var(--el-bg-color);
    border-radius: 6px;
    place-items: center;
  }

  .attach-meta {
    display: flex;
    min-width: 0;
    flex: 1;
    flex-direction: column;
    gap: 2px;
  }

  .attach-name {
    overflow: hidden;
    font-size: 13px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .attach-sub {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .attach-actions {
    flex: none;
  }

  .attach-add {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    font-size: 13px;
    color: var(--el-text-color-secondary);
    cursor: pointer;
    border: 1px dashed var(--el-border-color);
    border-radius: 8px;
    transition:
      color 160ms ease,
      border-color 160ms ease;

    &:hover {
      color: var(--el-color-primary);
      border-color: var(--el-color-primary);
    }
  }

  .file-input {
    display: none;
  }

  .attach-tip {
    margin-top: 6px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
</style>
