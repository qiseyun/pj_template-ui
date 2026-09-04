/**
 * 图标选择器可选用图标清单(按用途分类)
 * value 必须与 src/icons.ts 中已注册的图标键一致(别名或 mdi:*), 否则无法渲染。
 */
export interface MenuIconCategory {
  /** 分类名 */
  label: string
  /** 图标键集合 */
  values: string[]
}

export const MENU_ICON_CATEGORIES: MenuIconCategory[] = [
  {
    label: '常用',
    values: [
      'dashboard',
      'home',
      'setting',
      'system',
      'users',
      'user',
      'role',
      'permission',
      'menu',
      'notice',
      'announcement',
      'bell',
      'bell-outline',
      'bell-ring',
      'history',
      'inbox',
      'send',
      'profile'
    ]
  },
  {
    label: '账号与安全',
    values: [
      'mdi:account-outline',
      'mdi:account-circle',
      'mdi:account-cog-outline',
      'mdi:account-supervisor-outline',
      'mdi:shield-lock-outline',
      'mdi:shield-account-outline',
      'lock',
      'key',
      'mdi:key-variant',
      'mdi:account-key-outline'
    ]
  },
  {
    label: '文件与数据',
    values: [
      'folder',
      'folder-outline',
      'folder-open-outline',
      'mdi:folder-multiple-outline',
      'mdi:file-outline',
      'mdi:file-download-outline',
      'mdi:file-document-outline',
      'mdi:file-tree',
      'mdi:clipboard-text-outline',
      'mdi:content-copy',
      'mdi:database',
      'mdi:table',
      'mdi:finance',
      'mdi:chart-line',
      'mdi:chart-bar',
      'mdi:cloud-outline'
    ]
  },
  {
    label: '状态与操作',
    values: [
      'mdi:check-circle',
      'mdi:check-circle-outline',
      'mdi:clipboard-check-outline',
      'mdi:alarm',
      'mdi:alarm-check',
      'mdi:bell-check',
      'mdi:information-outline',
      'mdi:eye-outline',
      'mdi:filter-outline',
      'mdi:plus-circle-outline',
      'mdi:reload',
      'mdi:sync',
      'mdi:close'
    ]
  },
  {
    label: '通信与媒体',
    values: [
      'mdi:email-outline',
      'mdi:phone-outline',
      'mdi:message-text',
      'mdi:headset',
      'mdi:link-variant',
      'mdi:paperclip',
      'mdi:open-in-new',
      'mdi:download',
      'mdi:upload',
      'mdi:image-outline',
      'mdi:note-outline'
    ]
  },
  {
    label: '界面与设备',
    values: [
      'mdi:desktop-classic',
      'mdi:laptop',
      'mdi:keyboard',
      'mdi:view-grid-outline',
      'mdi:view-list-outline',
      'mdi:web',
      'mdi:code-tags',
      'mdi:tools',
      'mdi:wrench',
      'mdi:printer-outline',
      'mdi:cart'
    ]
  },
  {
    label: '业务与杂项',
    values: [
      'mdi:bank',
      'mdi:briefcase-outline',
      'mdi:bookmark-outline',
      'mdi:calendar',
      'mdi:calendar-check',
      'mdi:gift',
      'mdi:heart',
      'mdi:star-outline',
      'mdi:map-marker-outline',
      'mdi:tag-outline',
      'mdi:translate',
      'mdi:currency-cny',
      'mdi:help-circle',
      'clipboard'
    ]
  }
]

/** 全部图标值(去重) */
export const ALL_ICON_VALUES: string[] = Array.from(
  new Set(MENU_ICON_CATEGORIES.flatMap((category) => category.values))
)

/** 图标可读名称(由键名推导, 供提示/搜索) */
export const humanizeIcon = (value: string): string =>
  value.replace(/^mdi:/, '').split('-').join(' ')
