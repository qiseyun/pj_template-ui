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
    ElRadio,
    ElRadioButton,
    ElRadioGroup,
    ElTable,
    ElTableColumn,
    ElTag,
    ElTreeSelect
  } from 'element-plus'
  import ContentWrap from '@/components/ContentWrap/index.vue'
  import IconPicker from '@/components/IconPicker/index.vue'
  import { menuRemoveApi, menuSaveApi, menuTreeApi, menuUpdateApi } from '@/api/system/menu'
  import type { SysMenuRow } from '@/api/system/types'
  import { usePermissionStore } from '@/store/modules/permission'

  const permissionStore = usePermissionStore()
  const hasPerm = permissionStore.hasPerm

  /* ---------- 树表 ---------- */
  const listLoading = ref(false)
  const treeData = ref<SysMenuRow[]>([])

  const fetchTree = async () => {
    listLoading.value = true
    try {
      const res = await menuTreeApi()
      treeData.value = res?.data ?? []
    } catch (error) {
      // 错误提示已由请求层弹出
    } finally {
      listLoading.value = false
    }
  }

  onMounted(fetchTree)

  /* ---------- 全部展开/收起 ---------- */
  const allExpanded = ref(true)
  const tableKey = ref(0)

  const toggleExpandAll = async () => {
    allExpanded.value = !allExpanded.value
    // 树形表无公开的"一键展开/收起", 通过 key 重建表格按 default-expand-all 生效
    tableKey.value += 1
    await nextTick()
  }

  const typeTag = (
    type: number
  ): { text: string; cls: 'primary' | 'success' | 'info' | 'warning' | 'danger' } =>
    type === 1
      ? { text: '目录', cls: 'warning' }
      : type === 2
        ? { text: '菜单', cls: 'success' }
        : { text: '按钮', cls: 'info' }

  /* ---------- 新增/编辑 ---------- */
  const dialogVisible = ref(false)
  const dialogTitle = ref('')
  const saving = ref(false)
  const formRef = ref()
  const form = reactive({
    id: undefined as number | undefined,
    parentId: 0,
    menuName: '',
    menuType: 1 as 1 | 2 | 3,
    path: '',
    component: '',
    permCode: '',
    icon: '',
    sortNo: 0,
    status: 0,
    visible: 0
  })

  const rules = {
    menuName: [{ required: true, message: '请输入菜单名称', trigger: 'blur' }],
    menuType: [{ required: true, message: '请选择类型', trigger: 'change' }]
  }

  const defaultForm = (parent: SysMenuRow | null) => {
    Object.assign(form, {
      id: undefined,
      parentId: parent?.id ?? 0,
      menuName: '',
      // 目录下新建默认菜单, 根节点下新建默认目录; 父级为菜单时默认按钮
      menuType: parent ? (parent.menuType === 2 ? 3 : 2) : 1,
      path: '',
      component: '',
      permCode: '',
      icon: '',
      sortNo: 0,
      status: 0,
      visible: 0
    })
  }

  const openCreateRoot = () => {
    defaultForm(null)
    dialogTitle.value = '新增根目录'
    dialogVisible.value = true
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- el-table 插槽行类型与业务行类型解耦
  const openCreateChild = (row: any) => {
    defaultForm(row)
    dialogTitle.value = `新增子节点 - ${row.menuName}`
    dialogVisible.value = true
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- el-table 插槽行类型与业务行类型解耦
  const openEdit = (row: any) => {
    Object.assign(form, {
      id: row.id,
      parentId: row.parentId,
      menuName: row.menuName,
      menuType: row.menuType,
      path: row.path ?? '',
      component: row.component ?? '',
      permCode: row.permCode ?? '',
      icon: row.icon ?? '',
      sortNo: row.sortNo ?? 0,
      status: row.status ?? 0,
      visible: row.visible ?? 0
    })
    dialogTitle.value = '编辑菜单'
    dialogVisible.value = true
  }

  const submitForm = async () => {
    if (!formRef.value) return
    try {
      await formRef.value.validate()
    } catch {
      return
    }
    if (form.menuType !== 3 && !form.path) {
      ElMessage.warning('目录/菜单必须填写路由路径')
      return
    }
    if (form.menuType === 2 && !form.component) {
      ElMessage.warning('菜单必须填写组件路径, 如 views/system/user/index')
      return
    }
    if (form.menuType === 3 && !form.permCode) {
      ElMessage.warning('按钮必须填写权限标识, 如 sys:user:save')
      return
    }
    saving.value = true
    try {
      const payload = {
        id: form.id,
        parentId: form.parentId,
        menuName: form.menuName,
        menuType: form.menuType,
        path: form.path || null,
        component: form.component || null,
        permCode: form.permCode || null,
        icon: form.icon || null,
        sortNo: form.sortNo,
        status: form.status,
        visible: form.visible
      }
      if (form.id) await menuUpdateApi(payload)
      else await menuSaveApi(payload)
      ElMessage.success(form.id ? '修改成功' : '新增成功')
      dialogVisible.value = false
      fetchTree()
    } catch (error) {
      // 错误提示已由请求层弹出
    } finally {
      saving.value = false
    }
  }

  /* ---------- 删除 ---------- */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- el-table 插槽行类型与业务行类型解耦
  const onRemove = async (row: any) => {
    try {
      await ElMessageBox.confirm(
        `确定删除「${row.menuName}」吗? 若存在子节点将删除失败; 已授权的角色关联会同步清理。`,
        '提示',
        { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
      )
    } catch {
      return
    }
    try {
      await menuRemoveApi([row.id])
    } catch (error) {
      return
    }
    ElMessage.success('删除成功')
    fetchTree()
  }
</script>

<template>
  <ContentWrap title="菜单管理" message="维护目录/菜单/按钮三级权限树; 菜单树直接驱动前端动态路由与侧边导航">
    <template #header>
      <el-button
        size="small"
        :type="allExpanded ? 'default' : 'primary'"
        @click="toggleExpandAll"
      >
        <Icon :icon="allExpanded ? 'view-quilt-outline' : 'apps'" :size="14" style="margin-right: 4px" />
        {{ allExpanded ? '全部收起' : '全部展开' }}
      </el-button>
      <el-button v-if="hasPerm('sys:menu:save')" type="primary" @click="openCreateRoot">新增根目录</el-button>
    </template>

    <el-table
      v-loading="listLoading"
      :key="tableKey"
      :data="treeData"
      row-key="id"
      border
      :tree-props="{ children: 'children' }"
      :default-expand-all="allExpanded"
    >
      <el-table-column prop="menuName" label="菜单名称" min-width="220">
        <template #default="{ row }">
          <span class="menu-name-cell">
            <Icon v-if="row.icon && row.menuType !== 3" :icon="row.icon" :size="15" />
            <span>{{ row.menuName }}</span>
            <el-tag v-if="row.visible === 1" size="small" type="info">隐藏</el-tag>
          </span>
        </template>
      </el-table-column>
      <el-table-column label="类型" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="typeTag(row.menuType).cls" size="small">{{ typeTag(row.menuType).text }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="path" label="路由路径" min-width="140" show-overflow-tooltip />
      <el-table-column prop="component" label="组件路径" min-width="180" show-overflow-tooltip />
      <el-table-column prop="permCode" label="权限标识" min-width="150" show-overflow-tooltip />
      <el-table-column prop="icon" label="图标" width="110" show-overflow-tooltip />
      <el-table-column prop="sortNo" label="排序" width="70" align="center" />
      <el-table-column label="状态" width="80" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'danger' : 'success'" size="small">
            {{ row.status === 1 ? '停用' : '正常' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="210" align="center" fixed="right">
        <template #default="{ row }">
          <el-button v-if="hasPerm('sys:menu:save') && row.menuType !== 3" link type="primary" @click="openCreateChild(row)">
            新增子节点
          </el-button>
          <el-button v-if="hasPerm('sys:menu:update')" link type="primary" @click="openEdit(row)">编辑</el-button>
          <el-button v-if="hasPerm('sys:menu:delete')" link type="danger" @click="onRemove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="560px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="上级节点">
          <el-tree-select
            v-model="form.parentId"
            :data="[{ id: 0, menuName: '根节点', children: treeData }]"
            node-key="id"
            :props="{ label: 'menuName', children: 'children' }"
            check-strictly
            default-expand-all
            placeholder="选择上级节点(根节点=顶级目录)"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="菜单名称" prop="menuName">
          <el-input v-model="form.menuName" placeholder="如: 用户管理" />
        </el-form-item>
        <el-form-item label="类型">
          <el-radio-group v-model="form.menuType">
            <el-radio-button :value="1">目录</el-radio-button>
            <el-radio-button :value="2">菜单</el-radio-button>
            <el-radio-button :value="3">按钮</el-radio-button>
          </el-radio-group>
          <div class="form-tip">
            目录=导航分组(不直接打开页面); 菜单=可打开页面; 按钮=接口/按钮权限标识(不出现在导航)
          </div>
        </el-form-item>
        <template v-if="form.menuType !== 3">
          <el-form-item label="路由路径">
            <el-input v-model="form.path" placeholder="如: /system/user" />
          </el-form-item>
          <el-form-item v-if="form.menuType === 2" label="组件路径">
            <el-input v-model="form.component" placeholder="如: views/system/user/index" />
          </el-form-item>
        </template>
        <el-form-item label="权限标识">
          <el-input v-model="form.permCode" placeholder="按钮/接口标识, 如 sys:user:save" />
        </el-form-item>
        <el-form-item label="图标">
          <IconPicker v-model="form.icon" placeholder="点击选择图标" />
          <div class="form-tip">点击打开网格面板, 支持按分类查看与搜索; 按钮类型可不填。</div>
        </el-form-item>
        <el-form-item label="排序号">
          <el-input-number v-model="form.sortNo" :min="0" :max="9999" />
        </el-form-item>
        <el-form-item label="是否显示">
          <el-radio-group v-model="form.visible">
            <el-radio :value="0">显示</el-radio>
            <el-radio :value="1">隐藏</el-radio>
          </el-radio-group>
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
        <el-button type="primary" :loading="saving" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </ContentWrap>
</template>

<style lang="less" scoped>
  .menu-name-cell {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .form-tip {
    width: 100%;
    font-size: 11.5px;
    line-height: 1.6;
    color: var(--el-text-color-secondary);
  }
</style>
