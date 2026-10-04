<script setup lang="ts">
  /**
   * 通用富文本编辑器(wangEditor v5)
   *
   * - 图片/视频上传已对接服务端 /file/upload(前端走 /api 前缀), 上传成功只写入干净的
   *   /api/file/preview|video/{id} 地址, 展示时再由 viewer 注入当前 accessToken;
   * - v-model 值为 HTML 字符串, 可直接入库; onChange 时会剥离 token 参数, 保证数据干净;
   * - 编辑器内实时预览通过 DOM 层补 token, 不污染数据模型与撤销栈;
   * - 工具栏默认使用 wangEditor 内置默认项(toolbarKeys 不传即用默认); 点击工具栏时会自动
   *   聚焦编辑器并恢复选区, 否则"图片/视频"这类依赖选区的按钮会一直处于禁用(灰色)状态。
   */
  import '@wangeditor/editor/dist/css/style.css'

  import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
  import type { CSSProperties } from 'vue'
  import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
  import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor'
  import { ElMessage } from 'element-plus'
  import { fileUpload } from '@/api/system/file'
  import { applyMediaAuth, withMediaAuth } from '@/utils/richTextAuth'
  import { stripMediaAuthInHtml } from '@/utils/richTextMedia'

  type InsertImageFn = (url: string, alt: string, href: string) => void
  type InsertVideoFn = (src: string, poster: string) => void

  /** 上传接口路径(与 @/api/system/file 保持一致) */
  const API_FILE_UPLOAD = '/api/file/upload'

  const props = withDefaults(
    defineProps<{
      /** 内容 HTML */
      modelValue?: string
      placeholder?: string
      /** 编辑区高度(px); resizable 为 true 时为初始高度, 用户可拖动调整 */
      height?: number
      /** 是否允许用户拖动调整整体高度(默认开启) */
      resizable?: boolean
      /** 编辑模式: default 完整工具栏 / simple 简洁工具栏 */
      mode?: 'default' | 'simple'
      /** 只读(禁止编辑) */
      disabled?: boolean
      /** 自定义工具栏菜单 key 列表(不传则用 wangEditor 默认全量) */
      toolbarKeys?: string[]
      /** 单文件体积上限(MB) */
      imageSizeLimitMB?: number
      videoSizeLimitMB?: number
    }>(),
    {
      modelValue: '',
      placeholder: '请输入内容…',
      height: 360,
      resizable: true,
      mode: 'default',
      disabled: false,
      imageSizeLimitMB: 10,
      videoSizeLimitMB: 200
    }
  )

  const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void
    (e: 'change', value: string): void
  }>()

  /**
   * 编辑区样式
   * - 固定高度模式: 直接给出高度并内部滚动;
   * - 可拖动调整模式: 高度交给外层容器(flex 撑满), 用户拖动外层右下角改高度。
   */
  const bodyStyle = computed<CSSProperties>(() =>
    props.resizable
      ? { overflowY: 'auto' }
      : { height: `${props.height}px`, overflowY: 'auto' }
  )

  /**
   * 外层容器样式: 用 minHeight 而不是固定 height
   *
   * 工具栏换行(窗口变窄)时编辑器会自动变高, 不会把编辑区挤扁;
   * 同时保留确定的高度, 使右下角的拖动调整高度(resize)可用。
   */
  const editorStyle = computed<CSSProperties>(() => ({
    minHeight: `${props.height}px`
  }))

  /** 编辑器实例: 必须用 shallowRef */
  const editorRef = shallowRef<IDomEditor>()
  /** 编辑器根节点(用于 DOM 层媒体鉴权预览) */
  const editorBoxRef = ref<HTMLDivElement>()
  const uploading = ref(false)
  /** 最近一次向父组件提交的值(用于避免 setHtml 造成光标/撤销栈异常) */
  let lastEmitted = ''

  /**
   * 工具栏配置
   *
   * 未传 toolbarKeys 时**不设置该字段**, 由 wangEditor 使用内置默认工具栏
   * (含撤销/重做、标题、加粗等格式、列表、对齐、链接、图片/视频、表格等), 无需自己维护一份列表。
   */
  const toolbarConfig = computed<Partial<IToolbarConfig>>(() =>
    props.toolbarKeys?.length ? { toolbarKeys: props.toolbarKeys } : {}
  )

  /** 校验: 站内相对地址与 http(s) 绝对地址均放行(外部图片不强制上传) */
  const checkImageUrl = (src: string): boolean | string => {
    if (!src) return '图片地址不能为空'
    if (/^(\/|https?:\/\/)/i.test(src) || src.startsWith('data:image/')) return true
    return '图片地址必须以 / 或 http(s):// 开头'
  }

  /** 校验视频地址 */
  const checkVideoUrl = (src: string): boolean | string => {
    if (!src) return '视频地址不能为空'
    if (/^(\/|https?:\/\/)/i.test(src)) return true
    return '视频地址必须以 / 或 http(s):// 开头'
  }

  /** 校验文件体积, 超限提示并阻止上传 */
  const assertSize = (file: File, limitMB: number, label: string): boolean => {
    if (file.size > limitMB * 1024 * 1024) {
      ElMessage.warning(`${label}不能超过 ${limitMB}MB, 当前 ${(file.size / 1024 / 1024).toFixed(1)}MB`)
      return false
    }
    return true
  }

  const openFilePicker = (accept: string, onPick: (file: File) => void) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.style.display = 'none'
    input.onchange = () => {
      const file = input.files?.[0]
      if (file) onPick(file)
      input.remove()
    }
    document.body.appendChild(input)
    input.click()
  }

  /** 图片上传: 走统一文件上传接口, 返回预览地址 */
  const uploadImage = async (file: File, insertFn: InsertImageFn) => {
    if (!assertSize(file, props.imageSizeLimitMB, '图片')) return
    uploading.value = true
    try {
      const row = await fileUpload(file)
      insertFn(withMediaAuth(`/api/file/preview/${row.id}`), row.originalName || file.name, '')
      ElMessage.success('图片上传成功')
    } catch (error) {
      ElMessage.error(error instanceof Error ? error.message : '图片上传失败')
      // 交由 wangEditor 统一处理失败流程
      throw error
    } finally {
      uploading.value = false
      refreshMediaAuth()
    }
  }

  /** 视频上传: 走统一文件上传接口, 返回流式播放地址(后端支持 Range) */
  const uploadVideo = async (file: File, insertFn: InsertVideoFn) => {
    if (!assertSize(file, props.videoSizeLimitMB, '视频')) return
    uploading.value = true
    try {
      const row = await fileUpload(file)
      insertFn(withMediaAuth(`/api/file/video/${row.id}`), '')
      ElMessage.success('视频上传成功')
    } catch (error) {
      ElMessage.error(error instanceof Error ? error.message : '视频上传失败')
      throw error
    } finally {
      uploading.value = false
      refreshMediaAuth()
    }
  }

  const editorConfig: Partial<IEditorConfig> = {
    placeholder: props.placeholder,
    scroll: false,
    MENU_CONF: {}
  }

  const menuConf = editorConfig.MENU_CONF as Record<string, unknown>

  menuConf.uploadImage = {
    // 指定服务端地址(仅用于体积校验前的占位, 实际上传走 customUpload)
    server: API_FILE_UPLOAD,
    // 自定义上传: 复用统一请求封装(自动带 Authorization 与刷新逻辑)
    customUpload: (file: File, insertFn: InsertImageFn) => uploadImage(file, insertFn),
    // 自定义选择文件, 保证只会走"选择文件上传"这一条路径
    customBrowseAndUpload: (insertFn: InsertImageFn) => {
      openFilePicker('image/*', (file) => {
        void uploadImage(file, insertFn)
      })
    },
    allowedFileTypes: ['image/*'],
    maxFileSize: props.imageSizeLimitMB * 1024 * 1024
  }

  menuConf.uploadVideo = {
    server: API_FILE_UPLOAD,
    customUpload: (file: File, insertFn: InsertVideoFn) => uploadVideo(file, insertFn),
    customBrowseAndUpload: (insertFn: InsertVideoFn) => {
      openFilePicker('video/*', (file) => {
        void uploadVideo(file, insertFn)
      })
    },
    allowedFileTypes: ['video/*'],
    maxFileSize: props.videoSizeLimitMB * 1024 * 1024
  }

  menuConf.insertImage = { checkImage: checkImageUrl }
  menuConf.editImage = { checkImage: checkImageUrl }
  menuConf.insertVideo = { checkVideo: checkVideoUrl }
  menuConf.editVideo = { checkVideo: checkVideoUrl }

  /* ---------- 媒体鉴权预览(仅改 DOM, 不改数据) ---------- */
  const refreshMediaAuth = () => {
    applyMediaAuth(editorBoxRef.value)
  }

  /**
   * 点击工具栏时自动聚焦编辑器并恢复选区
   *
   * wangEditor 的图片/视频等菜单在 `editor.selection == null` 时会被判定为禁用(按钮变灰不可点),
   * 而编辑器刚渲染、或输入框失焦后正处于该状态。点击工具栏时先聚焦并恢复/初始化选区,
   * 这些按钮即可正常点击; 若编辑器本就聚焦(选区仍在), 则不做任何干预, 避免游标被重置。
   */
  const handleToolbarMousedown = () => {
    const editor = editorRef.value
    if (!editor || editor.isDisabled()) return
    // 已有选区时 restoreSelection 是空操作; 没有时用最近一次选区兜底
    editor.restoreSelection()
    if (editor.selection == null) {
      // 从未聚焦过时没有可恢复的选区, 显式把游标放到文首
      editor.select({ anchor: { path: [0], offset: 0 }, focus: { path: [0], offset: 0 } })
    }
    editor.focus()
    // 立即刷新工具栏按钮的禁用态(否则要等下一次 onChange 才变亮)
    editor.updateView()
  }

  let mediaObserver: MutationObserver | null = null

  const handleCreated = (editor: IDomEditor) => {
    editorRef.value = editor
    // 启用只读
    if (props.disabled) editor.disable()
    // 图片/视频节点插入后立即补 token, 保证编辑器内可见
    mediaObserver = new MutationObserver(() => refreshMediaAuth())
    mediaObserver.observe(editorBoxRef.value as Node, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src']
    })
    refreshMediaAuth()
  }

  const handleChange = (editor: IDomEditor) => {
    // 入库内容始终为干净地址
    const clean = stripMediaAuthInHtml(editor.getHtml())
    lastEmitted = clean
    emit('update:modelValue', clean)
    emit('change', clean)
    refreshMediaAuth()
  }

  const syncFromProp = () => {
    const editor = editorRef.value
    if (!editor) return
    const incoming = props.modelValue ?? ''
    // 与最近一次提交一致时跳过, 避免 setHtml 重置光标与撤销栈
    if (incoming === lastEmitted) return
    const current = stripMediaAuthInHtml(editor.getHtml())
    if (incoming === current) return
    editor.setHtml(incoming)
    lastEmitted = incoming
    refreshMediaAuth()
  }

  watch(() => props.modelValue, syncFromProp)
  watch(
    () => props.disabled,
    (disabled) => {
      const editor = editorRef.value
      if (!editor) return
      if (disabled) editor.disable()
      else editor.enable()
    }
  )

  onBeforeUnmount(() => {
    mediaObserver?.disconnect()
    mediaObserver = null
    editorRef.value?.destroy()
    editorRef.value = undefined
  })

  /** 清空内容 */
  const clear = () => {
    const editor = editorRef.value
    if (!editor) return
    editor.clear()
    handleChange(editor)
  }

  /** 聚焦 */
  const focus = () => editorRef.value?.focus()

  defineExpose({ clear, focus, editor: editorRef })
