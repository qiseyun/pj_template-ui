<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { ElInput, ElPopover } from 'element-plus'
  import { ALL_ICON_VALUES, humanizeIcon, MENU_ICON_CATEGORIES } from '@/config/menuIcons'

  const props = withDefaults(
    defineProps<{
      modelValue?: string | null
      placeholder?: string
    }>(),
    {
      modelValue: null,
      placeholder: '选择图标'
    }
  )

  const emit = defineEmits<{ (e: 'update:modelValue', value: string | null): void }>()

  const popVisible = ref(false)
  const activeCategory = ref('常用')
  const keyword = ref('')

  /** 分类页签(含"全部") */
  const categoryTabs = computed(() => [
    { label: '全部', values: ALL_ICON_VALUES },
    ...MENU_ICON_CATEGORIES
  ])

  /** 当前生效分类的图标(未收录的历史值也要保留可选) */
  const currentValues = computed(() => {
    const base =
      activeCategory.value === '全部'
        ? ALL_ICON_VALUES
        : (MENU_ICON_CATEGORIES.find((c) => c.label === activeCategory.value)?.values ?? [])
    if (props.modelValue && !base.includes(props.modelValue) && !ALL_ICON_VALUES.includes(props.modelValue)) {
      return [props.modelValue, ...base]
    }
    return base
  })

  /** 搜索/过滤结果 */
  const filteredValues = computed(() => {
    const kw = keyword.value.trim().toLowerCase()
    if (!kw) return currentValues.value
    return currentValues.value.filter((value) => {
      const name = humanizeIcon(value).toLowerCase()
      return value.toLowerCase().includes(kw) || name.includes(kw)
    })
  })

  const choose = (value: string) => {
    emit('update:modelValue', value)
    popVisible.value = false
    keyword.value = ''
  }

  const clear = () => {
    emit('update:modelValue', null)
    popVisible.value = false
  }
</script>

<template>
  <el-popover
    v-model:visible="popVisible"
    placement="bottom-start"
    :width="500"
    trigger="click"
    popper-class="icon-picker-popper"
  >
    <template #reference>
      <el-input
        :model-value="props.modelValue || ''"
        :placeholder="placeholder"
        readonly
        clearable
        class="icon-picker-input"
        @clear="clear"
      >
        <template #prefix>
          <Icon v-if="props.modelValue" :icon="props.modelValue" :size="16" />
        </template>
      </el-input>
    </template>

    <div class="picker-panel">
      <div class="picker-search">
        <el-input
          v-model="keyword"
          size="small"
          clearable
          placeholder="搜索图标(如 dashboard / user / bell)"
        />
      </div>

      <div class="picker-tabs">
        <button
          v-for="tab in categoryTabs"
          :key="tab.label"
          type="button"
          class="picker-tab"
          :class="{ 'is-active': activeCategory === tab.label }"
          @click="activeCategory = tab.label"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="picker-grid-wrap">
        <ul v-if="filteredValues.length" class="picker-grid">
          <li v-for="value in filteredValues" :key="value">
            <button
              type="button"
              class="picker-cell"
              :class="{ 'is-active': modelValue === value }"
              :title="`${humanizeIcon(value)} (${value})`"
              @click="choose(value)"
            >
              <Icon :icon="value" :size="22" />
            </button>
          </li>
        </ul>
        <div v-else class="picker-empty">未找到匹配图标</div>
      </div>

      <div class="picker-footer">
        <span class="picker-selected">
          <template v-if="modelValue">
            已选：
            <Icon :icon="modelValue" :size="15" />
            <code>{{ modelValue }}</code>
          </template>
          <template v-else>尚未选择图标</template>
        </span>
        <button v-if="modelValue" type="button" class="picker-clear-btn" @click="clear">清除</button>
      </div>
    </div>
  </el-popover>
</template>

<style lang="less" scoped>
  .icon-picker-input {
    :deep(.el-input__wrapper) {
      cursor: pointer;
    }
  }

  .picker-search {
    margin-bottom: 10px;
  }

  .picker-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding-bottom: 10px;
    margin-bottom: 10px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .picker-tab {
    padding: 3px 11px;
    font-size: 12px;
    color: var(--el-text-color-regular);
    cursor: pointer;
    background: var(--el-fill-color-light);
    border: 1px solid transparent;
    border-radius: 999px;
    transition: all 140ms ease;

    &:hover {
      color: var(--el-color-primary);
    }

    &.is-active {
      color: #fff;
      background: var(--el-color-primary);
    }
  }

  .picker-grid-wrap {
    min-height: 170px;
    max-height: 300px;
    overflow-y: auto;
  }

  .picker-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(44px, 1fr));
    gap: 6px;
    padding: 0;
    margin: 0;
    list-style: none;
  }

  .picker-cell {
    display: grid;
    width: 100%;
    aspect-ratio: 1;
    color: var(--el-text-color-regular);
    cursor: pointer;
    background: var(--el-fill-color-lighter);
    border: 1px solid transparent;
    border-radius: 8px;
    place-items: center;
    transition: all 130ms ease;

    &:hover {
      color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
    }

    &.is-active {
      color: #fff;
      background: var(--el-color-primary);
      box-shadow: 0 4px 10px rgb(var(--el-color-primary-rgb) / 30%);
    }
  }

  .picker-empty {
    padding: 44px 0;
    font-size: 13px;
    text-align: center;
    color: var(--el-text-color-secondary);
  }

  .picker-footer {
    display: flex;
    gap: 10px;
    align-items: center;
    justify-content: space-between;
    padding-top: 10px;
    margin-top: 10px;
    border-top: 1px solid var(--el-border-color-lighter);
  }

  .picker-selected {
    display: inline-flex;
    gap: 6px;
    align-items: center;
    min-width: 0;
    font-size: 12px;
    color: var(--el-text-color-secondary);

    code {
      font-family: SFMono-Regular, Consolas, monospace;
      color: var(--el-text-color-regular);
    }
  }

  .picker-clear-btn {
    flex: none;
    padding: 3px 12px;
    font-size: 12px;
    color: var(--el-color-danger);
    cursor: pointer;
    background: transparent;
    border: 1px solid var(--el-border-color);
    border-radius: 6px;
    transition: all 140ms ease;

    &:hover {
      color: #fff;
      background: var(--el-color-danger);
      border-color: var(--el-color-danger);
    }
  }
</style>
