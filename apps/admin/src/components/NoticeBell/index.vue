<script setup lang="ts">
  import { onMounted, reactive, ref, watch } from 'vue'
  import {
    ElBadge,
    ElDialog,
    ElDrawer,
    ElEmpty,
    ElPagination,
    ElScrollbar,
    ElTabPane,
    ElTabs,
    ElTag
  } from 'element-plus'
  import type { NoticeKind, NoticeRow } from '@/api/notice/types'
  import { markNoticeReadApi, myNoticeDetailApi, myNoticePageApi } from '@/api/notice'
  import { useNoticeStore } from '@/store/modules/notice'

  const noticeStore = useNoticeStore()

  const prefixCls = 'v-notice-bell'

  /* ---------- 抽屉与标签 ---------- */
  const drawerVisible = ref(false)
  const activeTab = ref<'notice' | 'announcement'>('notice')
  const tabs = [
    { key: 'notice', label: '通知', type: 1 as NoticeKind },
    { key: 'announcement', label: '公告', type: 2 as NoticeKind }
  ]

  /* ---------- 列表 ---------- */
  const loading = ref(false)
  const list = ref<NoticeRow[]>([])
  const total = ref(0)
  const pageQuery = reactive({ current: 1, size: 8 })

  const fetchList = async (resetPage = false) => {
    if (resetPage) pageQuery.current = 1
    loading.value = true
    try {
      const type = tabs.find((t) => t.key === activeTab.value)?.type
      const res = await myNoticePageApi({
        current: pageQuery.current,
        size: pageQuery.size,
        type
      })
      list.value = res?.data?.records ?? []
      total.value = res?.data?.total ?? 0
    } catch (error) {
      list.value = []
      total.value = 0
    } finally {
      loading.value = false
    }
  }

  const openDrawer = () => {
    drawerVisible.value = true
    void noticeStore.refreshUnread()
    fetchList(true)
  }

  const onTabChange = () => {
    fetchList(true)
  }

  /* ---------- 阅读弹窗 ---------- */
  const reading = ref(false)
  const readingItem = ref<NoticeRow | null>(null)
  const readingLoading = ref(false)

  const openReading = async (row: NoticeRow) => {
    reading.value = true
    readingLoading.value = true
    readingItem.value = null
    try {
      const detail = await myNoticeDetailApi(row.id)
      readingItem.value = detail?.data ?? row
      // 未读则标记已读并刷新角标/条目状态
      if ((detail?.data?.isRead ?? row.isRead) === 0) {
        await markNoticeReadApi([row.id])
        row.isRead = 1
        await noticeStore.refreshUnread()
      }
    } catch (error) {
      reading.value = false
    } finally {
      readingLoading.value = false
    }
  }

  const kindTag = (row: NoticeRow) => {
    const kind = row.noticeType === 2 ? '公告' : '通知'
    const color = row.noticeType === 2 ? 'danger' : 'primary'
    return { kind, color: color as 'primary' | 'danger' }
  }

  const formatTime = (value?: string) => (value ? String(value).replace('T', ' ').slice(0, 19) : '')

  /* ---------- 新消息到达时若抽屉已打开则刷新当前列表 ---------- */
  watch(
    () => noticeStore.lastArriveAt,
    () => {
      if (drawerVisible.value) fetchList(false)
    }
  )

  onMounted(() => {
    void noticeStore.refreshUnread()
  })
</script>

