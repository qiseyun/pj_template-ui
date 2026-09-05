<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
  import {
    ElButton,
    ElMessage,
    ElMessageBox,
    ElPagination,
    ElTable,
    ElTableColumn,
    ElTag
  } from 'element-plus'
  import ContentWrap from '@/components/ContentWrap/index.vue'
  import type { OnlineUserRow } from '@/api/system/types'
  import { onlineKickApi, onlineListApi } from '@/api/system/online'
  import { usePermissionStore } from '@/store/modules/permission'
  import { useUserStore } from '@/store/modules/user'

  const permissionStore = usePermissionStore()
  const userStore = useUserStore()
  const hasPerm = permissionStore.hasPerm

  const listLoading = ref(false)
  const list = ref<OnlineUserRow[]>([])
  const pager = reactive({ current: 1, size: 10 })
  const pageSizeOptions = [10, 20, 50]
  /** 自动刷新定时器(30s) */
  let refreshTimer: ReturnType<typeof setInterval> | null = null

  const fetchList = async () => {
    listLoading.value = true
    try {
      const res = await onlineListApi()
      list.value = res?.data ?? []
      const maxPage = Math.max(1, Math.ceil(list.value.length / pager.size))
      if (pager.current > maxPage) pager.current = maxPage
    } catch {
      // 错误提示已由请求层弹出
    } finally {
      listLoading.value = false
    }
  }

  /** 剩余有效期可读化 */
  const fmtRemain = (seconds: number) => {
    if (!seconds || seconds <= 0) return '-'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 1) return '<1分钟'
    if (minutes < 60) return `${minutes} 分钟`
    const hours = Math.floor(minutes / 60)
    const leftMinutes = minutes % 60
    return leftMinutes > 0 ? `${hours} 小时 ${leftMinutes} 分` : `${hours} 小时`
  }

  const pagedList = computed(() => {
    const start = (pager.current - 1) * pager.size
    return list.value.slice(start, start + pager.size)
  })

  watch(
    () => pager.size,
    () => {
      const maxPage = Math.max(1, Math.ceil(list.value.length / pager.size))
      if (pager.current > maxPage) pager.current = maxPage
    }
  )

  /* ---------- 强踢 ---------- */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- el-table 插槽行类型与业务行类型解耦
  const onKick = async (row: any) => {
    try {
      await ElMessageBox.confirm(
        `确定强制下线用户「${row.username ?? ''}」吗? 其全部会话将被撤销并立即登出`,
        '提示',
        { confirmButtonText: '强制下线', cancelButtonText: '取消', type: 'warning' }
      )
    } catch {
      return
    }
    try {
      await onlineKickApi(row.userId)
    } catch {
      return
    }
    ElMessage.success('已强制下线')
    fetchList()
  }

  const toggleAutoRefresh = (auto: boolean) => {
    if (refreshTimer) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }
    if (auto) {
      refreshTimer = setInterval(fetchList, 30000)
    }
  }

  onMounted(() => {
    fetchList()
    toggleAutoRefresh(true)
  })

  onBeforeUnmount(() => {
    toggleAutoRefresh(false)
  })
</script>

<template>
  <ContentWrap
    title="在线用户"
    message="基于有效登录会话实时聚合; 可查看多端登录并强制下线异常会话"
  >
    <template #header>
      <el-button type="primary" :loading="listLoading" @click="fetchList">刷新</el-button>
    </template>

    <el-table v-loading="listLoading" :data="pagedList" border stripe>
      <el-table-column prop="username" label="用户名" min-width="130" />
      <el-table-column prop="nickname" label="昵称" min-width="130" />
      <el-table-column label="多端会话" width="100" align="center">
        <template #default="{ row }">
          <el-tag v-if="row.sessionCount > 1" type="warning">{{ row.sessionCount }} 端在线</el-tag>
          <el-tag v-else type="success">1 端在线</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="会话剩余有效期" width="140" align="center">
        <template #default="{ row }">{{ fmtRemain(row.remainSeconds) }}</template>
      </el-table-column>
      <el-table-column prop="lastLoginTime" label="最后登录时间" width="170" />
      <el-table-column label="操作" width="110" align="center" fixed="right">
        <template #default="{ row }">
          <el-button
            v-if="hasPerm('sys:online:kick')"
            link
            type="danger"
            :disabled="row.userId === userStore.userInfo?.id"
            @click="onKick(row)"
          >
            强制下线
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager">
      <el-pagination
        v-model:current-page="pager.current"
        v-model:page-size="pager.size"
        :total="list.length"
        :page-sizes="pageSizeOptions"
        layout="total, sizes, prev, pager, next"
        background
      />
    </div>
  </ContentWrap>
</template>

<style lang="less" scoped>
  .pager {
    display: flex;
    padding: 16px 2px 2px;
    justify-content: flex-end;
  }
</style>
