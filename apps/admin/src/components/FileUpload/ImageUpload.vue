<script setup lang="ts">
  import { computed, onBeforeUnmount, ref, watch } from 'vue'
  import { ElMessage, ElMessageBox, ElTag, ElUpload } from 'element-plus'
  import type { FileRow } from '@/api/system/types'
  import type { UploadRequestOptions } from 'element-plus'
  import {
    fileDeleteBatchApi,
    fileListByIdsApi,
    filePreviewUrl,
    fileUpload,
    isImageExt
  } from '@/api/system/file'

  /** 图片上传/展示组件: modelValue 为文件 id 逗号分隔串(与业务表存储一致) */
  const props = withDefaults(
    defineProps<{
      modelValue?: string
      /** 是否多图 */
      multiple?: boolean
      /** 最大数量(multiple=false 时固定 1) */
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
      accept: '.jpg,.jpeg,.png,.gif,.webp,.bmp',
      readonly: false,
      disabled: false,
      sizeLimitMB: 20,
      tip: ''
    }
  )

  const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

  const maxCount = computed(() => (props.multiple ? props.limit : 1))
  const canUpload = computed(
    () =>
      !props.readonly && !props.disabled && !uploading.value && items.value.length < maxCount.value
  )
  const ids = computed(() =>
    (props.modelValue || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  )

  interface DisplayItem {
    row: FileRow
    url?: string
    broken?: boolean
    loading?: boolean
  }

  const items = ref<DisplayItem[]>([])
  const uploading = ref(false)
  /** 竞态守卫: 只接受最新一次 reload 结果 */
  let loadGen = 0

  /** 释放已生成 objectURL */
  const revokeAll = () => {
    items.value.forEach((it) => {
      if (it.url) URL.revokeObjectURL(it.url)
    })
    items.value = []
  }

  const reload = async () => {
    const list = ids.value
    // 当前值已与展示一致(由本组件上传产生)时跳过, 避免刷新打断刚上传的预览
    if (items.value.length > 0 && items.value.map((it) => it.row.id).join(',') === list.join(',')) {
      return
    }
    revokeAll()
    if (!list.length) return
    const gen = ++loadGen
    try {
      const res = await fileListByIdsApi(list)
      if (gen !== loadGen) return
      const rows = res?.data ?? []
      items.value = rows.map((row) => ({ row }))
      await Promise.all(
        items.value.map(async (it) => {
          if (!isImageExt(it.row.ext)) return
          it.loading = true
          try {
            it.url = await filePreviewUrl(it.row.id)
          } catch {
            it.broken = true
          } finally {
            it.loading = false
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

  onBeforeUnmount(revokeAll)

  /**
   * el-upload 自定义上传: 真正上传单个文件
   * 成功: 追加/替换本地展示并输出 modelValue
   */
  const httpRequest = async (options: UploadRequestOptions) => {
    uploading.value = true
    try {
      const row = await fileUpload(options.file)
      // 使任何进行中的 reload 失效, 避免覆盖本次结果
      loadGen++
      // 直接用本地文件生成 objectURL 即时展示(零额外网络请求)
      const localUrl = isImageExt(row.ext) ? URL.createObjectURL(options.file) : undefined
      let next: DisplayItem[]
      if (props.multiple) {
        next = [...items.value, { row, url: localUrl }]
      } else {
        const oldIds = items.value.map((it) => it.row.id)
        revokeAll()
        if (oldIds.length) {
          try {
            await fileDeleteBatchApi(oldIds)
          } catch {
            // 删除旧图失败不阻断替换
          }
        }
        next = [{ row, url: localUrl }]
      }
      items.value = next
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

  const onRemove = async (index: number) => {
    if (props.readonly || props.disabled) return
    const item = items.value[index]
    if (!item) return
    try {
      await ElMessageBox.confirm('确定删除这张图片吗? 物理文件将一并删除', '提示', {
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
    if (item.url) URL.revokeObjectURL(item.url)
    items.value.splice(index, 1)
    emitModel()
    ElMessage.success('已删除')
  }

  const openPreview = (item: DisplayItem) => {
    if (item.url) window.open(item.url, '_blank')
  }
</script>

<template>
  <div class="file-picker">
    <div
      v-for="(item, index) in items"
      :key="item.row.id"
      class="file-tile"
      :class="{ broken: item.broken }"
      :title="item.row.originalName"
    >
      <img
        v-if="item.url && !item.broken"
        :src="item.url"
        class="file-thumb"
        alt="preview"
        @click="openPreview(item)"
      />
      <div v-else class="file-thumb file-placeholder">
        <span class="ph-glyph">▧</span>
        <span v-if="item.broken">加载失败</span>
        <span v-else-if="item.loading">加载中</span>
        <span v-else>{{ item.row.ext || 'file' }}</span>
      </div>
      <button
        v-if="!readonly && !disabled"
        type="button"
        class="file-remove"
        title="删除"
        @click.stop="onRemove(index)"
      >
        ×
      </button>
      <el-tag v-if="index === 0 && !multiple" class="file-tag" size="small" type="info">
        头像
      </el-tag>
    </div>

    <!-- 上传触发: 交给 Element Plus el-upload 管理文件选择与状态 -->
    <el-upload
      v-if="canUpload"
      class="file-upload"
      :show-file-list="false"
      :accept="accept"
      :multiple="multiple"
      :auto-upload="true"
      :http-request="httpRequest"
      :disabled="uploading"
    >
      <div class="file-tile file-add">
        <span class="add-glyph">{{ uploading ? '…' : '+' }}</span>
        <span>{{ uploading ? '上传中' : '上传图片' }}</span>
      </div>
    </el-upload>

    <div v-if="tip" class="file-tip">{{ tip }}(单张 ≤ {{ sizeLimitMB }}MB)</div>
  </div>
</template>

<style lang="less" scoped>
  .file-picker {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 10px;
  }

  .file-tile {
    position: relative;
    width: 96px;
    height: 96px;
    overflow: hidden;
    background: var(--el-fill-color-light);
    border: 1px dashed var(--el-border-color);
    border-radius: 8px;
  }

  .file-thumb {
    display: flex;
    width: 100%;
    height: 100%;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    background: var(--el-fill-color-lighter);
    object-fit: cover;
    cursor: pointer;
  }

  .file-placeholder {
    flex-direction: column;
    gap: 4px;
    background: var(--el-fill-color-lighter);
  }

  .ph-glyph {
    font-size: 22px;
    line-height: 1;
  }

  .file-remove {
    position: absolute;
    top: 2px;
    right: 2px;
    display: grid;
    width: 18px;
    height: 18px;
    padding: 0;
    font-size: 13px;
    line-height: 1;
    color: #fff;
    cursor: pointer;
    background: rgb(0 0 0 / 55%);
    border: 0;
    border-radius: 50%;
    place-items: center;

    &:hover {
      background: var(--el-color-danger);
    }
  }

  .file-tag {
    position: absolute;
    bottom: 2px;
    left: 2px;
  }

  /* el-upload 子触发块需占位正常 */
  .file-upload :deep(.el-upload) {
    display: block;
  }

  .file-add {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    cursor: pointer;
    transition: border-color 160ms ease;

    &:hover {
      border-color: var(--el-color-primary);
      color: var(--el-color-primary);
    }
  }

  .add-glyph {
    font-size: 26px;
    font-weight: 300;
    line-height: 1;
  }

  .file-tip {
    width: 100%;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
</style>