<template>
  <div :class="prefixCls" class="header-action" @click="openDrawer">
    <el-badge
      :value="noticeStore.unread"
      :max="99"
      :hidden="noticeStore.unread <= 0"
      class="notice-badge"
      :offset="[2, 2]"
    >
      <button type="button" class="notice-trigger" :title="'通知公告'">
        <Icon :icon="noticeStore.unread > 0 ? 'bell-ring' : 'bell-outline'" :size="20" />
      </button>
    </el-badge>
  </div>

  <!-- 右侧抽屉 -->
  <el-drawer v-model="drawerVisible" :size="440" title="消息中心" append-to-body>
    <el-tabs v-model="activeTab" class="notice-tabs" @tab-change="onTabChange">
      <el-tab-pane v-for="tab in tabs" :key="tab.key" :name="tab.key">
        <template #label>
          <span class="tab-label">
            <Icon :icon="tab.key === 'notice' ? 'bell-outline' : 'announcement'" :size="15" />
            {{ tab.label }}
          </span>
        </template>
      </el-tab-pane>
    </el-tabs>

    <div v-loading="loading" class="notice-list-wrap">
      <el-scrollbar v-if="list.length" class="notice-list">
        <div
          v-for="row in list"
          :key="row.id"
          class="notice-item"
          :class="{ 'is-read': row.isRead === 1 }"
          @click="openReading(row)"
        >
          <span class="notice-dot" :class="{ 'is-read': row.isRead === 1 }"></span>
          <div class="notice-main">
            <div class="notice-title">
              <el-tag size="small" :type="kindTag(row).color" effect="light">{{ kindTag(row).kind }}</el-tag>
              <span class="title-text">{{ row.title }}</span>
            </div>
            <div class="notice-meta">
              <span>{{ row.senderName || '系统' }}</span>
              <span>·</span>
              <span>{{ formatTime(row.gmtCreated) }}</span>
              <span class="read-state">{{ row.isRead === 1 ? '已读' : '未读' }}</span>
            </div>
          </div>
        </div>
      </el-scrollbar>
      <el-empty v-else-if="!loading" description="暂无消息" :image-size="80" />
    </div>

    <div v-if="total > 0" class="notice-pager">
      <el-pagination
        v-model:current-page="pageQuery.current"
        v-model:page-size="pageQuery.size"
        :size="'small'"
        background
        :total="total"
        layout="prev, pager, next"
        @current-change="fetchList(false)"
      />
    </div>
  </el-drawer>

  <!-- 阅读弹窗 -->
  <el-dialog
    v-model="reading"
    width="760px"
    top="6vh"
    append-to-body
    :show-close="true"
    class="notice-read-dialog"
  >
    <template #header>
      <div class="read-header" v-if="readingItem">
        <el-tag v-if="readingItem.noticeType" size="small" :type="kindTag(readingItem).color" effect="dark">
          {{ kindTag(readingItem).kind }}
        </el-tag>
        <span class="read-title">{{ readingItem.title }}</span>
      </div>
    </template>
    <div v-loading="readingLoading" class="read-body">
      <div v-if="readingItem" class="read-meta">
        发布人：{{ readingItem.senderName || '系统' }}　·　发布时间：{{ formatTime(readingItem.gmtCreated) }}
        <span v-if="readingItem.targetDesc" class="read-target">{{ readingItem.targetDesc }}</span>
      </div>
      <!-- 富文本内容(后台管理端发布, 内网可信) -->
      <div v-if="readingItem?.content" class="rich-content" v-html="readingItem.content"></div>
    </div>
  </el-dialog>
</template>

<style lang="less" scoped>
  .notice-badge {
    display: inline-flex;

    :deep(.el-badge__content) {
      font-size: 11px;
      border: 2px solid var(--top-header-bg-color);
    }
  }

  .notice-trigger {
    display: grid;
    height: 100%;
    padding: 0 9px;
    color: var(--top-header-text-color);
    cursor: pointer;
    background: transparent;
    border: 0;
    outline: none;
    place-items: center;
    transition:
      color 160ms ease,
      background-color 160ms ease;

    &:hover,
    &:focus-visible {
      color: var(--el-color-primary) !important;
      background: var(--top-header-hover-color);
      outline: none;
    }
  }

  .tab-label {
    display: inline-flex;
    gap: 5px;
    align-items: center;
  }

  .notice-list-wrap {
    min-height: 180px;
    margin: 0 -16px;
  }

  .notice-list {
    height: calc(100vh - 220px);
  }

  .notice-item {
    display: flex;
    gap: 10px;
    padding: 14px 16px;
    cursor: pointer;
    border-bottom: 1px solid var(--el-border-color-lighter);
    transition: background-color 150ms ease;

    &:hover {
      background: var(--el-fill-color-light);
    }

    .notice-dot {
      flex: none;
      width: 8px;
      height: 8px;
      margin-top: 7px;
      background: var(--el-color-danger);
      border-radius: 50%;

      &.is-read {
        background: transparent;
      }
    }

    .notice-main {
      min-width: 0;
      flex: 1;
    }

    .notice-title {
      display: flex;
      gap: 8px;
      align-items: center;

      .title-text {
        overflow: hidden;
        font-size: 13.5px;
        font-weight: 600;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .notice-meta {
      display: flex;
      gap: 6px;
      align-items: center;
      margin-top: 6px;
      font-size: 12px;
      color: var(--el-text-color-secondary);

      .read-state {
        margin-left: auto;
      }
    }

    &.is-read {
      .title-text {
        font-weight: 400;
        color: var(--el-text-color-regular);
      }
    }
  }

  .notice-pager {
    display: flex;
    padding-top: 12px;
    justify-content: center;
  }

  .read-header {
    display: flex;
    gap: 10px;
    align-items: center;
    padding-right: 26px;

    .read-title {
      font-size: 17px;
      font-weight: 700;
    }
  }

  .read-body {
    min-height: 200px;

    .read-meta {
      padding: 0 2px 14px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
      border-bottom: 1px dashed var(--el-border-color-lighter);

      .read-target {
        margin-left: 12px;
      }
    }

    .read-target::before {
      content: '';
    }

    :deep(.rich-content) {
      padding: 16px 2px;
      font-size: 14px;
      line-height: 1.9;
      color: var(--el-text-color-primary);
      overflow-wrap: break-word;

      p {
        margin: 0 0 12px;
      }

      h1,
      h2,
      h3 {
        margin: 18px 0 10px;
        line-height: 1.4;
      }

      ul,
      ol {
        padding-left: 22px;
        margin: 8px 0;
      }

      img {
        max-width: 100%;
      }

      blockquote {
        padding: 6px 14px;
        margin: 10px 0;
        color: var(--el-text-color-secondary);
        background: var(--el-fill-color-light);
        border-left: 3px solid var(--el-color-primary);
      }
    }
  }
</style>
