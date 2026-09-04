import type { RouteMeta } from 'vue-router'
import type { SysMenuNode } from '@/api/login/types'

/**
 * 将后端菜单树(/auth/menus 返回的目录/菜单, 已过滤按钮)转换为
 * 前端 ElementAdmin 动态路由所需的路由记录:
 *
 * - 目录(type=1): 顶层为 Layout 容器(component '#'), 更深层为无组件分组('##');
 * - 菜单(type=2): 叶子页面, component 为前端视图路径(如 views/system/user/index);
 * - 子路由 path 按父路由前缀裁剪为相对路径(vue-router 嵌套要求);
 * - 容器自动补 redirect 指向其第一个叶子页, 避免直接访问空 Layout。
 */

/** 由完整绝对路径生成稳定且唯一的路由 name(如 /system/user -> SystemUser) */
const routeNameFromPath = (path: string | null | undefined, fallback: number): string => {
  const segments = (path ?? '').split('/').filter(Boolean)
  const pascal = segments
    .map((seg) => `${seg.charAt(0).toUpperCase()}${seg.slice(1)}`)
    .join('')
  return pascal || `Menu${fallback}`
}

/** 父路由前缀裁剪: /system/user 相对 /system => user; 顶层(父路径为空)必须保留绝对路径 */
const toRelativePath = (path: string | null | undefined, parentPath: string): string => {
  const abs = path ?? ''
  // 顶层路由直接返回带 '/' 的绝对路径(vue-router 顶层 path 必须以 '/' 开头)
  if (!parentPath) return abs
  let relative = abs.startsWith(parentPath) ? abs.slice(parentPath.length) : abs
  if (!relative) relative = abs.split('/').filter(Boolean).pop() ?? ''
  return relative.replace(/^\/+/, '')
}

/** 求容器第一个可见叶子的绝对路径(用于 redirect) */
const firstLeafPath = (node: SysMenuNode): string => {
  const children = node.children ?? []
  if (!children.length) return node.path ?? ''
  return firstLeafPath(children[0])
}

const convertNode = (
  node: SysMenuNode,
  parentPath: string,
  depth: number,
  fallbackId: number
): AppCustomRouteRecordRaw | null => {
  // 仅目录/菜单参与路由(按钮不出现在路由中)
  if (node.menuType !== 1 && node.menuType !== 2) return null
  if (node.status === 1) return null
  if (node.visible === 1) return null

  const children = (node.children ?? [])
    .map((child) => convertNode(child, node.path ?? '', depth + 1, child.id))
    .filter((child): child is AppCustomRouteRecordRaw => Boolean(child))
  const isLeaf = node.menuType === 2 && !children.length

  const meta: RouteMeta = {
    title: node.menuName,
    ...(node.icon ? { icon: node.icon } : {})
  }

  if (isLeaf) {
    return {
      path: toRelativePath(node.path, parentPath),
      name: routeNameFromPath(node.path, fallbackId),
      component: node.component || '##',
      meta
    }
  }

  // 容器(目录/含子路由的菜单)
  const absolute = node.path ?? ''
  const leafAbsPath = firstLeafPath(node)
  const fullAbs = leafAbsPath.startsWith('/') ? leafAbsPath : `${absolute}/${leafAbsPath}`
  return {
    path: toRelativePath(absolute, parentPath),
    name: routeNameFromPath(absolute, fallbackId),
    component: depth === 0 ? '#' : '##',
    ...(children.length ? { redirect: fullAbs } : {}),
    meta,
    children
  }
}

/** 后端菜单树 -> 前端动态路由记录列表 */
export const transformMenusToRoutes = (menus: SysMenuNode[]): AppCustomRouteRecordRaw[] => {
  const roots = (menus ?? []).filter(
    (node) => node && (node.menuType === 1 || node.menuType === 2) && node.status !== 1
  )
  return roots
    .map((node) => convertNode(node, '', 0, node.id))
    .filter((route): route is AppCustomRouteRecordRaw => Boolean(route))
}

export default transformMenusToRoutes
