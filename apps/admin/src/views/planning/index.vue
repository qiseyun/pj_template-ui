<script setup lang="ts">
  import { computed } from 'vue'
  import { useRoute } from 'vue-router'
  import ContentWrap from '@/components/ContentWrap/index.vue'

  const route = useRoute()
  const title = computed(() => {
    const t = route.meta?.title
    return typeof t === 'string' ? t : '规划中的功能'
  })
</script>

<template>
  <ContentWrap
    :title="title"
    message="该功能已列入模板规划, 尚未实现; 在对应 Wave 落地后替换为真实页面"
  >
    <div class="plan-empty">
      <div class="plan-badge">规划中</div>
      <p>「{{ title }}」正在规划/开发中</p>
      <p class="plan-sub">
        落地后请把本菜单的组件路径改为真实页面(views/...)，并在
        <span class="mono">docs/07-通用后台能力缺口与规划.md</span> 中更新状态。
      </p>
    </div>
  </ContentWrap>
</template>

<style lang="less" scoped>
  .plan-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 90px 20px;
    color: var(--el-text-color-secondary);
    background: var(--el-bg-color);
    border: 1px dashed var(--el-border-color);
    border-radius: 12px;
  }

  .plan-badge {
    padding: 4px 16px;
    font-size: 12px;
    color: #b45309;
    background: #fef3c7;
    border-radius: 999px;
  }

  .plan-sub {
    font-size: 12px;
  }

  .mono {
    font-family: SFMono-Regular, Consolas, monospace;
  }
</style>
