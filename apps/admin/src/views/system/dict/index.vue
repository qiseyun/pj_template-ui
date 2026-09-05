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
    ElRadio,
    ElRadioGroup,
    ElSelect,
    ElSwitch,
    ElTable,
    ElTableColumn,
    ElTag
  } from 'element-plus'
  import ContentWrap from '@/components/ContentWrap/index.vue'
  import type { DictDataRow, DictTypeRow } from '@/api/system/types'
  import {
    dictDataPageApi,
    dictDataRemoveApi,
    dictDataSaveApi,
    dictDataUpdateApi,
    dictTypePageApi,
    dictTypeRemoveApi,
    dictTypeSaveApi,
    dictTypeUpdateApi
  } from '@/api/system/dict'
  import { usePermissionStore } from '@/store/modules/permission'

  const permissionStore = usePermissionStore()
  const hasPerm = permissionStore.hasPerm

  /* ---------- 字典类型列表 ---------- */
  const typeLoading = ref(false)
  const typeList = ref<DictTypeRow[]>([])
  const typeTotal = ref(0)
  const typeQuery = reactive({ current: 1, size: 10, dictName: '', dictType: '' })

  const fetchTypes = async () => {
    typeLoading.value = true
    try {
      const res = await dictTypePageApi(typeQuery.current, typeQuery.size, {
        dictName: typeQuery.dictName,
        dictType: typeQuery.dictType
      })
      typeList.value = res?.data?.records ?? []
      typeTotal.value = res?.data?.total ?? 0
    } finally {
      typeLoading.value = false
    }
  }

  const onTypeSearch = () => {
    typeQuery.current = 1
    fetchTypes()
  }

  const onTypeReset = () => {
    typeQuery.dictName = ''
    typeQuery.dictType = ''
    onTypeSearch()
  }

  /* ---------- 类型新增/编辑 ---------- */
  const typeVisible = ref(false)
  const typeTitle = ref('')
  const typeSaving = ref(false)
  const typeForm = reactive<DictTypeRow>({
    id: undefined,
    dictName: '',
    dictType: '',
    remark: '',
    status: 0,
    sortNo: 0
  } as unknown as DictTypeRow)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openTypeEdit = (row?: any) => {
    Object.assign(
      typeForm,
      row
        ? {
            id: row.id,
            dictName: row.dictName ?? '',
            dictType: row.dictType ?? '',
            remark: row.remark ?? '',
            status: row.status ?? 0,
            sortNo: row.sortNo ?? 0
          }
        : { id: undefined, dictName: '', dictType: '', remark: '', status: 0, sortNo: 0 }
    )
    typeTitle.value = row ? '编辑字典类型' : '新增字典类型'
    typeVisible.value = true
  }

  const submitType = async () => {
    if (!typeForm.dictName || !typeForm.dictType) {
      ElMessage.warning('请填写字典名称与类型编码')
      return
    }
    typeSaving.value = true
    try {
      if (typeForm.id) {
        await dictTypeUpdateApi({
          id: typeForm.id,
          dictName: typeForm.dictName,
          remark: typeForm.remark,
          status: typeForm.status,
          sortNo: typeForm.sortNo
        })
      } else {
        await dictTypeSaveApi({
          dictName: typeForm.dictName,
          dictType: typeForm.dictType,
          remark: typeForm.remark,
          status: typeForm.status,
          sortNo: typeForm.sortNo
        })
      }
      ElMessage.success('保存成功')
      typeVisible.value = false
      fetchTypes()
    } finally {
      typeSaving.value = false
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const removeType = async (row: any) => {
    try {
      await ElMessageBox.confirm(`确定删除字典类型「${row.dictName}」吗?`, '提示', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      })
    } catch {
      return
    }
    try {
      await dictTypeRemoveApi(row.id)
    } catch {
      return
    }
    ElMessage.success('删除成功')
    if (typeList.value.length === 1 && typeQuery.current > 1) typeQuery.current -= 1
    fetchTypes()
  }

  /* ---------- 字典数据管理(弹层) ---------- */
  const dataVisible = ref(false)
  const dataType = ref<DictTypeRow | null>(null)
  const dataLoading = ref(false)
  const dataList = ref<DictDataRow[]>([])
  const dataTotal = ref(0)
  const dataQuery = reactive({ current: 1, size: 10, label: '' })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openData = async (row: any) => {
    dataType.value = row
    dataQuery.label = ''
    dataQuery.current = 1
    dataVisible.value = true
    await fetchData()
  }

  const fetchData = async () => {
    if (!dataType.value) return
    dataLoading.value = true
    try {
      const res = await dictDataPageApi(dataQuery.current, dataQuery.size, {
        dictType: dataType.value.dictType,
        label: dataQuery.label
      })
      dataList.value = res?.data?.records ?? []
      dataTotal.value = res?.data?.total ?? 0
    } finally {
      dataLoading.value = false
    }
  }

  const onDataSearch = () => {
    dataQuery.current = 1
    fetchData()
  }

  /* ---------- 数据项新增/编辑 ---------- */
  const dataFormVisible = ref(false)
  const dataFormSaving = ref(false)
  const dataForm = reactive<DictDataRow>({
    id: undefined,
    dictLabel: '',
    dictValue: '',
    dictSort: 0,
    tagType: '',
    isDefault: 0,
    status: 0,
    remark: ''
  } as unknown as DictDataRow)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openDataEdit = (row?: any) => {
    Object.assign(
      dataForm,
      row
        ? {
            id: row.id,
            dictLabel: row.dictLabel ?? '',
            dictValue: row.dictValue ?? '',
            dictSort: row.dictSort ?? 0,
            tagType: row.tagType ?? '',
            isDefault: row.isDefault ?? 0,
            status: row.status ?? 0,
            remark: row.remark ?? ''
          }
        : {
            id: undefined,
            dictLabel: '',
            dictValue: '',
            dictSort: 0,
            tagType: '',
            isDefault: 0,
            status: 0,
            remark: ''
          }
    )
    dataFormVisible.value = true
  }

  const submitData = async () => {
    if (!dataType.value) return
    if (!dataForm.dictLabel || !dataForm.dictValue) {
      ElMessage.warning('请填写字典标签与键值')
      return
    }
    dataFormSaving.value = true
    try {
      const payload = {
        id: dataForm.id,
        dictType: dataType.value.dictType,
        dictLabel: dataForm.dictLabel,
        dictValue: dataForm.dictValue,
        dictSort: dataForm.dictSort ?? 0,
        tagType: dataForm.tagType ?? '',
        isDefault: dataForm.isDefault ?? 0,
        status: dataForm.status ?? 0,
        remark: dataForm.remark ?? ''
      }
      if (dataForm.id) {
        await dictDataUpdateApi(payload)
      } else {
        await dictDataSaveApi(payload)
      }
      ElMessage.success('保存成功')
      dataFormVisible.value = false
      fetchData()
    } finally {
      dataFormSaving.value = false
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const removeData = async (row: any) => {
    try {
      await ElMessageBox.confirm(`确定删除数据项「${row.dictLabel}」吗?`, '提示', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      })
    } catch {
      return
    }
    try {
      await dictDataRemoveApi(row.id)
    } catch {
      return
    }
    ElMessage.success('删除成功')
    if (dataList.value.length === 1 && dataQuery.current > 1) dataQuery.current -= 1
    fetchData()
  }

  onMounted(fetchTypes)
</script>

<template>
  <ContentWrap
    title="字典管理"
    message="业务枚举统一走字典配置: 前端下拉/标签从 options 接口获取, 改配置不改代码"
  >
    <template #header>
      <el-button v-if="hasPerm('sys:dict:save')" type="primary" @click="openTypeEdit()"
        >新增字典类型</el-button
      >
    </template>

    <el-form inline class="search-bar" @submit.prevent>
      <el-form-item label="类型名称">
        <el-input
          v-model="typeQuery.dictName"
          placeholder="模糊搜索"
          clearable
          style="width: 160px"
          @keyup.enter="onTypeSearch"
        />
      </el-form-item>
      <el-form-item label="类型编码">
        <el-input
          v-model="typeQuery.dictType"
          placeholder="模糊搜索"
          clearable
          style="width: 160px"
          @keyup.enter="onTypeSearch"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onTypeSearch">查询</el-button>
        <el-button @click="onTypeReset">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="typeLoading" :data="typeList" border stripe>
      <el-table-column prop="id" label="ID" width="70" align="center" />
      <el-table-column prop="dictName" label="字典名称" min-width="140" />
      <el-table-column prop="dictType" label="类型编码" min-width="150" />
      <el-table-column prop="remark" label="备注" min-width="160" show-overflow-tooltip />
      <el-table-column label="状态" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'info' : 'success'">{{
            row.status === 1 ? '停用' : '正常'
          }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="sortNo" label="排序" width="80" align="center" />
      <el-table-column label="操作" width="240" align="center" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openData(row)">管理数据</el-button>
          <el-button v-if="hasPerm('sys:dict:save')" link type="primary" @click="openTypeEdit(row)"
            >编辑</el-button
          >
          <el-button v-if="hasPerm('sys:dict:delete')" link type="danger" @click="removeType(row)"
            >删除</el-button
          >
        </template>
      </el-table-column>
    </el-table>

    <div class="pager">
      <el-pagination
        v-model:current-page="typeQuery.current"
        v-model:page-size="typeQuery.size"
        :total="typeTotal"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        background
        @size-change="fetchTypes"
        @current-change="fetchTypes"
      />
    </div>

    <!-- 类型新增/编辑 -->
    <el-dialog v-model="typeVisible" :title="typeTitle" width="480px" destroy-on-close>
      <el-form :model="typeForm" label-width="90px">
        <el-form-item label="字典名称" required>
          <el-input v-model="typeForm.dictName" placeholder="如: 用户状态" :disabled="typeSaving" />
        </el-form-item>
        <el-form-item label="类型编码" required>
          <el-input
            v-model="typeForm.dictType"
            placeholder="如: user_status(创建后不可修改)"
            :disabled="Boolean(typeForm.id) || typeSaving"
          />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="typeForm.sortNo" :min="0" :max="9999" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="typeForm.status">
            <el-radio :value="0">正常</el-radio>
            <el-radio :value="1">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="typeForm.remark" type="textarea" :rows="2" placeholder="说明用途" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="typeVisible = false">取消</el-button>
        <el-button type="primary" :loading="typeSaving" @click="submitType">确定</el-button>
      </template>
    </el-dialog>

    <!-- 数据项管理 -->
    <el-dialog
      v-model="dataVisible"
      :title="`数据管理 - ${dataType?.dictName ?? ''}(${dataType?.dictType ?? ''})`"
      width="860px"
      destroy-on-close
    >
      <el-form inline class="sub-search" @submit.prevent>
        <el-form-item label="标签/键值">
          <el-input
            v-model="dataQuery.label"
            placeholder="按标签模糊搜索"
            clearable
            style="width: 180px"
            @keyup.enter="onDataSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onDataSearch">查询</el-button>
        </el-form-item>
        <el-form-item style="margin-left: auto">
          <el-button v-if="hasPerm('sys:dict:save')" type="primary" @click="openDataEdit()"
            >新增数据项</el-button
          >
        </el-form-item>
      </el-form>

      <el-table v-loading="dataLoading" :data="dataList" border stripe max-height="420">
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="dictLabel" label="标签" min-width="110" />
        <el-table-column prop="dictValue" label="键值" min-width="100" />
        <el-table-column label="颜色" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.tagType" :type="(row.tagType as any) || 'info'" size="small">{{
              row.dictLabel
            }}</el-tag>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column prop="dictSort" label="排序" width="70" align="center" />
        <el-table-column label="默认" width="70" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.isDefault === 1" type="success" size="small">默认</el-tag>
            <span v-else>—</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'info' : 'success'" size="small">{{
              row.status === 1 ? '停用' : '正常'
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
        <el-table-column label="操作" width="140" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="hasPerm('sys:dict:save')"
              link
              type="primary"
              @click="openDataEdit(row)"
              >编辑</el-button
            >
            <el-button v-if="hasPerm('sys:dict:delete')" link type="danger" @click="removeData(row)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>

      <div class="pager">
        <el-pagination
          v-model:current-page="dataQuery.current"
          v-model:page-size="dataQuery.size"
          :total="dataTotal"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          background
          @size-change="fetchData"
          @current-change="fetchData"
        />
      </div>
    </el-dialog>

    <!-- 数据项新增/编辑 -->
    <el-dialog v-model="dataFormVisible" title="新增/编辑数据项" width="480px" destroy-on-close>
      <el-form :model="dataForm" label-width="90px">
        <el-form-item label="标签" required>
          <el-input
            v-model="dataForm.dictLabel"
            placeholder="如: 正常"
            :disabled="dataFormSaving"
          />
        </el-form-item>
        <el-form-item label="键值" required>
          <el-input v-model="dataForm.dictValue" placeholder="如: 0" :disabled="dataFormSaving" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="dataForm.dictSort" :min="0" :max="9999" />
        </el-form-item>
        <el-form-item label="颜色类型">
          <el-select v-model="dataForm.tagType" placeholder="默认无" clearable style="width: 180px">
            <el-option label="success(绿)" value="success" />
            <el-option label="warning(黄)" value="warning" />
            <el-option label="danger(红)" value="danger" />
            <el-option label="info(灰)" value="info" />
          </el-select>
        </el-form-item>
        <el-form-item label="默认项">
          <el-switch v-model="dataForm.isDefault" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="dataForm.status">
            <el-radio :value="0">正常</el-radio>
            <el-radio :value="1">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="dataForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dataFormVisible = false">取消</el-button>
        <el-button type="primary" :loading="dataFormSaving" @click="submitData">确定</el-button>
      </template>
    </el-dialog>
  </ContentWrap>
</template>

<style lang="less" scoped>
  .search-bar,
  .sub-search {
    padding: 14px 16px 0;
    margin-bottom: 2px;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 12px;
  }

  .sub-search {
    border-radius: 8px;
  }

  .search-bar :deep(.el-form-item),
  .sub-search :deep(.el-form-item) {
    margin-bottom: 14px;
  }

  .pager {
    display: flex;
    padding: 16px 2px 2px;
    justify-content: flex-end;
  }
</style>
