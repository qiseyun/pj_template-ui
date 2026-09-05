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
    ElRadio,
    ElRadioGroup,
    ElSelect,
    ElTable,
    ElTableColumn,
    ElTag
  } from 'element-plus'
  import ContentWrap from '@/components/ContentWrap/index.vue'
  import type { DeptRow } from '@/api/system/types'
  import {
    deptListAllApi,
    deptRemoveApi,
    deptSaveApi,
    deptTreeApi,
    deptUpdateApi
  } from '@/api/system/dept'
  import { usePermissionStore } from '@/store/modules/permission'

  const permissionStore = usePermissionStore()
  const hasPerm = permissionStore.hasPerm

  const loading = ref(false)
  const tree = ref<DeptRow[]>([])
  const flat = ref<DeptRow[]>([])

  const fetchTree = async () => {
    loading.value = true
    try {
      const [treeRes, flatRes] = await Promise.all([deptTreeApi(), deptListAllApi()])
      tree.value = treeRes?.data ?? []
      flat.value = flatRes?.data ?? []
    } finally {
      loading.value = false
    }
  }

  /* 父级选择: 缩进展示层级 */
  const depthOf = (row: DeptRow): number =>
    row.ancestors ? row.ancestors.split(',').filter(Boolean).length : 0
  const parentOptions = (excludeId?: number) =>
    flat.value
      .filter((row) => row.id !== excludeId)
      .map((row) => ({ ...row, label: `${'　'.repeat(depthOf(row))}${row.deptName}` }))

  /* ---------- 新增/编辑 ---------- */
  const dialogVisible = ref(false)
  const dialogTitle = ref('')
  const saving = ref(false)
  const form = reactive<DeptRow>({
    id: undefined,
    parentId: 0,
    deptName: '',
    leader: '',
    phone: '',
    sortNo: 0,
    status: 0
  } as unknown as DeptRow)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openEdit = (row?: any) => {
    Object.assign(
      form,
      row
        ? {
            id: row.id,
            parentId: row.parentId ?? 0,
            deptName: row.deptName ?? '',
            leader: row.leader ?? '',
            phone: row.phone ?? '',
            sortNo: row.sortNo ?? 0,
            status: row.status ?? 0
          }
        : { id: undefined, parentId: 0, deptName: '', leader: '', phone: '', sortNo: 0, status: 0 }
    )
    dialogTitle.value = row ? '编辑部门' : '新增部门'
    dialogVisible.value = true
  }

  const openChild = (row: { id?: number }) => {
    openEdit()
    form.parentId = row.id ?? 0
  }

  const submit = async () => {
    if (!form.deptName) {
      ElMessage.warning('请填写部门名称')
      return
    }
    saving.value = true
    try {
      const payload = { ...form }
      delete (payload as Partial<DeptRow> & { children?: DeptRow[] }).children
      if (form.id) {
        await deptUpdateApi(payload)
      } else {
        await deptSaveApi(payload)
      }
      ElMessage.success('保存成功')
      dialogVisible.value = false
      fetchTree()
    } finally {
      saving.value = false
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onRemove = async (row: any) => {
    try {
      await ElMessageBox.confirm(`确定删除部门「${row.deptName}」吗?`, '提示', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      })
    } catch {
      return
    }
    try {
      await deptRemoveApi(row.id)
    } catch {
      return
    }
    ElMessage.success('删除成功')
    fetchTree()
  }

  onMounted(fetchTree)
</script>

<template>
  <ContentWrap
    title="部门管理"
    message="组织架构树; 用户挂在部门下, 角色数据范围(本部门/本部门及以下)依赖此结构"
  >
    <template #header>
      <el-button v-if="hasPerm('sys:dept:save')" type="primary" @click="openEdit()"
        >新增部门</el-button
      >
    </template>

    <el-table v-loading="loading" :data="tree" row-key="id" border default-expand-all>
      <el-table-column prop="deptName" label="部门名称" min-width="200" />
      <el-table-column label="状态" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'info' : 'success'">{{
            row.status === 1 ? '停用' : '正常'
          }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="leader" label="负责人" width="130" />
      <el-table-column prop="phone" label="联系电话" width="150" />
      <el-table-column prop="sortNo" label="排序" width="80" align="center" />
      <el-table-column label="操作" width="170" align="center" fixed="right">
        <template #default="{ row }">
          <el-button v-if="hasPerm('sys:dept:save')" link type="primary" @click="openChild(row)"
            >新增下级</el-button
          >
          <el-button v-if="hasPerm('sys:dept:save')" link type="primary" @click="openEdit(row)"
            >编辑</el-button
          >
          <el-button v-if="hasPerm('sys:dept:delete')" link type="danger" @click="onRemove(row)"
            >删除</el-button
          >
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="520px" destroy-on-close>
      <el-form :model="form" label-width="90px">
        <el-form-item label="上级部门">
          <el-select v-model="form.parentId" style="width: 100%" placeholder="无(顶级部门)">
            <el-option label="无(顶级部门)" :value="0" />
            <el-option
              v-for="opt in parentOptions(form.id)"
              :key="opt.id"
              :label="opt.label"
              :value="opt.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="部门名称" required>
          <el-input v-model="form.deptName" placeholder="如: 研发部" :disabled="saving" />
        </el-form-item>
        <el-form-item label="负责人">
          <el-input v-model="form.leader" placeholder="可选" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="form.phone" placeholder="可选" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortNo" :min="0" :max="9999" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="0">正常</el-radio>
            <el-radio :value="1">停用</el-radio>
          </el-radio-group>
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
  .dialog-select {
    width: 100%;
  }
</style>
