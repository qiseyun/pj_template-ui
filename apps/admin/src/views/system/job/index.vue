<script setup lang="ts">
  import { computed, onMounted, reactive, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import {
    ElButton,
    ElDialog,
    ElForm,
    ElFormItem,
    ElInput,
    ElMessage,
    ElMessageBox,
    ElOption,
    ElPagination,
    ElRadio,
    ElRadioGroup,
    ElSelect,
    ElTable,
    ElTableColumn,
    ElTag,
    ElTooltip
  } from 'element-plus'
  import ContentWrap from '@/components/ContentWrap/index.vue'
  import type { SysJobRow } from '@/api/system/types'
  import {
    jobPageApi,
    jobRemoveApi,
    jobRemoveBatchApi,
    jobRunApi,
    jobSaveApi,
    jobStatusApi,
    jobUpdateApi
  } from '@/api/system/job'
  import { usePermissionStore } from '@/store/modules/permission'

  const router = useRouter()
  const permissionStore = usePermissionStore()
  const hasPerm = permissionStore.hasPerm

  const listLoading = ref(false)
  const list = ref<SysJobRow[]>([])
  const total = ref(0)
  const selected = ref<SysJobRow[]>([])
  const query = reactive({
    current: 1,
    size: 10,
    keyword: '',
    jobGroup: '',
    status: '' as number | ''
  })

  const groups = computed(() => {
    const set = new Set<string>()
    list.value.forEach((row) => {
      if (row.jobGroup) set.add(row.jobGroup)
    })
    return Array.from(set)
  })

  const fetchList = async () => {
    listLoading.value = true
    try {
      const res = await jobPageApi(query.current, query.size, {
        keyword: query.keyword,
        jobGroup: query.jobGroup || undefined,
        status: query.status
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
    query.jobGroup = ''
    query.status = ''
    onSearch()
  }

  const onSelectionChange = (rows: SysJobRow[]) => {
    selected.value = rows ?? []
  }

  /* ---------- 新增/编辑 ---------- */
  const dialogVisible = ref(false)
  const dialogTitle = ref('')
  const saving = ref(false)
  const form = reactive<SysJobRow>({
    id: undefined,
    jobName: '',
    jobGroup: 'default',
    invokeTarget: '',
    cronExpr: '',
    params: '',
    concurrent: 1,
    status: 0,
    remark: ''
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- 表格行
  const openEdit = (row?: any) => {
    Object.assign(
      form,
      row
        ? {
            id: row.id,
            jobName: row.jobName ?? '',
            jobGroup: row.jobGroup ?? 'default',
            invokeTarget: row.invokeTarget ?? '',
            cronExpr: row.cronExpr ?? '',
            params: row.params ?? '',
            concurrent: row.concurrent ?? 1,
            status: row.status ?? 0,
            remark: row.remark ?? ''
          }
        : {
            id: undefined,
            jobName: '',
            jobGroup: 'default',
            invokeTarget: '',
            cronExpr: '',
            params: '',
            concurrent: 1,
            status: 0,
            remark: ''
          }
    )
    dialogTitle.value = row ? '编辑任务' : '新增任务'
    dialogVisible.value = true
  }

  const submit = async () => {
    if (!form.jobName) {
      ElMessage.warning('请填写任务名称')
      return
    }
    if (!form.invokeTarget) {
      ElMessage.warning('请填写调用目标(Bean名.方法名)')
      return
    }
    if (!form.cronExpr) {
      ElMessage.warning('请填写 cron 表达式')
      return
    }
    saving.value = true
    try {
      const payload = {
        id: form.id,
        jobName: form.jobName,
        jobGroup: form.jobGroup || 'default',
        invokeTarget: form.invokeTarget,
        cronExpr: form.cronExpr,
        params: form.params ?? '',
        concurrent: form.concurrent ?? 1,
        status: form.status ?? 0,
        remark: form.remark ?? ''
      }
      if (form.id) {
        await jobUpdateApi(payload)
      } else {
        await jobSaveApi(payload)
      }
      ElMessage.success('保存成功')
      dialogVisible.value = false
      fetchList()
    } finally {
      saving.value = false
    }
  }

  /* ---------- 启停 / 立即执行 / 删除 ---------- */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- 表格行
  const onToggle = async (row: any) => {
    const next = row.status === 0 ? 1 : 0
    const action = next === 0 ? '启动' : '暂停'
    try {
      await ElMessageBox.confirm(`确定${action}任务「${row.jobName}」吗?`, '提示', {
        confirmButtonText: action,
        cancelButtonText: '取消',
        type: 'warning'
      })
    } catch {
      return
    }
    try {
      await jobStatusApi(row.id, next)
    } catch {
      return
    }
    ElMessage.success(`${action}成功`)
    fetchList()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- 表格行
  const onRun = async (row: any) => {
    try {
      await ElMessageBox.confirm(`确定立即执行一次任务「${row.jobName}」吗?`, '提示', {
        confirmButtonText: '执行',
        cancelButtonText: '取消',
        type: 'warning'
      })
    } catch {
      return
    }
    try {
      const res = await jobRunApi(row.id)
      ElMessage.success(res?.data || '已触发执行')
    } catch {
      return
    }
    fetchList()
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- 表格行
  const openJobLog = (row: any) => {
    void router.push({ path: '/monitor/jobLog', query: { jobId: String(row.id) } })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- 表格行
  const onRemove = async (row: any) => {
    try {
      await ElMessageBox.confirm(`确定删除任务「${row.jobName}」吗?`, '提示', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      })
    } catch {
      return
    }
    try {
      await jobRemoveApi(row.id)
    } catch {
      return
    }
    ElMessage.success('删除成功')
    if (list.value.length === 1 && query.current > 1) query.current -= 1
    fetchList()
  }

  const onRemoveBatch = async () => {
    if (!selected.value.length) {
      ElMessage.warning('请先勾选要删除的任务')
      return
    }
    try {
      await ElMessageBox.confirm(`确定删除选中的 ${selected.value.length} 个任务吗?`, '提示', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      })
    } catch {
      return
    }
    try {
      await jobRemoveBatchApi(selected.value.map((row) => row.id as number))
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
    title="定时任务"
    message="数据库驱动调度: 多机部署同一任务仅一台执行(Redis 分布式锁); 新增/修改/启停即时生效, 支持手动执行一次"
  >
    <template #header>
      <el-button
        v-if="hasPerm('sys:job:delete')"
        :disabled="!selected.length"
        @click="onRemoveBatch"
      >
        批量删除
      </el-button>
      <el-button v-if="hasPerm('sys:job:save')" type="primary" @click="openEdit()"
        >新增任务</el-button
      >
    </template>

    <el-form inline class="search-bar" @submit.prevent>
      <el-form-item label="任务名/调用目标">
        <el-input
          v-model="query.keyword"
          placeholder="模糊搜索"
          clearable
          style="width: 190px"
          @keyup.enter="onSearch"
        />
      </el-form-item>
      <el-form-item label="分组">
        <el-select v-model="query.jobGroup" placeholder="全部" clearable style="width: 140px">
          <el-option v-for="g in groups" :key="g" :label="g" :value="g" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" placeholder="全部" clearable style="width: 110px">
          <el-option label="正常" :value="0" />
          <el-option label="暂停" :value="1" />
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
      <el-table-column prop="jobName" label="任务名称" min-width="150" />
      <el-table-column prop="jobGroup" label="分组" width="90" align="center">
        <template #default="{ row }">
          <el-tag size="small">{{ row.jobGroup }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="invokeTarget" label="调用目标" min-width="190">
        <template #default="{ row }">
          <el-tooltip :content="`${row.invokeTarget}(${row.params || '无参数'})`" placement="top">
            <span class="mono-text">{{ row.invokeTarget }}</span>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column prop="cronExpr" label="cron 表达式" width="150">
        <template #default="{ row }">
          <span class="mono-text">{{ row.cronExpr }}</span>
        </template>
      </el-table-column>
      <el-table-column label="并发" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.concurrent === 1 ? 'warning' : 'success'" size="small">
            {{ row.concurrent === 1 ? '禁止并发' : '允许并发' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'info' : 'success'">{{
            row.status === 1 ? '暂停' : '正常'
          }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" min-width="150" show-overflow-tooltip />
      <el-table-column prop="gmtCreated" label="创建时间" width="165" />
      <el-table-column label="操作" width="220" align="center" fixed="right">
        <template #default="{ row }">
          <el-button
            v-if="hasPerm('sys:job:run')"
            link
            type="primary"
            @click="onRun(row)"
            >执行</el-button
          >
          <el-button
            v-if="hasPerm('sys:job:save')"
            link
            type="primary"
            @click="openEdit(row)"
            >编辑</el-button
          >
          <el-button v-if="hasPerm('sys:jobLog:list')" link @click="openJobLog(row)"
            >日志</el-button
          >
          <el-button
            v-if="hasPerm('sys:job:save')"
            link
            :type="row.status === 1 ? 'success' : 'warning'"
            @click="onToggle(row)"
            >{{ row.status === 1 ? '启动' : '暂停' }}</el-button
          >
          <el-button v-if="hasPerm('sys:job:delete')" link type="danger" @click="onRemove(row)"
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
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        background
        @size-change="fetchList"
        @current-change="fetchList"
      />
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="620px" destroy-on-close>
      <el-form :model="form" label-width="100px">
        <el-form-item label="任务名称" required>
          <el-input v-model="form.jobName" placeholder="如: 同步用户缓存" :disabled="saving" />
        </el-form-item>
        <el-form-item label="任务分组">
          <el-input
            v-model="form.jobGroup"
            placeholder="如: default / system"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item label="调用目标" required>
          <el-input
            v-model="form.invokeTarget"
            placeholder="Spring Bean名.方法名, 如 systemMaintenanceJobs.cleanExpiredLogs"
            :disabled="saving"
          />
        </el-form-item>
        <el-form-item label="cron 表达式" required>
          <el-input
            v-model="form.cronExpr"
            placeholder="秒 分 时 日 月 周, 如 0 0/5 * * * ?"
            :disabled="saving"
          />
          <div class="form-tip">
            支持标准 cron(秒级可用); 示例: 0 0 2 * * ? = 每天02:00; 0 */5 * * * ? = 每5分钟
          </div>
        </el-form-item>
        <el-form-item label="执行参数">
          <el-input
            v-model="form.params"
            type="textarea"
            :rows="2"
            placeholder="原样透传给任务方法(无参方法可留空)"
          />
        </el-form-item>
        <el-form-item label="并发策略">
          <el-radio-group v-model="form.concurrent">
            <el-radio :value="0">允许并发</el-radio>
            <el-radio :value="1">禁止并发(推荐)</el-radio>
          </el-radio-group>
          <div class="form-tip">禁止并发时, 全集群同一时刻只允许一次执行, 其余调度自动跳过</div>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="0">正常(参与调度)</el-radio>
            <el-radio :value="1">暂停</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submit">确定</el-button>
      </template>
    </el-dialog>
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

  .mono-text {
    font-family: SFMono-Regular, Consolas, monospace;
    font-size: 12.5px;
  }

  .form-tip {
    width: 100%;
    margin-top: 4px;
    font-size: 12px;
    line-height: 1.6;
    color: var(--el-text-color-secondary);
  }
</style>
