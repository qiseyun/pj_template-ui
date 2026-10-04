<script setup lang="ts">
  /**
   * 通用富文本展示组件
   *
   * - 渲染入库的 HTML 正文;
   * - 内嵌的站内图片/视频会在渲染后自动补上当前 accessToken(浏览器直接请求无法带请求头);
   * - 提供统一的正文排版样式(标题/列表/引用/代码块/表格/媒体)。
   */
  import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
  import { applyMediaAuth, injectMediaAuth } from '@/utils/richTextAuth'

  const props = withDefaults(
    defineProps<{
      /** 富文本 HTML */
      content?: string
      /** 最小高度(px), 0 表示自适应 */
      minHeight?: number
      /** 空内容占位文案 */
      emptyText?: string
    }>(),
    {
      content: '',
      minHeight: 0,
      emptyText: '暂无内容'
    }
  )

  const rootRef = ref<HTMLDivElement>()

  /** 渲染前先注入鉴权参数, 减少一次"先 401 再刷新"的闪烁 */
  const html = computed(() => injectMediaAuth(props.content ?? ''))

  const isEmpty = computed(() => {
    const raw = (props.content ?? '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()
    return !raw && !/<(img|video)\b/i.test(props.content ?? '')
  })

  /** 渲染后校正媒体地址: 覆盖 token 过期后重新渲染、异步插入等场景 */
  const refreshMediaAuth = () => {
    applyMediaAuth(rootRef.value)
  }

  let mediaObserver: MutationObserver | null = null

  onMounted(() => {
    mediaObserver = new MutationObserver(() => refreshMediaAuth())
    mediaObserver.observe(rootRef.value as Node, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src']
    })
    void nextTick(refreshMediaAuth)
  })

  onBeforeUnmount(() => {
    mediaObserver?.disconnect()
    mediaObserver = null
  })

  watch(
    () => props.content,
    () => {
      void nextTick(refreshMediaAuth)
    }
  )
</script>

<template>
  <div
    ref="rootRef"
    class="rich-text-viewer"
    :class="{ 'is-empty': isEmpty }"
    :style="minHeight ? { minHeight: `${minHeight}px` } : undefined"
  >
    <template v-if="!isEmpty">
      <!-- eslint-disable-next-line vue/no-v-html -- 内容由可信后台录入, 展示端仅渲染 -->
      <div class="rich-text-viewer__inner" v-html="html"></div>
    </template>
    <div v-else class="rich-text-viewer__empty">{{ emptyText }}</div>
  </div>
</template>

<style lang="less" scoped>
  .rich-text-viewer {
    font-size: 14px;
    line-height: 1.9;
    color: var(--el-text-color-primary);
    overflow-wrap: break-word;
    word-break: break-word;

    &__empty {
      padding: 12px 0;
      font-size: 13px;
      color: var(--el-text-color-placeholder);
    }

    &__inner {
      :deep(h1),
      :deep(h2),
      :deep(h3),
      :deep(h4) {
        margin: 18px 0 10px;
        font-weight: 700;
        line-height: 1.4;
      }

      :deep(h1) {
        font-size: 20px;
      }

      :deep(h2) {
        font-size: 18px;
      }

      :deep(h3) {
        font-size: 16px;
      }

      :deep(p) {
        margin: 0 0 10px;
      }

      :deep(ul),
      :deep(ol) {
        padding-left: 24px;
        margin: 8px 0;
      }

      :deep(li) {
        margin: 2px 0;
      }

      /* 任务列表(wangEditor todo) */
      :deep(ul[data-w-e-type='todo']) {
        padding-left: 4px;
        list-style: none;
      }

      :deep(blockquote) {
        padding: 6px 14px;
        margin: 10px 0;
        color: var(--el-text-color-secondary);
        background: var(--el-fill-color-light);
        border-left: 3px solid var(--el-color-primary);
      }

      :deep(pre) {
        padding: 10px 14px;
        margin: 10px 0;
        overflow: auto;
        font-family: Consolas, Monaco, monospace;
        font-size: 13px;
        background: var(--el-fill-color-light);
        border-radius: 6px;
      }

      :deep(code) {
        padding: 1px 5px;
        font-family: Consolas, Monaco, monospace;
        font-size: 13px;
        background: var(--el-fill-color-light);
        border-radius: 4px;
      }

      :deep(pre code) {
        padding: 0;
        background: transparent;
      }

      :deep(a) {
        color: var(--el-color-primary);
      }

      :deep(img) {
        max-width: 100%;
        height: auto;
        border-radius: 6px;
      }

      :deep(video) {
        max-width: 100%;
        border-radius: 6px;
      }

      :deep(table) {
        width: 100%;
        margin: 10px 0;
        border-collapse: collapse;

        th,
        td {
          padding: 6px 10px;
          border: 1px solid var(--el-border-color);
        }

        th {
          font-weight: 600;
          background: var(--el-fill-color-light);
        }
      }

      :deep(hr) {
        margin: 16px 0;
        border: 0;
        border-top: 1px solid var(--el-border-color-lighter);
      }
    }
  }
</style>
