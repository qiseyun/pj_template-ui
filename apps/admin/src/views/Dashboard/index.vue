<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import {
    ElButton,
    ElDialog,
    ElEmpty,
    ElMessage,
    ElOption,
    ElSelect
  } from 'element-plus'
  import { useUserStore } from '@/store/modules/user'
  import { useNoticeStore } from '@/store/modules/notice'
  import { markNoticeReadApi, myNoticeDetailApi } from '@/api/notice'
  import type { NoticeRow } from '@/api/notice/types'
  import {
    quickCandidatesApi,
    quickListApi,
    quickSaveApi,
    todoSummaryApi
  } from '@/api/workbench'
  import type { QuickEntryRow, WorkbenchTodoGroup, WorkbenchTodoItem } from '@/api/system/types'
  import { icons } from '@/icons'

  const router = useRouter()
  const userStore = useUserStore()
  const noticeStore = useNoticeStore()

  const iconSet = icons as Record<string, unknown>
  const hasIcon = (name?: string | null) => Boolean(name && iconSet[name])
  /** Icon 组件 icon 属性不接受 null, 统一转 undefined */
  const iconOf = (name?: string | null) => name || undefined

  const greeting = computed(() => {
    const hour = new Date().getHours()
    if (hour < 6) return '夜深了'
    if (hour < 12) return '上午好'
    if (hour < 14) return '中午好'
    if (hour < 18) return '下午好'
    return '晚上好'
  })

  /* ---------- 实时时钟 ---------- */
  const clockText = ref('')
  let clockTimer = 0
  const pad = (n: number) => String(n).padStart(2, '0')
  const tickClock = () => {
    const d = new Date()
    const week = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
    clockText.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} 星期${week} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  }

  /* ---------- 待办聚合 ---------- */
  const todoLoading = ref(false)
  const todoGroups = ref<WorkbenchTodoGroup[]>([])
  const fetchTodo = async () => {
    todoLoading.value = true
    try {
      const res = await todoSummaryApi()
      todoGroups.value = (res?.data ?? []).filter((g) => (g.total ?? 0) > 0)
    } finally {
      todoLoading.value = false
    }
  }

  /* ---------- 通知阅读弹窗 ---------- */
  const readVisible = ref(false)
  const reading = ref<NoticeRow | null>(null)
  const readLoading = ref(false)
  const openNotice = async (itemId: string) => {
    readLoading.value = true
    try {
      const res = await myNoticeDetailApi(Number(itemId))
      reading.value = res?.data ?? null
      readVisible.value = true
      // 打开即视为已读
      await markNoticeReadApi([Number(itemId)])
      await Promise.all([fetchTodo(), noticeStore.refreshUnread()])
    } catch {
      // 请求层已提示
    } finally {
      readLoading.value = false
    }
  }

  /* ---------- 快捷入口 ---------- */
  const quickLoading = ref(false)
  const quickEntries = ref<QuickEntryRow[]>([])
  const fetchQuick = async () => {
    quickLoading.value = true
    try {
      const res = await quickListApi()
      quickEntries.value = res?.data ?? []
    } finally {
      quickLoading.value = false
    }
  }

  const openEntry = (entry: QuickEntryRow) => {
    if (entry.path) void router.push(entry.path)
  }

  /** 待办条目点击: 通知就地阅读并自动已读; 其余按 targetPath 跳转 */
  const openTodoItem = (group: WorkbenchTodoGroup, item: WorkbenchTodoItem) => {
    if (group.type === 'notice') {
      void openNotice(item.id)
    } else if (item.targetPath) {
      void router.push(item.targetPath)
    }
  }

  /* 快捷入口管理弹窗 */
  const manageVisible = ref(false)
  const manageSaving = ref(false)
  const draft = ref<QuickEntryRow[]>([])
  const candidates = ref<QuickEntryRow[]>([])
  const candidateSearch = ref('')
  const pickModel = ref<number | ''>('')

  const availableCandidates = computed(() => {
    const chosen = new Set(draft.value.map((d) => d.menuId))
    const kw = candidateSearch.value.trim().toLowerCase()
    return candidates.value.filter(
      (c) => !chosen.has(c.menuId) && (!kw || (c.title ?? '').toLowerCase().includes(kw))
    )
  })

  const onPickCandidate = (val: number | '') => {
    if (!val) return
    const entry = candidates.value.find((c) => c.menuId === val)
    if (entry) addCandidate(entry)
    pickModel.value = ''
  }

  const openManager = async () => {
    if (!manageVisible.value) {
      quickLoading.value = true
      try {
        const [entries, cands] = await Promise.all([quickListApi(), quickCandidatesApi()])
        draft.value = [...(entries?.data ?? [])]
        candidates.value = cands?.data ?? []
      } finally {
        quickLoading.value = false
      }
    }
    candidateSearch.value = ''
    manageVisible.value = true
  }

  const addCandidate = (entry: QuickEntryRow) => {
    if (draft.value.some((d) => d.menuId === entry.menuId)) return
    draft.value.push({ ...entry })
    candidateSearch.value = ''
  }

  const removeDraft = (menuId: number) => {
    draft.value = draft.value.filter((d) => d.menuId !== menuId)
  }

  const moveDraft = (index: number, delta: number) => {
    const target = index + delta
    if (target < 0 || target >= draft.value.length) return
    const arr = [...draft.value]
    ;[arr[index], arr[target]] = [arr[target], arr[index]]
    draft.value = arr
  }

  const saveQuick = async () => {
    manageSaving.value = true
    try {
      const res = await quickSaveApi(draft.value.map((d) => d.menuId))
      quickEntries.value = res?.data ?? []
      manageVisible.value = false
      ElMessage.success('快捷入口已保存')
    } finally {
      manageSaving.value = false
    }
  }

  onMounted(() => {
    tickClock()
    clockTimer = window.setInterval(tickClock, 1000)
    void fetchTodo()
    void fetchQuick()
  })

  onBeforeUnmount(() => {
    if (clockTimer) window.clearInterval(clockTimer)
  })
