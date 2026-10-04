<script setup lang="ts">
  import { onMounted, reactive, ref } from 'vue'
  import {
    ElButton,
    ElDialog,
    ElForm,
    ElFormItem,
    ElInput,
    ElMessage,
    ElOption,
    ElPagination,
    ElRadio,
    ElRadioButton,
    ElRadioGroup,
    ElSelect,
    ElTable,
    ElTableColumn,
    ElTag
  } from 'element-plus'
  import ContentWrap from '@/components/ContentWrap/index.vue'
  import WangEditor from '@/components/WangEditor/index.vue'
  import RichTextViewer from '@/components/RichTextViewer/index.vue'
  import { roleListAllApi } from '@/api/system/role'
  import { userPageApi } from '@/api/system/user'
  import type { SysRoleRow, SysUserRow } from '@/api/system/types'
  import type { NoticeKind, NoticeRow, NoticeTargetType } from '@/api/notice/types'
  import { noticeDetailApi, noticeHistoryPageApi, sendNoticeApi } from '@/api/notice'
  import { usePermissionStore } from '@/store/modules/permission'

  const permissionStore = usePermissionStore()
  const hasPerm = permissionStore.hasPerm

  /* ---------- 发送 ---------- */
  const sending = ref(false)
  const sendForm = reactive({
    noticeType: 1 as NoticeKind,
    title: '',
    content: '',
    targetType: 1 as NoticeTargetType,
    roleIds: [] as number[],
    userIds: [] as number[]
  })

  const roleOptions = ref<SysRoleRow[]>([])
  const userOptions = ref<SysUserRow[]>([])
  const userSearching = ref(false)

  const fetchRoles = async () => {
    try {
      const res = await roleListAllApi()
      roleOptions.value = (res?.data ?? []).filter((r) => r.status === 0)
    } catch (error) {
      roleOptions.value = []
    }
  }

  const searchUsers = async (keyword?: string) => {
    userSearching.value = true
    try {
      const res = await userPageApi(1, 30, { username: keyword || '', status: 0 })
      userOptions.value = res?.data?.records ?? []
    } catch (error) {
      userOptions.value = []
    } finally {
      userSearching.value = false
    }
  }

  const onUserRemoteSearch = (query: string) => {
    void searchUsers(query)
  }

  const userLabel = (row: SysUserRow) => `${row.nickname || row.username}(${row.username})`

  const targetModeOptions = [
    { value: 1 as NoticeTargetType, label: '全部用户' },
    { value: 2 as NoticeTargetType, label: '按角色发送' },
    { value: 3 as NoticeTargetType, label: '选择用户发送' }
  ]

  const submitSend = async () => {
    if (!sendForm.title.trim()) {
      ElMessage.warning('请输入标题')
      return
    }
    const plain = (sendForm.content || '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()
    // 纯图片/视频正文同样视为有效内容
    const hasMedia = /<(img|video)\b/i.test(sendForm.content || '')
    if (!plain && !hasMedia) {
      ElMessage.warning('请输入正文内容')
      return
    }
    if (sendForm.targetType === 2 && !sendForm.roleIds.length) {
      ElMessage.warning('请选择接收角色')
      return
    }
    if (sendForm.targetType === 3 && !sendForm.userIds.length) {
      ElMessage.warning('请选择接收用户')
      return
    }
    sending.value = true
    try {
      const payload = {
        noticeType: sendForm.noticeType,
        title: sendForm.title.trim(),
        content: sendForm.content,
        targetType: sendForm.targetType,
        roleIds: sendForm.targetType === 2 ? sendForm.roleIds : undefined,
        userIds: sendForm.targetType === 3 ? sendForm.userIds : undefined
      }
      const res = await sendNoticeApi(payload)
      const target = res?.data?.targetCount ?? 0
      const online = res?.data?.onlineCount ?? 0
      ElMessage.success(`发布成功, 共发送给 ${target} 人(当前在线 ${online} 人已收到实时提醒)`)
      // 复位正文, 保留类型与范围方便连续发布
      sendForm.title = ''
      sendForm.content = ''
      fetchHistory()
    } catch (error) {
      // 错误提示已由请求层弹出
    } finally {
      sending.value = false
    }
  }

  /* ---------- 发送历史 ---------- */
  const historyLoading = ref(false)
  const historyRows = ref<NoticeRow[]>([])
  const historyTotal = ref(0)
  const historyQuery = reactive({ current: 1, size: 10, type: 0 as 0 | 1 | 2 })

  const fetchHistory = async () => {
    historyLoading.value = true
    try {
      const res = await noticeHistoryPageApi(historyQuery)
      historyRows.value = res?.data?.records ?? []
      historyTotal.value = res?.data?.total ?? 0
    } catch (error) {
      historyRows.value = []
      historyTotal.value = 0
    } finally {
      historyLoading.value = false
    }
  }

  const typeTag = (type?: number) =>
    type === 2
      ? { text: '公告', color: 'danger' as const }
      : { text: '通知', color: 'primary' as const }

  /* ---------- 历史详情 ---------- */
  const detailVisible = ref(false)
  const detailLoading = ref(false)
  const detail = ref<NoticeRow | null>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- el-table 插槽行类型与业务行类型解耦
  const openDetail = async (row: any) => {
    detailVisible.value = true
    detailLoading.value = true
    detail.value = row
    try {
      const res = await noticeDetailApi(row.id)
      detail.value = res?.data ?? row
    } catch (error) {
      detailVisible.value = false
    } finally {
      detailLoading.value = false
    }
  }

  const formatTime = (value?: string) => (value ? String(value).replace('T', ' ').slice(0, 19) : '-')

  onMounted(() => {
    void fetchRoles()
    void searchUsers()
    void fetchHistory()
  })
</script>

<template>
  <div class="notice-page">
    <!-- 发布区 -->
    <ContentWrap
      v-if="hasPerm('sys:notice:send')"
      title="发布通知/公告"
      message="正文支持富文本(加粗、标题、列表、链接、图片与视频); 可选择全部用户、按角色或指定用户发送"
    >
      <el-form :model="sendForm" label-width="86px" class="send-form">
        <el-form-item label="类型">
          <el-radio-group v-model="sendForm.noticeType">
            <el-radio :value="1"><Icon icon="bell-outline" :size="14" /> 通知</el-radio>
            <el-radio :value="2"><Icon icon="announcement" :size="14" /> 公告</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="标题" required>
          <el-input
            v-model="sendForm.title"
            maxlength="200"
            show-word-limit
            placeholder="请输入标题"
          />
        </el-form-item>

        <el-form-item label="正文" required>
          <WangEditor
            v-model="sendForm.content"
            :height="460"
            placeholder="请输入通知/公告正文，支持加粗、标题、列表、引用、链接、图片与视频…"
          />
        </el-form-item>

        <el-form-item label="发送范围">
          <el-radio-group v-model="sendForm.targetType">
            <el-radio v-for="opt in targetModeOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </el-radio>
          </el-radio-group>
        </el-form-item>

        <template v-if="sendForm.targetType === 2">
          <el-form-item label="接收角色" required>
            <el-select
              v-model="sendForm.roleIds"
              multiple
              filterable
              placeholder="选择接收的角色(可多选)"
              style="width: 100%"
            >
              <el-option
                v-for="role in roleOptions"
                :key="role.id"
                :label="`${role.roleName}(${role.roleCode})`"
                :value="role.id"
              />
            </el-select>
          </el-form-item>
        </template>

        <template v-else-if="sendForm.targetType === 3">
          <el-form-item label="接收用户" required>
            <el-select
              v-model="sendForm.userIds"
              multiple
              filterable
              remote
              :remote-method="onUserRemoteSearch"
              :loading="userSearching"
              placeholder="输入用户名/昵称搜索并选择(可多选)"
              style="width: 100%"
              @focus="onUserRemoteSearch('')"
            >
              <el-option
                v-for="user in userOptions"
                :key="user.id"
                :label="userLabel(user)"
                :value="user.id"
              />
            </el-select>
          </el-form-item>
        </template>

        <el-form-item>
          <el-button type="primary" :loading="sending" @click="submitSend">
            {{ sendForm.noticeType === 2 ? '发布公告' : '发送通知' }}
          </el-button>
          <span class="send-tip">发送后目标用户顶部铃铛会实时收到未读提醒。</span>
        </el-form-item>
      </el-form>
    </ContentWrap>

    <!-- 历史记录 -->
    <ContentWrap v-if="hasPerm('sys:notice:list')" title="发送历史" message="按类型筛选全部已发送记录">
      <template #header>
        <el-radio-group v-model="historyQuery.type" size="small" @change="historyQuery.current = 1; fetchHistory()">
          <el-radio-button :value="0">全部</el-radio-button>
          <el-radio-button :value="1">通知</el-radio-button>
          <el-radio-button :value="2">公告</el-radio-button>
        </el-radio-group>
      </template>

      <el-table v-loading="historyLoading" :data="historyRows" border stripe>
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column label="类型" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="typeTag(row.noticeType).color" size="small" effect="light">
              {{ typeTag(row.noticeType).text }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="senderName" label="发送人" width="120" />
        <el-table-column prop="targetDesc" label="发送范围" min-width="180" show-overflow-tooltip />
        <el-table-column label="发送时间" width="175">
          <template #default="{ row }">{{ formatTime(row.gmtCreated) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="90" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="history-pager">
        <el-pagination
          v-model:current-page="historyQuery.current"
          v-model:page-size="historyQuery.size"
          :total="historyTotal"
          layout="total, prev, pager, next"
          background
          @current-change="fetchHistory"
        />
      </div>
    </ContentWrap>

    <!-- 详情弹窗 -->
    <el-dialog
      v-model="detailVisible"
      width="720px"
      top="8vh"
      append-to-body
      :title="detail ? `${typeTag(detail.noticeType).text}详情` : '详情'"
    >
      <div v-loading="detailLoading" class="detail-body" v-if="detail">
        <div class="detail-title">{{ detail.title }}</div>
        <div class="detail-meta">
          发送人：{{ detail.senderName || '-' }}　|　{{ formatTime(detail.gmtCreated) }}
          <span v-if="detail.targetDesc" class="detail-target">　|　{{ detail.targetDesc }}</span>
        </div>
        <div class="rich-content">
          <RichTextViewer :content="detail.content" empty-text="暂无正文" />
        </div>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="less" scoped>
  .notice-page {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .send-form {
    max-width: 900px;

    .send-tip {
      margin-left: 12px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }

  .history-pager {
    display: flex;
    padding-top: 14px;
    justify-content: flex-end;
  }

  .detail-body {
    min-height: 120px;

    .detail-title {
      font-size: 17px;
      font-weight: 700;
    }

    .detail-meta {
      padding: 8px 0 12px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
      border-bottom: 1px dashed var(--el-border-color-lighter);
    }

    :deep(.rich-content) {
      padding-top: 14px;
    }
  }
</style>
