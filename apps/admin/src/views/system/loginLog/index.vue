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
  import type { SysLoginLogRow } from '@/api/system/types'
  import {
    loginLogClearApi,
    loginLogPageApi,
    loginLogRemoveApi,
    loginLogRemoveBatchApi
  } from '@/api/system/loginLog'
  import { usePermissionStore } from '@/store/modules/permission'

  const permissionStore = usePermissionStore()
  const hasPerm = permissionStore.hasPerm

  /* ---------- 列表 ---------- */
  const listLoading = ref(false)
  const list = ref<SysLoginLogRow[]>([])
  const total = ref(0)
  const selectedRows = ref<SysLoginLogRow[]>([])
  const query = reactive({
    current: 1,
    size: 10,
    username: '',
    success: '' as number | '',
    loginTimeRange: [] as string[]
  })

  const fetchList = async () => {
    listLoading.value = true
    try {
      const res = await loginLogPageApi(query.current, query.size, {
        username: query.username,
        success: query.success,
        loginTimeRange: query.loginTimeRange.length === 2 ? query.loginTimeRange : undefined
      })
      list.value = res?.data?.records ?? []
      total.value = res?.data?.total ?? 0
    } catch {
      // 错误提示已由请求层弹出
    } finally {
      listLoading.value = false
    }
  }

  const onSearch = () => {
    query.current = 1
    fetchList()
  }

  const onReset = () => {
    query.username = ''
    query.success = ''
    query.loginTimeRange = []
    onSearch()
  }

  const onSelectionChange = (rows: SysLoginLogRow[]) => {
    selectedRows.value = rows ?? []
  }

  /* ---------- 删除 ---------- */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- el-table 插槽行类型与业务行类型解耦
  const onRemove = async (row: any) => {
    try {
      await ElMessageBox.confirm(
        `确定删除 ${row.username ?? ''} 于 ${row.loginTime ?? ''} 的这条登录日志吗?`,
        '提示',
        { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
      )
    } catch {
      return
    }
    try {
      await loginLogRemoveApi(row.id)
    } catch {
      return
    }
    ElMessage.success('删除成功')
    if (list.value.length === 1 && query.current > 1) query.current -= 1
    fetchList()
  }

  const onRemoveBatch = async () => {
    if (selectedRows.value.length === 0) {
      ElMessage.warning('请先勾选要删除的日志')
      return
    }
    try {
      await ElMessageBox.confirm(`确定删除选中的 ${selectedRows.value.length} 条日志吗?`, '提示', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      })
    } catch {
      return
    }
    try {
      await loginLogRemoveBatchApi(selectedRows.value.map((row) => row.id))
    } catch {
      return
    }
    ElMessage.success('批量删除成功')
    fetchList()
  }

  const onClear = async () => {
    try {
      await ElMessageBox.confirm('确定清空全部登录日志吗? 该操作不可恢复!', '危险操作', {
        confirmButtonText: '清空',
        cancelButtonText: '取消',
        type: 'warning'
      })
    } catch {
      return
    }
    try {
      await loginLogClearApi()
    } catch {
      return
    }
    ElMessage.success('已清空登录日志')
    onReset()
  }

  onMounted(fetchList)
</script>

<template>
  <ContentWrap title="登录日志" message="记录登录成功/失败明细(账号/IP/来源/结果), 用于安全审计">
    <template #header>
      <el-button
        v-if="hasPerm('sys:loginLog:delete')"
        :disabled="selectedRows.length === 0"
        @click="onRemoveBatch"
      >
        批量删除
      </el-button>
      <el-button v-if="hasPerm('sys:loginLog:delete')" type="danger" plain @click="onClear">
        清空日志
      </el-button>
    </template>

    <el-form inline class="search-bar" @submit.prevent>
      <el-form-item label="用户名">
        <el-input
          v-model="query.username"
          placeholder="请输入用户名"
          clearable
          style="width: 170px"
          @keyup.enter="onSearch"
        />
      </el-form-item>
      <el-form-item label="结果">
        <el-select v-model="query.success" placeholder="全部" clearable style="width: 110px">
          <el-option label="成功" :value="0" />
          <el-option label="失败" :value="1" />
        </el-select>
      </el-form-item>
      <el-form-item label="登录时间">
        <el-date-picker
          v-model="query.loginTimeRange"
          type="datetimerange"
          range-separator="~"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 380px"
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
      <el-table-column prop="id" label="ID" width="80" align="center" />
      <el-table-column prop="username" label="用户名" min-width="110" />
      <el-table-column prop="ip" label="IP" width="130" />
      <el-table-column prop="userAgent" label="User-Agent" min-width="170" show-overflow-tooltip />
      <el-table-column label="结果" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="row.success === 0 ? 'success' : 'danger'">
            {{ row.success === 0 ? '成功' : '失败' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="message" label="说明" min-width="180" show-overflow-tooltip />
      <el-table-column prop="loginTime" label="登录时间" width="170" />
      <el-table-column label="操作" width="80" align="center" fixed="right">
        <template #default="{ row }">
          <el-button
            v-if="hasPerm('sys:loginLog:delete')"
            link
            type="danger"
            @click="onRemove(row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager">
      <el-pagination
        v-model:current-page="query.current"
        v-model:page-size="query.size"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
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