</script>

<template>
  <div class="dashboard-page">
    <section class="welcome-card">
      <div class="welcome-copy">
        <p class="welcome-kicker">WORKSPACE / 工作台</p>
        <h2>{{ greeting }}，{{ userStore.userInfo?.nickname || userStore.userInfo?.username || '访客' }}</h2>
        <p class="welcome-text">
          这里聚合你常用的功能入口与待处理事项。快捷入口按个人维护，待办由各业务模块按 SPI
          自动上报（当前含未读通知、任务执行失败告警）。
        </p>
      </div>
      <div class="welcome-badge">
        <span class="badge-dot"></span>
        {{ clockText }}
      </div>
    </section>

    <!-- 快捷入口 -->
    <section class="panel quick-panel">
      <div class="panel-head">
        <h3>快捷入口</h3>
        <el-button link type="primary" @click="openManager()">
          {{ quickEntries.length ? '管理入口' : '添加入口' }}
        </el-button>
      </div>
      <div v-loading="quickLoading" class="quick-grid">
        <template v-if="quickEntries.length">
          <div
            v-for="entry in quickEntries"
            :key="entry.menuId"
            class="quick-tile"
            @click="openEntry(entry)"
          >
            <div class="quick-icon">
              <Icon v-if="hasIcon(entry.icon)" :icon="iconOf(entry.icon)" :size="24" />
              <span v-else class="quick-fallback">{{ (entry.title || '?').charAt(0) }}</span>
            </div>
            <span class="quick-name" :title="entry.title">{{ entry.title }}</span>
          </div>
        </template>
        <div v-else-if="!quickLoading" class="quick-empty">
          <el-empty description="还没有快捷入口" :image-size="72" />
        </div>
      </div>
    </section>

    <!-- 待办聚合 -->
    <section class="todo-section">
      <div class="panel-head">
        <h3>待办聚合</h3>
        <el-button link @click="fetchTodo()">刷新</el-button>
      </div>
      <div v-loading="todoLoading" class="todo-grid">
        <div v-for="group in todoGroups" :key="group.type" class="todo-card">
          <div class="todo-card-head">
            <span class="todo-card-title">
              <Icon v-if="hasIcon(group.icon)" :icon="iconOf(group.icon)" :size="16" />
              {{ group.title }}
            </span>
            <span class="todo-count">{{ group.total }}</span>
          </div>
          <ul class="todo-list">
            <li
              v-for="item in group.items"
              :key="`${group.type}-${item.id}`"
              class="todo-item"
              @click="openTodoItem(group, item)"
            >
              <div class="todo-item-main">
                <span class="todo-item-title">{{ item.title }}</span>
                <span v-if="item.summary" class="todo-item-summary">{{ item.summary }}</span>
              </div>
              <span class="todo-item-time">{{ item.time || '' }}</span>
            </li>
          </ul>
          <div class="todo-card-foot">
            {{
              group.type === 'notice'
                ? '点击查看并自动标记已读'
                : group.type === 'jobAlarm'
                  ? '点击前往任务日志排查'
                  : '点击跳转到对应页面处理'
            }}
          </div>
        </div>
        <div v-if="!todoLoading && !todoGroups.length" class="todo-empty-card">
          <el-empty description="太棒了，暂时没有待办事项" :image-size="88" />
        </div>
      </div>
    </section>

    <!-- 通知阅读弹窗 -->
    <el-dialog
      v-model="readVisible"
      title="通知详情"
      width="620px"
      top="8vh"
      append-to-body
      destroy-on-close
    >
      <div v-loading="readLoading" class="read-box">
        <template v-if="reading">
          <h3 class="read-title">{{ reading.title }}</h3>
          <p class="read-meta">
            {{ reading.noticeType === 2 ? '公告' : '通知' }} · 发送人:{{ reading.senderName || '-' }}
            · {{ reading.gmtCreated || '' }}
          </p>
          <div v-if="reading.content" class="rich-content" v-html="reading.content"></div>
        </template>
      </div>
    </el-dialog>

    <!-- 快捷入口管理弹窗 -->
    <el-dialog v-model="manageVisible" title="管理快捷入口" width="640px" append-to-body destroy-on-close>
      <div class="quick-manager">
        <p class="manage-tip">勾选你常用的页面作为快捷入口，可拖动调整顺序（当前按上移/下移调整）。</p>
        <el-select
          v-model="pickModel"
          placeholder="从可选菜单中添加…"
          filterable
          style="width: 100%"
          @change="onPickCandidate"
        >
          <el-option
            v-for="c in availableCandidates"
            :key="c.menuId"
            :label="c.title"
            :value="c.menuId"
          />
        </el-select>

        <div v-if="!draft.length" class="draft-empty">
          <el-empty description="尚未添加入口" :image-size="64" />
        </div>
        <ul v-else class="draft-list">
          <li v-for="(entry, index) in draft" :key="entry.menuId" class="draft-row">
            <span class="draft-idx">{{ index + 1 }}</span>
            <span class="draft-icon">
              <Icon v-if="hasIcon(entry.icon)" :icon="iconOf(entry.icon)" :size="16" />
              <span v-else class="quick-fallback small">{{ (entry.title || '?').charAt(0) }}</span>
            </span>
            <span class="draft-name">{{ entry.title }}</span>
            <span class="draft-actions">
              <el-button link :disabled="index === 0" @click="moveDraft(index, -1)">上移</el-button>
              <el-button link :disabled="index === draft.length - 1" @click="moveDraft(index, 1)"
                >下移</el-button
              >
              <el-button link type="danger" @click="removeDraft(entry.menuId)">移除</el-button>
            </span>
          </li>
        </ul>
      </div>
      <template #footer>
        <el-button @click="manageVisible = false">取消</el-button>
        <el-button type="primary" :loading="manageSaving" @click="saveQuick">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="less" scoped>
  .dashboard-page {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .welcome-card {
    position: relative;
    display: flex;
    overflow: hidden;
    padding: 30px 34px;
    color: #fff;
    background:
      radial-gradient(circle at 88% 20%, rgb(64 164 255 / 22%), transparent 34%),
      radial-gradient(circle at 12% 110%, rgb(223 42 167 / 16%), transparent 40%),
      linear-gradient(135deg, #12203e 0%, #1b2f55 58%, #203a66 100%);
    border-radius: 18px;
    box-shadow: 0 18px 44px rgb(18 32 62 / 18%);
    justify-content: space-between;
    align-items: center;

    &::after {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgb(255 255 255 / 5%) 1px, transparent 1px),
        linear-gradient(90deg, rgb(255 255 255 / 5%) 1px, transparent 1px);
      background-size: 26px 26px;
      content: '';
      mask-image: linear-gradient(90deg, #000, transparent 78%);
      pointer-events: none;
    }
  }

  .welcome-copy {
    position: relative;
    z-index: 1;

    .welcome-kicker {
      margin: 0 0 10px;
      font-family: SFMono-Regular, Consolas, monospace;
      font-size: 11px;
      letter-spacing: 0.22em;
      color: rgb(214 231 255 / 62%);
    }

    h2 {
      margin: 0 0 12px;
      font-size: 24px;
      font-weight: 720;
      letter-spacing: 0.01em;
    }

    .welcome-text {
      max-width: 640px;
      margin: 0;
      font-size: 13px;
      line-height: 1.8;
      color: rgb(222 234 255 / 74%);
    }
  }

  .welcome-badge {
    position: relative;
    z-index: 1;
    display: flex;
    gap: 8px;
    align-items: center;
    flex: none;
    padding: 9px 16px;
    font-family: SFMono-Regular, Consolas, monospace;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.08em;
    background: rgb(255 255 255 / 9%);
    border: 1px solid rgb(255 255 255 / 14%);
    border-radius: 999px;
    backdrop-filter: blur(8px);

    .badge-dot {
      width: 7px;
      height: 7px;
      background: #3ad29a;
      border-radius: 50%;
      box-shadow: 0 0 0 4px rgb(58 210 154 / 18%);
    }
  }

  .panel,
  .todo-section {
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 16px;
    box-shadow: var(--el-box-shadow-lighter);
  }

  .panel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px 4px;

    h3 {
      margin: 0;
      font-size: 15px;
      font-weight: 680;
    }
  }

  .quick-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
    gap: 10px;
    min-height: 118px;
    padding: 12px 20px 18px;
  }

  .quick-tile {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
    padding: 14px 6px 10px;
    background: var(--el-fill-color-lighter);
    border: 1px solid transparent;
    border-radius: 12px;
    cursor: pointer;
    transition:
      transform 160ms ease,
      border-color 160ms ease,
      box-shadow 160ms ease;

    &:hover {
      border-color: var(--el-color-primary-light-5);
      box-shadow: var(--el-box-shadow-light);
      transform: translateY(-2px);
    }
  }

  .quick-icon {
    display: grid;
    width: 44px;
    height: 44px;
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    border-radius: 12px;
    place-items: center;
  }

  .quick-fallback {
    font-size: 18px;
    font-weight: 700;

    &.small {
      font-size: 13px;
    }
  }

  .quick-name {
    overflow: hidden;
    max-width: 100%;
    font-size: 12.5px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .quick-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    grid-column: 1 / -1;
  }

  .todo-section {
    padding-bottom: 18px;
  }

  .todo-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 14px;
    padding: 12px 20px 4px;
  }

  .todo-card {
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 14px;

    .todo-card-head {
      display: flex;
      gap: 8px;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: var(--el-fill-color-lighter);
      border-radius: 14px 14px 0 0;
    }

    .todo-card-title {
      display: flex;
      gap: 8px;
      align-items: center;
      font-size: 13.5px;
      font-weight: 660;
    }

    .todo-count {
      min-width: 22px;
      padding: 1px 8px;
      font-family: SFMono-Regular, Consolas, monospace;
      font-size: 12px;
      text-align: center;
      color: #fff;
      background: var(--el-color-danger);
      border-radius: 999px;
    }
  }

  .todo-list {
    padding: 4px 16px;
    margin: 0;
    list-style: none;
  }

  .todo-item {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    justify-content: space-between;
    padding: 9px 2px;
    border-bottom: 1px dashed var(--el-border-color-lighter);
    cursor: pointer;

    &:last-child {
      border-bottom: none;
    }

    &:hover .todo-item-title {
      color: var(--el-color-primary);
    }
  }

  .todo-item-main {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }

  .todo-item-title {
    overflow: hidden;
    font-size: 13px;
    font-weight: 560;
    text-overflow: ellipsis;
    white-space: nowrap;
    transition: color 160ms ease;
  }

  .todo-item-summary {
    overflow: hidden;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .todo-item-time {
    flex: none;
    font-family: SFMono-Regular, Consolas, monospace;
    font-size: 11.5px;
    color: var(--el-text-color-placeholder);
  }

  .todo-card-foot {
    padding: 8px 16px 12px;
    font-size: 12px;
    color: var(--el-text-color-placeholder);
  }

  .todo-empty-card {
    display: flex;
    align-items: center;
    justify-content: center;
    grid-column: 1 / -1;
    min-height: 180px;
    border: 1px dashed var(--el-border-color-lighter);
    border-radius: 14px;
  }

  .read-box {
    min-height: 120px;
  }

  .read-title {
    margin: 0 0 8px;
    font-size: 16px;
  }

  .read-meta {
    margin: 0 0 12px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .rich-content {
    font-size: 13.5px;
    line-height: 1.8;
    color: var(--el-text-color-primary);
    overflow-wrap: break-word;
  }

  .quick-manager {
    .manage-tip {
      margin: 0 0 12px;
      font-size: 12.5px;
      color: var(--el-text-color-secondary);
    }
  }

  .draft-empty {
    padding: 8px 0;
  }

  .draft-list {
    max-height: 320px;
    padding: 0;
    margin: 12px 0 0;
    overflow: auto;
    list-style: none;
  }

  .draft-row {
    display: flex;
    gap: 10px;
    align-items: center;
    padding: 7px 4px;
    border-bottom: 1px solid var(--el-border-color-extra-light);

    &:last-child {
      border-bottom: none;
    }
  }

  .draft-idx {
    font-family: SFMono-Regular, Consolas, monospace;
    font-size: 12px;
    color: var(--el-text-color-placeholder);
  }

  .draft-icon {
    display: grid;
    width: 26px;
    height: 26px;
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    border-radius: 8px;
    place-items: center;
  }

  .draft-name {
    flex: 1;
    overflow: hidden;
    font-size: 13px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .draft-actions {
    flex: none;
  }

  @media (width <= 900px) {
    .welcome-badge {
      display: none;
    }
  }
</style>
