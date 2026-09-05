<script setup lang="ts">
  import { onMounted, reactive, ref } from 'vue'
  import {
    ElButton,
    ElDialog,
    ElForm,
    ElFormItem,
    ElInput,
    ElInputNumber,
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
  import type { BizOrderRow } from '@/api/system/types'
  import { orderPageApi, orderRemoveApi, orderSaveApi, orderUpdateApi } from '@/api/system/bizOrder'
  import { usePermissionStore } from '@/store/modules/permission'

  const permissionStore = usePermissionStore()
  const hasPerm = permissionStore.hasPerm

  const listLoading = ref(false)
  const list = ref<BizOrderRow[]>([])
  const total = ref(0)
  const query = reactive({
    current: 1,
    size: 10,
    orderNo: '',
    title: '',
    status: '' as number | ''
  })

  const fetchList = async () => {
    listLoading.value = true
    try {
      const res = await orderPageApi(query.current, query.size, {
        orderNo: query.orderNo,
        title: query.title,
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
    query.orderNo = ''
    query.title = ''
    query.status = ''
    onSearch()
  }

  const statusText = (status?: number) =>
    status === 2 ? '已完成' : status === 1 ? '处理中' : '待处理'
  const statusType = (status?: number) =>
    status === 2 ? 'success' : status === 1 ? 'warning' : 'info'

  /* ---------- 新增/编辑 ---------- */
  const dialogVisible = ref(false)
  const dialogTitle = ref('')
  const saving = ref(false)
  const form = reactive<BizOrderRow>({
    id: undefined,
    title: '',
    amount: 0,
    status: 0,
    remark: ''
  } as unknown as BizOrderRow)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openEdit = (row?: any) => {
    Object.assign(
      form,
      row
        ? {
            id: row.id,
            title: row.title ?? '',
            amount: Number(row.amount ?? 0),
            status: row.status ?? 0,
            remark: row.remark ?? ''
          }
        : { id: undefined, title: '', amount: 0, status: 0, remark: '' }
    )
    dialogTitle.value = row ? '编辑订单' : '新增订单'
    dialogVisible.value = true
  }

  const submit = async () => {
    if (!form.title) {
      ElMessage.warning('请填写订单标题')
      return
    }
    saving.value = true
    try {
      const payload = {
        id: form.id,
        title: form.title,
        amount: form.amount,
        status: form.status ?? 0,
        remark: form.remark ?? ''
      }
      if (form.id) {
        await orderUpdateApi(payload)
      } else {
        await orderSaveApi(payload)
      }
      ElMessage.success('保存成功')
      dialogVisible.value = false
      fetchList()
    } finally {
      saving.value = false
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onRemove = async (row: any) => {
    try {
      await ElMessageBox.confirm(`确定删除订单「${row.title}」吗?`, '提示', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      })
    } catch {
      return
    }
    try {
      await orderRemoveApi(row.id)
    } catch {
      return
    }
    ElMessage.success('删除成功')
    if (list.value.length === 1 && query.current > 1) query.current -= 1
    fetchList()
  }

  onMounted(fetchList)
</script>

<template>
  <ContentWrap
    title="订单管理(数据权限演示)"
    message="普通用户仅能查看其角色数据范围内的数据(全部/本部门及以下/本部门/仅本人), 越权操作会被拒绝"
  >
    <template #header>
      <el-button v-if="hasPerm('biz:order:save')" type="primary" @click="openEdit()"
        >新增订单</el-button
      >
    </template>

    <el-form inline class="search-bar" @submit.prevent>
      <el-form-item label="订单号">
        <el-input
          v-model="query.orderNo"
          placeholder="模糊"
          clearable
          style="width: 170px"
          @keyup.enter="onSearch"
        />
      </el-form-item>
      <el-form-item label="标题">
        <el-input
          v-model="query.title"
          placeholder="模糊"
          clearable
          style="width: 170px"
          @keyup.enter="onSearch"
        />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" placeholder="全部" clearable style="width: 120px">
          <el-option label="待处理" :value="0" />
          <el-option label="处理中" :value="1" />
          <el-option label="已完成" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSearch">查询</el-button>
        <el-button @click="onReset">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="listLoading" :data="list" border stripe>
      <el-table-column prop="orderNo" label="订单号" min-width="170" />
      <el-table-column prop="title" label="标题" min-width="160" show-overflow-tooltip />
      <el-table-column prop="amount" label="金额" width="120" align="right" />
      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createByName" label="创建人" width="120" align="center" />
      <el-table-column prop="gmtCreated" label="创建时间" width="170" />
      <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
      <el-table-column label="操作" width="130" align="center" fixed="right">
        <template #default="{ row }">
          <el-button v-if="hasPerm('biz:order:save')" link type="primary" @click="openEdit(row)"
            >编辑</el-button
          >
          <el-button v-if="hasPerm('biz:order:delete')" link type="danger" @click="onRemove(row)"
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

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="520px" destroy-on-close>
      <el-form :model="form" label-width="90px">
        <el-form-item label="标题" required>
          <el-input v-model="form.title" placeholder="如: 市场部采购申请" :disabled="saving" />
        </el-form-item>
        <el-form-item label="金额">
          <el-input-number
            v-model="form.amount"
            :min="0"
            :precision="2"
            :step="100"
            style="width: 220px"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" style="width: 180px">
            <el-option label="待处理" :value="0" />
            <el-option label="处理中" :value="1" />
            <el-option label="已完成" :value="2" />
          </el-select>
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
</style>
