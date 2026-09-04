<script setup lang="ts">
  // 轻量富文本编辑器: contenteditable + document.execCommand(现代浏览器均支持)
  import { nextTick, onMounted, ref, watch } from 'vue'

  const props = withDefaults(
    defineProps<{
      modelValue?: string
      placeholder?: string
      minHeight?: number
    }>(),
    {
      modelValue: '',
      placeholder: '请输入内容…',
      minHeight: 220
    }
  )

  const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

  const editorRef = ref<HTMLDivElement>()

  const syncFromProp = () => {
    const el = editorRef.value
    if (!el) return
    const incoming = props.modelValue ?? ''
    if (el.innerHTML !== incoming) el.innerHTML = incoming
  }

  onMounted(syncFromProp)
  watch(() => props.modelValue, syncFromProp)

  const onInput = () => {
    if (!editorRef.value) return
    emit('update:modelValue', editorRef.value.innerHTML)
  }

  const runCommand = (command: string, value?: string) => {
    const el = editorRef.value
    if (!el) return
    el.focus()
    document.execCommand(command, false, value)
    onInput()
  }

  const insertLink = () => {
    const url = window.prompt('请输入链接地址(https://…)')
    if (!url) return
    runCommand('createLink', url)
  }

  const toolbar: { label: string; command?: string; value?: string; action?: () => void }[] = [
    { label: '加粗', command: 'bold' },
    { label: '斜体', command: 'italic' },
    { label: '下划线', command: 'underline' },
    { label: '删除线', command: 'strikeThrough' },
    { label: 'H2', command: 'formatBlock', value: 'h2' },
    { label: 'H3', command: 'formatBlock', value: 'h3' },
    { label: '无序列表', command: 'insertUnorderedList' },
    { label: '有序列表', command: 'insertOrderedList' },
    { label: '引用', command: 'formatBlock', value: 'blockquote' },
    { label: '链接', action: insertLink },
    { label: '清除格式', command: 'removeFormat' }
  ]

  const clearContent = () => {
    const el = editorRef.value
    if (!el) return
    el.innerHTML = ''
    emit('update:modelValue', '')
    nextTick(() => el.focus())
  }
</script>

<template>
  <div class="rich-editor">
    <div class="editor-toolbar">
      <button
        v-for="btn in toolbar"
        :key="btn.label"
        type="button"
        class="editor-tool"
        :title="btn.label"
        @mousedown.prevent="btn.action ? btn.action() : runCommand(btn.command!, btn.value)"
      >
        {{ btn.label }}
      </button>
      <button type="button" class="editor-tool is-danger" title="清空" @mousedown.prevent="clearContent">
        清空
      </button>
    </div>
    <div
      ref="editorRef"
      class="editor-area"
      :data-placeholder="placeholder"
      :style="{ minHeight: `${minHeight}px` }"
      contenteditable="true"
      @input="onInput"
    ></div>
  </div>
</template>

<style lang="less" scoped>
  .rich-editor {
    border: 1px solid var(--el-border-color);
    border-radius: 8px;
    overflow: hidden;
    transition: border-color 160ms ease;

    &:focus-within {
      border-color: var(--el-color-primary);
    }
  }

  .editor-toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    padding: 6px 8px;
    background: var(--el-fill-color-light);
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .editor-tool {
    padding: 4px 10px;
    font-size: 12px;
    color: var(--el-text-color-regular);
    cursor: pointer;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color);
    border-radius: 6px;
    transition: all 150ms ease;

    &:hover {
      color: var(--el-color-primary);
      border-color: var(--el-color-primary-light-5);
    }

    &.is-danger:hover {
      color: var(--el-color-danger);
      border-color: var(--el-color-danger-light-5);
    }
  }

  .editor-area {
    padding: 12px 14px;
    font-size: 14px;
    line-height: 1.8;
    outline: none;
    overflow-y: auto;
    color: var(--el-text-color-primary);

    &:empty::before {
      color: var(--el-text-color-placeholder);
      content: attr(data-placeholder);
      pointer-events: none;
    }

    :deep(p) {
      margin: 0 0 10px;
    }

    :deep(h1),
    :deep(h2),
    :deep(h3) {
      margin: 14px 0 8px;
      line-height: 1.4;
    }

    :deep(ul),
    :deep(ol) {
      padding-left: 22px;
      margin: 6px 0;
    }

    :deep(blockquote) {
      padding: 6px 14px;
      margin: 8px 0;
      color: var(--el-text-color-secondary);
      background: var(--el-fill-color-light);
      border-left: 3px solid var(--el-color-primary);
    }

    :deep(a) {
      color: var(--el-color-primary);
    }

    :deep(img) {
      max-width: 100%;
    }
  }
</style>
