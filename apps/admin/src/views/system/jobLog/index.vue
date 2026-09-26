<script setup lang="ts">
  import { onMounted, reactive, ref } from 'vue'
  import { useRoute } from 'vue-router'
  import {
    ElButton,
    ElDatePicker,
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
  import type { SysJobLogRow } from '@/api/system/types'
  import {
    jobLogClearApi,
    jobLogPageApi,
    jobLogRemoveApi,
    jobLogRemoveBatchApi
  } from '@/api/system/jobLog'
  import { usePermissionStore } from '@/store/modules/permission'

  const route = useRoute()
  const permissionStore = usePermissionStore()
  const hasPerm = permissionStore.hasPerm

  /** 由任务列表页"日志"按钮带入的任务id筛选 */
  const presetsJobId = route.query.jobId ? Number(route.query.jobId) : ''

  const listLoading = ref(false)
  const list = ref<SysJobLogRow[]>([])
  const total = ref(0)
  const selected = ref<SysJobLogRow[]>([])
  const query = reactive({
    current: 1,
    size: 10,
    jobId: presetsJobId as number | '',
    jobName: '',
    success: '' as number | '',
    triggerType: '' as number | '',
    timeRange: [] as string[]
  })

  const fetchList = async () => {
    listLoading.value = true
    try {
      const res = await jobLogPageApi(query.current, query.size, {
        jobId: query.jobId,
        jobName: query.jobName,
        success: query.success,
        triggerType: query.triggerType,
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
    query.jobId = ''
    query.jobName = ''
    query.success = ''
    query.triggerType = ''
    query.timeRange = []
    onSearch()
  }

  const onSelectionChange = (rows: SysJobLogRow[]) => {
    selected.value = rows ?? []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- 表格行
  const onRemove = async (row: any) => {
    try {
      await ElMessageBox.confirm('确定删除这条任务日志吗?', '提示', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      })
    } catch {
      return
    }
    try {
      await jobLogRemoveApi(row.id)
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
      await jobLogRemoveBatchApi(selected.value.map((row) => row.id as number))
    } catch {
      return
    }
    ElMessage.success('批量删除成功')
    fetchList()
  }

  const onClear = async () => {
    try {
      await ElMessageBox.confirm('确定清空全部任务日志吗? 不可恢复!', '危险操作', {
        confirmButtonText: '清空',
        cancelButtonText: '取消',
        type: 'warning'
      })
    } catch {
      return
    }
    try {
      await jobLogClearApi()
    } catch {
      return
    }
    ElMessage.success('已清空')
    onReset()
  }

  onMounted(fetchList)
</script>

<template>
  <ContentWrap title="任务日志" message="每次自动调度/手动执行的快照与结果, 异常信息可展开查看(建议启用内置日志清理任务)">
    <template #header>
      <el-button
        v-if="hasPerm('sys:jobLog:delete')"
        :disabled="!selected.length"
        @click="onRemoveBatch"
      >
        批量删除
      </el-button>
      <el-button v-if="hasPerm('sys:jobLog:delete')" type="danger" plain @click="onClear"
        >清空</el-button
      >
    </template>

    <el-form inline class="search-bar" @submit.prevent>
      <el-form-item label="任务名称">
        <el-input
          v-model="query.jobName"
          placeholder="模糊搜索"
          clearable
          style="width: 170px"
          @keyup.enter="onSearch"
        />
      </el-form-item>
      <el-form-item label="结果">
        <el-select v-model="query.success" placeholder="全部" clearable style="width: 100px">
          <el-option label="成功" :value="0" />
          <el-option label="失败" :value="1" />
        </el-select>
      </el-form-item>
      <el-form-item label="触发方式">
        <el-select v-model="query.triggerType" placeholder="全部" clearable style="width: 110px">
          <el-option label="自动调度" :value="0" />
          <el-option label="手动执行" :value="1" />
        </el-select>
      </el-form-item>
      <el-form-item label="开始时间">
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
      <el-table-column type="expand">
        <template #default="{ row }">
          <div class="expand-box">
            <p><b>参数:</b> {{ row.params || '-' }}</p>
            <p><b>执行消息:</b> {{ row.jobMessage || '-' }}</p>
            <p v-if="row.exceptionInfo"><b>异常堆栈:</b></p>
            <pre v-if="row.exceptionInfo" class="exception-info">{{ row.exceptionInfo }}</pre>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="jobName" label="任务名称" min-width="150" />
      <el-table-column prop="invokeTarget" label="调用目标" min-width="180" show-overflow-tooltip />
      <el-table-column label="触发" width="90" align="center">
        <template #default="{ row }">
          <el-tag v-if="row.triggerType === 1" type="warning" size="small">手动</el-tag>
          <el-tag v-else size="small">自动</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="结果" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="row.success === 0 ? 'success' : 'danger'" size="small">{{
            row.success === 0 ? '成功' : '失败'
          }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="jobMessage" label="执行消息" min-width="180" show-overflow-tooltip />
      <el-table-column label="耗时" width="90" align="right">
        <template #default="{ row }">{{ row.costMs }}ms</template>
      </el-table-column>
      <el-table-column prop="startTime" label="开始时间" width="165" />
      <el-table-column label="操作" width="80" align="center" fixed="right">
        <template #default="{ row }">
          <el-button v-if="hasPerm('sys:jobLog:delete')" link type="danger" @click="onRemove(row)"
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

  .expand-box {
    padding: 6px 18px;
    font-size: 12.5px;
    line-height: 1.8;
    color: var(--el-text-color-regular);
  }

  .exception-info {
    overflow: auto;
    padding: 10px 12px;
    margin: 4px 0 0;
    font-family: SFMono-Regular, Consolas, monospace;
    font-size: 12px;
    line-height: 1.6;
    color: #d4380d;
    background: var(--el-fill-color-light);
    border-radius: 6px;
    white-space: pre-wrap;
  }
</style>
