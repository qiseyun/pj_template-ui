<script setup lang="ts">
  import { nextTick, onMounted, reactive, ref } from 'vue'
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
    ElRadio,
    ElRadioGroup,
    ElScrollbar,
    ElSelect,
    ElTable,
    ElTableColumn,
    ElTag,
    ElTree
  } from 'element-plus'
  import ContentWrap from '@/components/ContentWrap/index.vue'
  import { menuTreeApi } from '@/api/system/menu'
  import {
    roleGrantMenusApi,
    roleMenuIdsApi,
    rolePageApi,
    roleRemoveApi,
    roleSaveApi,
    roleUpdateApi
  } from '@/api/system/role'
  import type { SysMenuRow, SysRoleRow } from '@/api/system/types'
  import { usePermissionStore } from '@/store/modules/permission'

  const permissionStore = usePermissionStore()
  const hasPerm = permissionStore.hasPerm

  const scopeText = (scope?: number) =>
    ({ 1: '全部', 2: '本部门及以下', 3: '本部门', 4: '仅本人' })[scope ?? 1] ?? '未知'

  /* ---------- 列表 ---------- */
  const listLoading = ref(false)
  const list = ref<SysRoleRow[]>([])
  const total = ref(0)
  const query = reactive({
    current: 1,
    size: 10,
    roleName: '',
    roleCode: '',
    status: '' as number | ''
  })

  const fetchList = async () => {
    listLoading.value = true
    try {
      const res = await rolePageApi(query.current, query.size, {
        roleName: query.roleName,
        roleCode: query.roleCode,
        status: query.status
      })
      list.value = res?.data?.records ?? []
      total.value = res?.data?.total ?? 0
    } catch (error) {
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
    query.roleName = ''
    query.roleCode = ''
    query.status = ''
    onSearch()
  }

  onMounted(fetchList)

  /* ---------- 新增/编辑 ---------- */
  const dialogVisible = ref(false)
  const dialogTitle = ref('')
  const saving = ref(false)
  const formRef = ref()
  const form = reactive({
    id: undefined as number | undefined,
    roleName: '',
    roleCode: '',
    remark: '',
    status: 0,
    dataScope: 1,
    sortNo: 0
  })
  const rules = {
    roleName: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
    roleCode: [{ required: true, message: '请输入角色编码', trigger: 'blur' }]
  }

  const openCreate = () => {
    Object.assign(form, {
      id: undefined,
      roleName: '',
      roleCode: '',
      remark: '',
      status: 0,
      dataScope: 1,
      sortNo: 0
    })
    dialogTitle.value = '新增角色'
    dialogVisible.value = true
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- el-table 插槽行类型与业务行类型解耦
  const openEdit = (row: any) => {
    Object.assign(form, {
      id: row.id,
      roleName: row.roleName,
      roleCode: row.roleCode,
      remark: row.remark ?? '',
      status: row.status ?? 0,
      dataScope: row.dataScope ?? 1,
      sortNo: row.sortNo ?? 0
    })
    dialogTitle.value = '编辑角色'
    dialogVisible.value = true
  }

  const submitForm = async () => {
    if (!formRef.value) return
    try {
      await formRef.value.validate()
    } catch {
      return
    }
    saving.value = true
    try {
      const payload = {
        id: form.id,
        roleName: form.roleName,
        roleCode: form.roleCode,
        remark: form.remark,
        status: form.status,
        dataScope: form.dataScope,
        sortNo: form.sortNo
      }
      if (form.id) await roleUpdateApi(payload)
      else await roleSaveApi(payload)
      ElMessage.success(form.id ? '修改成功' : '新增成功')
      dialogVisible.value = false
      fetchList()
    } catch (error) {
      // 错误提示已由请求层弹出
    } finally {
      saving.value = false
    }
  }

  /* ---------- 删除 ---------- */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- el-table 插槽行类型与业务行类型解耦
  const onRemove = async (row: any) => {
    if (row.roleCode === 'admin') {
      ElMessage.warning('内置超级管理员角色不允许删除')
      return
    }
    try {
      await ElMessageBox.confirm(
        `确定删除角色「${row.roleName}」吗? 其关联的用户与权限将被一并清理。`,
        '提示',
        {
          confirmButtonText: '删除',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
    } catch {
      return
    }
    try {
      await roleRemoveApi([row.id])
    } catch (error) {
      return
    }
    ElMessage.success('删除成功')
    if (list.value.length === 1 && query.current > 1) query.current -= 1
    fetchList()
  }

  /* ---------- 分配菜单权限 ---------- */
  const grantVisible = ref(false)
  const grantSaving = ref(false)
  const grantTarget = ref<SysRoleRow | null>(null)
  const grantTreeRef = ref()
  const menuTree = ref<SysMenuRow[]>([])
  const initialMenuIds = ref<number[]>([])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- el-table 插槽行类型与业务行类型解耦
  const openGrant = async (row: any) => {
    grantTarget.value = row
    grantVisible.value = true
    const [treeRes, idsRes] = await Promise.all([menuTreeApi(), roleMenuIdsApi(row.id)])
    menuTree.value = treeRes?.data ?? []
    initialMenuIds.value = idsRes?.data ?? []
    await nextTick()
    // 勾选已分配节点(含半选父级, 交由 el-tree 联动展开)
    grantTreeRef.value?.setCheckedKeys(initialMenuIds.value, false)
  }

  const submitGrant = async () => {
    if (!grantTarget.value || !grantTreeRef.value) return
    grantSaving.value = true
    try {
      const checked = (grantTreeRef.value.getCheckedKeys(false) ?? []) as number[]
      const halfChecked = (grantTreeRef.value.getHalfCheckedKeys() ?? []) as number[]
      // 父级若仅半选也需一并入库, 否则树形授权回显会缺父节点
      await roleGrantMenusApi(grantTarget.value.id, [...new Set([...checked, ...halfChecked])])
      ElMessage.success('权限分配成功')
      grantVisible.value = false
    } catch (error) {
      // 错误提示已由请求层弹出
    } finally {
      grantSaving.value = false
    }
  }
</script>

<template>
  <ContentWrap
    title="角色管理"
    message="维护角色并授权菜单(目录/菜单/按钮); 删除角色会同步清理其用户与权限关联"
  >
    <template #header>
      <el-button v-if="hasPerm('sys:role:save')" type="primary" @click="openCreate"
        >新增角色</el-button
      >
    </template>

    <el-form inline class="search-bar" @submit.prevent>
      <el-form-item label="角色名称">
        <el-input
          v-model="query.roleName"
          placeholder="请输入角色名称"
          clearable
          style="width: 170px"
          @keyup.enter="onSearch"
        />
      </el-form-item>
      <el-form-item label="角色编码">
        <el-input
          v-model="query.roleCode"
          placeholder="请输入角色编码"
          clearable
          style="width: 160px"
          @keyup.enter="onSearch"
        />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" placeholder="全部" clearable style="width: 130px">
          <el-option label="正常" :value="0" />
          <el-option label="禁用" :value="1" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSearch">查询</el-button>
        <el-button @click="onReset">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="listLoading" :data="list" border stripe>
      <el-table-column prop="id" label="ID" width="70" align="center" />
      <el-table-column prop="roleName" label="角色名称" min-width="140" />
      <el-table-column prop="roleCode" label="角色编码" min-width="130">
        <template #default="{ row }">
          <el-tag v-if="row.roleCode === 'admin'" type="danger">{{ row.roleCode }}</el-tag>
          <span v-else>{{ row.roleCode }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
      <el-table-column prop="sortNo" label="排序" width="80" align="center" />
      <el-table-column label="状态" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'danger' : 'success'">{{
            row.status === 1 ? '禁用' : '正常'
          }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="数据范围" width="130" align="center">
        <template #default="{ row }">
          <el-tag size="small" :type="row.dataScope === 1 ? 'success' : 'info'">
            {{ scopeText(row.dataScope) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="gmtCreated" label="创建时间" width="175" />
      <el-table-column label="操作" width="220" align="center" fixed="right">
        <template #default="{ row }">
          <el-button v-if="hasPerm('sys:role:grant')" link type="primary" @click="openGrant(row)"
            >分配权限</el-button
          >
          <el-button v-if="hasPerm('sys:role:update')" link type="primary" @click="openEdit(row)"
            >编辑</el-button
          >
          <el-button v-if="hasPerm('sys:role:delete')" link type="danger" @click="onRemove(row)"
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
        layout="total, sizes, prev, pager, next, jumper"
        background
        @size-change="fetchList"
        @current-change="fetchList"
      />
    </div>

    <!-- 新增/编辑 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="form.roleName" placeholder="如: 运营专员" />
        </el-form-item>
        <el-form-item label="角色编码" prop="roleCode">
          <el-input
            v-model="form.roleCode"
            placeholder="如: operator(字母数字)"
            :disabled="form.roleCode === 'admin'"
          />
        </el-form-item>
        <el-form-item label="排序号">
          <el-input-number v-model="form.sortNo" :min="0" :max="9999" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio :value="0">正常</el-radio>
            <el-radio :value="1">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="数据范围">
          <el-select v-model="form.dataScope" style="width: 100%">
            <el-option label="全部数据" :value="1" />
            <el-option label="本部门及以下" :value="2" />
            <el-option label="本部门" :value="3" />
            <el-option label="仅本人" :value="4" />
          </el-select>
          <div class="scope-tip">数据权限作用于受控业务查询(示例: 订单管理); 管理员不受限制</div>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="角色说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>

    <!-- 分配菜单权限 -->
    <el-dialog
      v-model="grantVisible"
      :title="`分配权限 - ${grantTarget?.roleName ?? ''}`"
      width="520px"
      destroy-on-close
    >
      <div class="grant-hint">勾选目录/菜单/按钮; 子级勾选后其父级目录会自动半选并一并保存。</div>
      <el-scrollbar max-height="420px">
        <el-tree
          ref="grantTreeRef"
          :data="menuTree"
          node-key="id"
          show-checkbox
          default-expand-all
          :props="{ label: 'menuName', children: 'children' }"
        >
          <template #default="{ data }">
            <span class="grant-node">
              <span>{{ data.menuName }}</span>
              <el-tag
                size="small"
                :type="data.menuType === 3 ? 'info' : data.menuType === 2 ? 'success' : 'warning'"
              >
                {{ data.menuType === 1 ? '目录' : data.menuType === 2 ? '菜单' : '按钮' }}
              </el-tag>
              <span v-if="data.permCode" class="grant-perm">{{ data.permCode }}</span>
            </span>
          </template>
        </el-tree>
      </el-scrollbar>
      <template #footer>
        <el-button @click="grantVisible = false">取消</el-button>
        <el-button type="primary" :loading="grantSaving" @click="submitGrant">保存授权</el-button>
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

  .grant-hint {
    padding: 0 0 10px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .grant-node {
    display: flex;
    gap: 8px;
    align-items: center;

    .grant-perm {
      font-family: SFMono-Regular, Consolas, monospace;
      font-size: 11px;
      color: var(--el-text-color-secondary);
    }
  }
</style>
