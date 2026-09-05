<script setup lang="ts">
  import { computed, onMounted, reactive, ref } from 'vue'
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
    ElTag
  } from 'element-plus'
  import ContentWrap from '@/components/ContentWrap/index.vue'
  import type { ConfigRow } from '@/api/system/types'
  import {
    configPageApi,
    configRemoveApi,
    configSaveApi,
    configUpdateApi
  } from '@/api/system/config'
  import { usePermissionStore } from '@/store/modules/permission'

  const permissionStore = usePermissionStore()
  const hasPerm = permissionStore.hasPerm

  const listLoading = ref(false)
  const list = ref<ConfigRow[]>([])
  const total = ref(0)
  const query = reactive({
    current: 1,
    size: 10,
    keyword: '',
    configGroup: ''
  })

  const groups = computed(() => {
    const set = new Set<string>()
    list.value.forEach((row) => {
      if (row.configGroup) set.add(row.configGroup)
    })
    return Array.from(set)
  })

  const fetchList = async () => {
    listLoading.value = true
    try {
      const res = await configPageApi(query.current, query.size, {
        configName: query.keyword,
        configGroup: query.configGroup || undefined
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
    query.configGroup = ''
    onSearch()
  }

  /* ---------- 新增/编辑 ---------- */
  const dialogVisible = ref(false)
  const dialogTitle = ref('')
  const saving = ref(false)
  const form = reactive<ConfigRow>({
    id: undefined,
    configName: '',
    configKey: '',
    configValue: '',
    configGroup: 'system',
    remark: '',
    status: 0
  } as unknown as ConfigRow)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openEdit = (row?: any) => {
    Object.assign(
      form,
      row
        ? {
            id: row.id,
            configName: row.configName ?? '',
            configKey: row.configKey ?? '',
            configValue: row.configValue ?? '',
            configGroup: row.configGroup ?? 'system',
            remark: row.remark ?? '',
            status: row.status ?? 0
          }
        : {
            id: undefined,
            configName: '',
            configKey: '',
            configValue: '',
            configGroup: 'system',
            remark: '',
            status: 0
          }
    )
    dialogTitle.value = row ? '编辑参数' : '新增参数'
    dialogVisible.value = true
  }

  const submit = async () => {
    if (!form.configName || !form.configKey) {
      ElMessage.warning('请填写参数名称与参数键')
      return
    }
    saving.value = true
    try {
      const payload = {
        id: form.id,
        configName: form.configName,
        configKey: form.configKey,
        configValue: form.configValue ?? '',
        configGroup: form.configGroup || 'system',
        remark: form.remark ?? '',
        status: form.status ?? 0
      }
      if (form.id) {
        await configUpdateApi(payload)
      } else {
        await configSaveApi(payload)
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
      await ElMessageBox.confirm(`确定删除参数「${row.configKey}」吗?`, '提示', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      })
    } catch {
      return
    }
    try {
      await configRemoveApi(row.id)
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
  <ContentWrap title="参数配置" message="系统级键值参数, 供业务热读取(改参数不重启); 分组便于归类">
    <template #header>
      <el-button v-if="hasPerm('sys:config:save')" type="primary" @click="openEdit()"
        >新增参数</el-button
      >
    </template>

    <el-form inline class="search-bar" @submit.prevent>
      <el-form-item label="参数名称">
        <el-input
          v-model="query.keyword"
          placeholder="按参数名称模糊"
          clearable
          style="width: 190px"
          @keyup.enter="onSearch"
        />
      </el-form-item>
      <el-form-item label="分组">
        <el-select v-model="query.configGroup" placeholder="全部" clearable style="width: 150px">
          <el-option v-for="g in groups" :key="g" :label="g" :value="g" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSearch">查询</el-button>
        <el-button @click="onReset">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="listLoading" :data="list" border stripe>
      <el-table-column prop="id" label="ID" width="70" align="center" />
      <el-table-column prop="configName" label="参数名称" min-width="130" />
      <el-table-column prop="configKey" label="参数键" min-width="150" />
      <el-table-column prop="configValue" label="参数值" min-width="200" show-overflow-tooltip />
      <el-table-column prop="configGroup" label="分组" width="110" align="center">
        <template #default="{ row }">
          <el-tag size="small">{{ row.configGroup }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" min-width="140" show-overflow-tooltip />
      <el-table-column label="状态" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'info' : 'success'">{{
            row.status === 1 ? '停用' : '正常'
          }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="gmtModified" label="更新时间" width="170" />
      <el-table-column label="操作" width="130" align="center" fixed="right">
        <template #default="{ row }">
          <el-button v-if="hasPerm('sys:config:save')" link type="primary" @click="openEdit(row)"
            >编辑</el-button
          >
          <el-button v-if="hasPerm('sys:config:delete')" link type="danger" @click="onRemove(row)"
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
        <el-form-item label="参数名称" required>
          <el-input v-model="form.configName" placeholder="如: 平台名称" :disabled="saving" />
        </el-form-item>
        <el-form-item label="参数键" required>
          <el-input
            v-model="form.configKey"
            placeholder="如: site_name(字母数字下划线)"
            :disabled="saving"
          />
        </el-form-item>
        <el-form-item label="参数值">
          <el-input v-model="form.configValue" type="textarea" :rows="3" placeholder="参数内容" />
        </el-form-item>
        <el-form-item label="分组">
          <el-input
            v-model="form.configGroup"
            placeholder="如: system / upload"
            style="width: 220px"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="0">正常</el-radio>
            <el-radio :value="1">停用</el-radio>
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
</style>
