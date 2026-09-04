<script setup lang="ts">
  import { onMounted, reactive, ref } from 'vue'
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
  import { roleListAllApi } from '@/api/system/role'
  import type { SysRoleRow, SysUserRow } from '@/api/system/types'
  import {
    userAssignRolesApi,
    userPageApi,
    userRemoveApi,
    userRoleIdsApi,
    userSaveApi,
    userUpdateApi
  } from '@/api/system/user'
  import { usePermissionStore } from '@/store/modules/permission'
  import { useUserStore } from '@/store/modules/user'

  const permissionStore = usePermissionStore()
  const userStore = useUserStore()
  const hasPerm = permissionStore.hasPerm

  /* ---------- 列表 ---------- */
  const listLoading = ref(false)
  const list = ref<SysUserRow[]>([])
  const total = ref(0)
  const query = reactive({
    current: 1,
    size: 10,
    username: '',
    status: '' as number | ''
  })

  const fetchList = async () => {
    listLoading.value = true
    try {
      const res = await userPageApi(query.current, query.size, {
        username: query.username,
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
    query.username = ''
    query.status = ''
    onSearch()
  }

  onMounted(fetchList)

  /* ---------- 新增/编辑弹窗 ---------- */
  const dialogVisible = ref(false)
  const dialogTitle = ref('')
  const saving = ref(false)
  const formRef = ref()
  const form = reactive({
    id: undefined as number | undefined,
    username: '',
    password: '',
    nickname: '',
    status: 0
  })
  const rules = {
    username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
    password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
    status: [{ required: true, message: '请选择状态', trigger: 'change' }]
  }

  const openCreate = () => {
    Object.assign(form, { id: undefined, username: '', password: '', nickname: '', status: 0 })
    dialogTitle.value = '新增用户'
    dialogVisible.value = true
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- el-table 插槽行类型与业务行类型解耦
  const openEdit = (row: any) => {
    Object.assign(form, {
      id: row.id,
      username: row.username,
      password: '',
      nickname: row.nickname ?? '',
      status: row.status ?? 0
    })
    dialogTitle.value = '编辑用户'
    dialogVisible.value = true
  }

  const submitForm = async () => {
    if (!formRef.value) return
    try {
      await formRef.value.validate()
    } catch {
      return
    }
    if (form.password && form.password.length < 6) {
      ElMessage.warning('密码长度不能少于 6 位')
      return
    }
    saving.value = true
    try {
      const payload: Partial<SysUserRow> = {
        id: form.id,
        username: form.username,
        nickname: form.nickname,
        status: form.status
      }
      if (form.password) payload.password = form.password
      if (form.id) {
        await userUpdateApi(payload)
      } else {
        await userSaveApi(payload)
      }
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
    if (row.username === userStore.userInfo?.username) {
      ElMessage.warning('不能删除当前登录账号')
      return
    }
    try {
      await ElMessageBox.confirm(`确定删除用户「${row.username}」吗?`, '提示', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      })
    } catch {
      return
    }
    try {
      await userRemoveApi([row.id])
    } catch (error) {
      return
    }
    ElMessage.success('删除成功')
    if (list.value.length === 1 && query.current > 1) query.current -= 1
    fetchList()
  }

  /* ---------- 分配角色 ---------- */
  const assignVisible = ref(false)
  const assignSaving = ref(false)
  const assignTarget = ref<SysUserRow | null>(null)
  const roleOptions = ref<SysRoleRow[]>([])
  const assignRoleIds = ref<number[]>([])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- el-table 插槽行类型与业务行类型解耦
  const openAssign = async (row: any) => {
    assignTarget.value = row
    assignVisible.value = true
    const [rolesRes, roleIdsRes] = await Promise.all([roleListAllApi(), userRoleIdsApi(row.id)])
    roleOptions.value = rolesRes?.data ?? []
    assignRoleIds.value = roleIdsRes?.data ?? []
  }

  const submitAssign = async () => {
    if (!assignTarget.value) return
    assignSaving.value = true
    try {
      await userAssignRolesApi(assignTarget.value.id, assignRoleIds.value)
      ElMessage.success('角色分配成功')
      assignVisible.value = false
    } catch (error) {
      // 错误提示已由请求层弹出
    } finally {
      assignSaving.value = false
    }
  }
</script>

<template>
  <ContentWrap title="用户管理" message="维护系统账号并分配角色; 删除账号会同步清理其角色关联">
    <template #header>
      <el-button v-if="hasPerm('sys:user:save')" type="primary" @click="openCreate">新增用户</el-button>
    </template>

    <el-form inline class="search-bar" @submit.prevent>
      <el-form-item label="用户名">
        <el-input
          v-model="query.username"
          placeholder="请输入用户名"
          clearable
          style="width: 200px"
          @keyup.enter="onSearch"
        />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="query.status" placeholder="全部" clearable style="width: 140px">
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
      <el-table-column prop="username" label="用户名" min-width="130" />
      <el-table-column prop="nickname" label="昵称" min-width="130" />
      <el-table-column label="状态" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'danger' : 'success'">
            {{ row.status === 1 ? '禁用' : '正常' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="lastLoginTime" label="最后登录时间" width="175" />
      <el-table-column prop="gmtCreated" label="创建时间" width="175" />
      <el-table-column label="操作" width="230" align="center" fixed="right">
        <template #default="{ row }">
          <el-button v-if="hasPerm('sys:user:assignRole')" link type="primary" @click="openAssign(row)">
            分配角色
          </el-button>
          <el-button v-if="hasPerm('sys:user:update')" link type="primary" @click="openEdit(row)">
            编辑
          </el-button>
          <el-button
            v-if="hasPerm('sys:user:delete')"
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
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @size-change="fetchList"
        @current-change="fetchList"
      />
    </div>

    <!-- 新增/编辑 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="480px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="登录用户名(唯一)" :disabled="Boolean(form.id)" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            show-password
            :placeholder="form.id ? '留空则不修改密码' : '初始密码(不少于6位)'"
          />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="form.nickname" placeholder="显示昵称" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :value="0">正常</el-radio>
            <el-radio :value="1">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>

    <!-- 分配角色 -->
    <el-dialog v-model="assignVisible" :title="`分配角色 - ${assignTarget?.username ?? ''}`" width="460px" destroy-on-close>
      <el-select
        v-model="assignRoleIds"
        multiple
        filterable
        placeholder="选择要分配的角色(可多选)"
        style="width: 100%"
      >
        <el-option
          v-for="role in roleOptions"
          :key="role.id"
          :label="`${role.roleName}(${role.roleCode})`"
          :value="role.id"
          :disabled="role.status === 1"
        />
      </el-select>
      <template #footer>
        <el-button @click="assignVisible = false">取消</el-button>
        <el-button type="primary" :loading="assignSaving" @click="submitAssign">确定</el-button>
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
