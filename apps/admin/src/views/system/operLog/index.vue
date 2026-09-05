<script setup lang="ts">
  import { onMounted, reactive, ref } from 'vue'
  import {
    ElButton,
    ElDatePicker,
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
    ElTag
  } from 'element-plus'
  import ContentWrap from '@/components/ContentWrap/index.vue'
  import type { OperLogRow } from '@/api/system/types'
  import { operLogClearApi, operLogPageApi, operLogRemoveApi } from '@/api/system/operLog'
  import { usePermissionStore } from '@/store/modules/permission'

  const permissionStore = usePermissionStore()
  const hasPerm = permissionStore.hasPerm

  const listLoading = ref(false)
  const list = ref<OperLogRow[]>([])
  const total = ref(0)
  const selected = ref<OperLogRow[]>([])
  const query = reactive({
    current: 1,
    size: 10,
    keyword: '',
    status: '' as number | '',
    timeRange: [] as string[]
  })

  const fetchList = async () => {
    listLoading.value = true
    try {
      const res = await operLogPageApi(query.current, query.size, {
        keyword: query.keyword,
        status: query.status,
        timeRange: query.timeRange.length === 2 ? query.timeRange : undefined
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
    query.status = ''
    query.timeRange = []
    onSearch()
  }

  const onSelectionChange = (rows: OperLogRow[]) => {
    selected.value = rows ?? []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- 表格行
  const onRemove = async (row: any) => {
    try {
      await ElMessageBox.confirm('确定删除这条操作日志吗?', '提示', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      })
    } catch {
      return
    }
    try {
      await operLogRemoveApi(row.id)
    } catch {
      return
    }
    ElMessage.success('删除成功')
    if (list.value.length === 1 && query.current > 1) query.current -= 1
    fetchList()
  }

  const onRemoveBatch = async () => {
    if (!selected.value.length) {
      ElMessage.warning('请先勾选要删除的日志')
      return
    }
    try {
      await ElMessageBox.confirm(`确定删除选中的 ${selected.value.length} 条日志吗?`, '提示', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      })
    } catch {
      return
    }
    try {
      for (const row of selected.value) await operLogRemoveApi(row.id)
    } catch {
      return
    }
    ElMessage.success('批量删除成功')
    fetchList()
  }

  const onClear = async () => {
    try {
      await ElMessageBox.confirm('确定清空全部操作日志吗? 不可恢复!', '危险操作', {
        confirmButtonText: '清空',
        cancelButtonText: '取消',
        type: 'warning'
      })
    } catch {
      return
    }
    try {
      await operLogClearApi()
    } catch {
      return
    }
    ElMessage.success('已清空')
    onReset()
  }

  onMounted(fetchList)
</script>

<template>
  <ContentWrap title="操作日志" message="记录关键写操作的模块/操作人/参数/结果/耗时(审计)">
    <template #header>
      <el-button
        v-if="hasPerm('sys:operLog:delete')"
        :disabled="!selected.length"
        @click="onRemoveBatch"
      >
        批量删除
      </el-button>
      <el-button v-if="hasPerm('sys:operLog:delete')" type="danger" plain @click="onClear"
        >清空</el-button
      >
    </template>

    <el-form inline class="search-bar" @submit.prevent>
      <el-form-item label="模块/操作人">
        <el-input
          v-model="query.keyword"
          placeholder="模糊搜索"
          clearable
          style="width: 180px"
          @keyup.enter="onSearch"
        />
      </el-form-item>
      <el-form-item label="结果">
        <el-select v-model="query.status" placeholder="全部" clearable style="width: 110px">
          <el-option label="成功" :value="0" />
          <el-option label="失败" :value="1" />
        </el-select>
      </el-form-item>
      <el-form-item label="时间">
        <el-date-picker
          v-model="query.timeRange"
          type="datetimerange"
          range-separator="~"
          start-placeholder="开始"
          end-placeholder="结束"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 360px"
        />
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
      <el-table-column prop="module" label="模块" width="110" align="center" />
      <el-table-column prop="operation" label="操作" width="130" align="center" />
      <el-table-column prop="operatorName" label="操作人" width="110" align="center" />
      <el-table-column prop="method" label="方法" width="80" align="center" />
      <el-table-column prop="url" label="地址" min-width="160" show-overflow-tooltip />
      <el-table-column prop="params" label="请求参数" min-width="180" show-overflow-tooltip />
      <el-table-column label="结果" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 0 ? 'success' : 'danger'">{{
            row.status === 0 ? '成功' : '失败'
          }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="ip" label="IP" width="120" />
      <el-table-column label="耗时" width="90" align="right">
        <template #default="{ row }">{{ row.costMs }}ms</template>
      </el-table-column>
      <el-table-column prop="operTime" label="操作时间" width="170" />
      <el-table-column label="操作" width="80" align="center" fixed="right">
        <template #default="{ row }">
          <el-button v-if="hasPerm('sys:operLog:delete')" link type="danger" @click="onRemove(row)"
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
  </ContentWrap>
</template>

<style lang="less" scoped>
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
