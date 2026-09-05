<script setup lang="ts">
  import { onMounted, reactive, ref } from 'vue'
  import {
    ElButton,
    ElForm,
    ElFormItem,
    ElInput,
    ElMessage,
    ElMessageBox,
    ElOption,
    ElPagination,
    ElSelect,
    ElTable,
    ElTableColumn,
    ElTag,
    ElUpload
  } from 'element-plus'
  import type { UploadRequestOptions } from 'element-plus'
  import ContentWrap from '@/components/ContentWrap/index.vue'
  import VideoPreview from '@/components/FileUpload/VideoPreview.vue'
  import type { FileRow } from '@/api/system/types'
  import {
    fileDeleteBatchApi,
    fileDownload,
    filePageApi,
    filePreviewUrl,
    fileUpload,
    formatFileSize,
    isImageExt,
    isVideoExt
  } from '@/api/system/file'
  import { usePermissionStore } from '@/store/modules/permission'

  const permissionStore = usePermissionStore()
  const hasPerm = permissionStore.hasPerm

  const listLoading = ref(false)
  const list = ref<FileRow[]>([])
  const total = ref(0)
  const selected = ref<FileRow[]>([])
  const uploading = ref(false)
  const query = reactive({ current: 1, size: 10, keyword: '', ext: '' })

  const fetchList = async () => {
    listLoading.value = true
    try {
      const res = await filePageApi(query.current, query.size, {
        keyword: query.keyword,
        ext: query.ext
      })
      list.value = res?.data?.records ?? []
      total.value = res?.data?.total ?? 0
    } finally {
      listLoading.value = false
    }
  }

  const onSearch = () => {
    query.current = 1
    fetchList()
  }

  const onReset = () => {
    query.keyword = ''
    query.ext = ''
    onSearch()
  }

  const onSelectionChange = (rows: FileRow[]) => {
    selected.value = rows ?? []
  }

  /* ---------- 上传(el-upload 每文件一次) ---------- */
  const httpRequest = async (options: UploadRequestOptions) => {
    uploading.value = true
    try {
      await fileUpload(options.file)
      fetchList()
    } finally {
      uploading.value = false
    }
  }

  /* ---------- 预览/下载/播放/删除 ---------- */
  const videoVisible = ref(false)
  const videoRow = ref<FileRow | null>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- 表格行
  const openVideo = (row: any) => {
    videoRow.value = row
    videoVisible.value = true
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- 表格行
  const onPreview = async (row: any) => {
    try {
      const url = await filePreviewUrl(row.id)
      window.open(url, '_blank')
    } catch {
      ElMessage.error('预览失败')
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- 表格行
  const onDownload = async (row: any) => {
    try {
      await fileDownload(row)
    } catch {
      ElMessage.error('下载失败')
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- 表格行
  const onRemove = async (row: any) => {
    try {
      await ElMessageBox.confirm(
        `确定删除文件「${row.originalName}」吗? 物理文件将一并删除`,
        '提示',
        {
          confirmButtonText: '删除',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
    } catch {
      return
    }
    try {
      await fileDeleteBatchApi([row.id])
    } catch {
      return
    }
    ElMessage.success('删除成功')
    if (list.value.length === 1 && query.current > 1) query.current -= 1
    fetchList()
  }

  const onRemoveBatch = async () => {
    if (!selected.value.length) {
      ElMessage.warning('请先勾选要删除的文件')
      return
    }
    try {
      await ElMessageBox.confirm(`确定删除选中的 ${selected.value.length} 个文件吗?`, '提示', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      })
    } catch {
      return
    }
    try {
      await fileDeleteBatchApi(selected.value.map((row) => row.id))
    } catch {
      return
    }
    ElMessage.success('批量删除成功')
    fetchList()
  }

  onMounted(fetchList)
</script>

<template>
  <ContentWrap
    title="文件管理"
    message="已上传文件集中管理: 可按名称/类型检索, 支持预览(图片)、下载与删除(删除为物理删除)"
  >
    <template #header>
      <el-upload
        :show-file-list="false"
        multiple
        :auto-upload="true"
        :http-request="httpRequest"
        :disabled="uploading"
      >
        <el-button type="primary" :loading="uploading">
          {{ uploading ? '上传中…' : '上传文件' }}
        </el-button>
      </el-upload>
      <el-button
        v-if="hasPerm('sys:file:delete')"
        :disabled="!selected.length"
        @click="onRemoveBatch"
      >
        批量删除
      </el-button>
    </template>

    <el-form inline class="search-bar" @submit.prevent>
      <el-form-item label="文件名">
        <el-input
          v-model="query.keyword"
          placeholder="模糊搜索"
          clearable
          style="width: 200px"
          @keyup.enter="onSearch"
        />
      </el-form-item>
      <el-form-item label="类型">
        <el-select v-model="query.ext" placeholder="全部" clearable style="width: 150px">
          <el-option label="图片" value="image" />
          <el-option label="视频" value="video" />
          <el-option label="Word 文档" value="word" />
          <el-option label="Excel 表格" value="excel" />
          <el-option label="PDF" value="pdf" />
          <el-option label="压缩包" value="zip" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSearch">查询</el-button>
        <el-button @click="onReset">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table
      v-loading="listLoading"
      :data="list"
      border
      stripe
      @selection-change="onSelectionChange"
    >
      <el-table-column type="selection" width="46" align="center" />
      <el-table-column label="文件名" min-width="220">
        <template #default="{ row }">
          <span :title="row.originalName">{{ row.originalName || row.id }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="id" label="文件ID" show-overflow-tooltip>
        <template #default="{ row }">
          <span class="id-cell" :title="row.id">{{ row.id }}</span>
        </template>
      </el-table-column>
      <el-table-column label="类型" width="90" align="center">
        <template #default="{ row }">
          <el-tag size="small">{{ row.ext || '-' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="大小" width="120">
        <template #default="{ row }">{{ formatFileSize(row.size) }}</template>
      </el-table-column>
      <el-table-column prop="uploaderName" label="上传人" width="220">
        <template #default="{ row }">
          id：{{ row.uploaderId || '-' }}
          <br />
          用户名：{{ row.uploaderName || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="上传时间" width="170" />
      <el-table-column label="操作" width="240" align="center" fixed="right">
        <template #default="{ row }">
          <el-button v-if="isImageExt(row.ext)" link type="primary" @click="onPreview(row)"
            >预览</el-button
          >
          <el-button v-if="isVideoExt(row.ext)" link type="success" @click="openVideo(row)"
            >播放</el-button
          >
          <el-button link type="primary" @click="onDownload(row)">下载</el-button>
          <el-button v-if="hasPerm('sys:file:delete')" link type="danger" @click="onRemove(row)"
            >删除</el-button
          >
        </template>
      </el-table-column>
    </el-table>

    <div class="pager">
      <el-pagination
        v-model:current-page="query.current"
        v-model:page-size="query.size"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        background
        @size-change="fetchList"
        @current-change="fetchList"
      />
    </div>

    <VideoPreview
      v-model="videoVisible"
      :file-id="videoRow?.id ?? null"
      :file-name="videoRow?.originalName"
    />
  </ContentWrap>
</template>

<style lang="less" scoped>
  .upload-input {
    display: none;
  }

  .id-cell {
    display: block;
    overflow: hidden;
    font-family: SFMono-Regular, Consolas, monospace;
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .search-bar {
    padding: 14px 16px 0;
    margin-bottom: 2px;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 12px;

    :deep(.el-form-item) {
      margin-bottom: 14px;
    }
  }

  .pager {
    display: flex;
    padding: 16px 2px 2px;
    justify-content: flex-end;
  }
</style>
