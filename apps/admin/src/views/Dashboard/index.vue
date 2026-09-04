<script setup lang="ts">
  import { computed } from 'vue'
  import { useUserStore } from '@/store/modules/user'

  const userStore = useUserStore()

  const greeting = computed(() => {
    const hour = new Date().getHours()
    if (hour < 6) return '夜深了'
    if (hour < 12) return '上午好'
    if (hour < 14) return '中午好'
    if (hour < 18) return '下午好'
    return '晚上好'
  })

  const features = [
    {
      icon: 'users',
      title: '用户管理',
      desc: '账号的增删改查、启停用与角色分配，实现最小化账号治理。',
      path: '/system/user'
    },
    {
      icon: 'role',
      title: '角色管理',
      desc: '角色信息维护与菜单权限(目录/菜单/按钮)的按角色授权。',
      path: '/system/role'
    },
    {
      icon: 'menu',
      title: '菜单管理',
      desc: '维护目录、菜单与按钮三级权限树，驱动前端动态路由生成。',
      path: '/system/menu'
    }
  ]
</script>

<template>
  <div class="dashboard-page">
    <section class="welcome-card">
      <div class="welcome-copy">
        <p class="welcome-kicker">WORKSPACE / 控制台</p>
        <h2>{{ greeting }}，{{ userStore.userInfo?.nickname || userStore.userInfo?.username || '访客' }}</h2>
        <p class="welcome-text">
          当前为前后端适配版管理端：登录鉴权(双 Token)、动态路由与按钮权限均由后端
          <code>pj_template</code> 下发。菜单与权限由「系统管理」维护。
        </p>
      </div>
      <div class="welcome-badge">
        <span class="badge-dot"></span>
        RBAC
      </div>
    </section>

    <section class="feature-grid">
      <div
        v-for="item in features"
        :key="item.path"
        class="feature-card"
        @click="userStore.userInfo && $router.push(item.path)"
      >
        <div class="feature-icon"><Icon :icon="item.icon" :size="26" /></div>
        <h3>{{ item.title }}</h3>
        <p>{{ item.desc }}</p>
        <span class="feature-link">前往管理 →</span>
      </div>
    </section>
  </div>
</template>

<style lang="less" scoped>
  .dashboard-page {
    display: flex;
    flex-direction: column;
    gap: 20px;

    .welcome-card {
      position: relative;
      display: flex;
      overflow: hidden;
      padding: 34px 38px;
      color: #fff;
      background:
        radial-gradient(circle at 88% 20%, rgb(64 164 255 / 22%), transparent 34%),
        radial-gradient(circle at 12% 110%, rgb(223 42 167 / 16%), transparent 40%),
        linear-gradient(135deg, #12203e 0%, #1b2f55 58%, #203a66 100%);
      border-radius: 18px;
      box-shadow: 0 18px 44px rgb(18 32 62 / 18%);
      justify-content: space-between;
      align-items: center;

      &::after {
        position: absolute;
        inset: 0;
        background-image:
          linear-gradient(rgb(255 255 255 / 5%) 1px, transparent 1px),
          linear-gradient(90deg, rgb(255 255 255 / 5%) 1px, transparent 1px);
        background-size: 26px 26px;
        content: '';
        mask-image: linear-gradient(90deg, #000, transparent 78%);
        pointer-events: none;
      }
    }

    .welcome-copy {
      position: relative;
      z-index: 1;

      .welcome-kicker {
        margin: 0 0 10px;
        font-family: SFMono-Regular, Consolas, monospace;
        font-size: 11px;
        letter-spacing: 0.22em;
        color: rgb(214 231 255 / 62%);
      }

      h2 {
        margin: 0 0 12px;
        font-size: 26px;
        font-weight: 720;
        letter-spacing: 0.01em;
      }

      .welcome-text {
        max-width: 680px;
        margin: 0;
        font-size: 13.5px;
        line-height: 1.8;
        color: rgb(222 234 255 / 74%);

        code {
          padding: 1px 6px;
          font-family: SFMono-Regular, Consolas, monospace;
          font-size: 12px;
          color: #a9e1ff;
          background: rgb(255 255 255 / 10%);
          border-radius: 6px;
        }
      }
    }

    .welcome-badge {
      position: relative;
      z-index: 1;
      display: flex;
      gap: 8px;
      align-items: center;
      flex: none;
      padding: 9px 16px;
      font-family: SFMono-Regular, Consolas, monospace;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.12em;
      background: rgb(255 255 255 / 9%);
      border: 1px solid rgb(255 255 255 / 14%);
      border-radius: 999px;
      backdrop-filter: blur(8px);

      .badge-dot {
        width: 7px;
        height: 7px;
        background: #3ad29a;
        border-radius: 50%;
        box-shadow: 0 0 0 4px rgb(58 210 154 / 18%);
      }
    }
  }

  .feature-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;

    .feature-card {
      padding: 24px 24px 20px;
      background: var(--el-bg-color);
      border: 1px solid var(--el-border-color-lighter);
      border-radius: 16px;
      box-shadow: var(--el-box-shadow-lighter);
      cursor: pointer;
      transition:
        transform 180ms ease,
        box-shadow 180ms ease,
        border-color 180ms ease;

      &:hover {
        border-color: var(--el-color-primary-light-5);
        box-shadow: var(--el-box-shadow);
        transform: translateY(-3px);

        .feature-link {
          color: var(--el-color-primary);
        }
      }

      .feature-icon {
        display: grid;
        width: 48px;
        height: 48px;
        margin-bottom: 16px;
        color: var(--el-color-primary);
        background: var(--el-color-primary-light-9);
        border-radius: 14px;
        place-items: center;
      }

      h3 {
        margin: 0 0 8px;
        font-size: 16px;
        font-weight: 680;
      }

      p {
        min-height: 42px;
        margin: 0 0 14px;
        font-size: 12.5px;
        line-height: 1.7;
        color: var(--el-text-color-secondary);
      }

      .feature-link {
        font-size: 12.5px;
        font-weight: 600;
        color: var(--el-text-color-regular);
        transition: color 180ms ease;
      }
    }
  }

  @media (width <= 900px) {
    .feature-grid {
      grid-template-columns: 1fr;
    }

    .welcome-badge {
      display: none;
    }
  }
</style>