</script>

<template>
  <div
    ref="editorBoxRef"
    v-loading="uploading"
    class="wang-editor"
    :class="{ 'is-resizable': resizable }"
    :style="editorStyle"
  >
    <Toolbar
      class="wang-editor__toolbar"
      :editor="editorRef"
      :default-config="toolbarConfig"
      :mode="mode"
      @mousedown="handleToolbarMousedown"
    />
    <Editor
      class="wang-editor__body"
      :style="bodyStyle"
      :model-value="modelValue"
      :default-config="editorConfig"
      :mode="mode"
      @on-created="handleCreated"
      @on-change="handleChange"
    />
  </div>
</template>

<style lang="less" scoped>
  .wang-editor {
    position: relative;
    display: flex;
    flex-direction: column;
    // 默认高度由 props.height 决定(内联样式), 该值作为兜底
    min-height: 220px;
    overflow: hidden;
    border: 1px solid var(--el-border-color);
    border-radius: 8px;

    /* 允许拖动右下角调整整体高度(编辑区随之变化) */
    &.is-resizable {
      resize: vertical;
    }

    &__toolbar {
      flex: 0 0 auto;
      border-bottom: 1px solid var(--el-border-color-lighter);
    }

    /* 编辑区占满剩余高度; resize: vertical 时由用户在该区域拖动调整整体高度 */
    &__body {
      flex: 1 1 auto;
      min-height: 0;
      height: 100%;
    }
  }
</style>
