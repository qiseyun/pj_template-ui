import account from '@iconify-icons/mdi/account'
import accountGroup from '@iconify-icons/mdi/account-group'
import accountKeyOutline from '@iconify-icons/mdi/account-key-outline'
import accountSupervisorOutline from '@iconify-icons/mdi/account-supervisor-outline'
import apps from '@iconify-icons/mdi/apps'
import cardAccountDetailsOutline from '@iconify-icons/mdi/card-account-details-outline'
import cart from '@iconify-icons/mdi/cart'
import check from '@iconify-icons/mdi/check'
import chevronDoubleLeft from '@iconify-icons/mdi/chevron-double-left'
import chevronDoubleRight from '@iconify-icons/mdi/chevron-double-right'
import clipboardTextOutline from '@iconify-icons/mdi/clipboard-text-outline'
import close from '@iconify-icons/mdi/close'
import cogOutline from '@iconify-icons/mdi/cog-outline'
import currencyCny from '@iconify-icons/mdi/currency-cny'
import dotsHorizontal from '@iconify-icons/mdi/dots-horizontal'
import fileDocumentOutline from '@iconify-icons/mdi/file-document-outline'
import fileTree from '@iconify-icons/mdi/file-tree'
import folderOpenOutline from '@iconify-icons/mdi/folder-open-outline'
import folderOutline from '@iconify-icons/mdi/folder-outline'
import helpCircle from '@iconify-icons/mdi/help-circle'
import homeOutline from '@iconify-icons/mdi/home-outline'
import keyOutline from '@iconify-icons/mdi/key-outline'
import lockOutline from '@iconify-icons/mdi/lock-outline'
import menu from '@iconify-icons/mdi/menu'
import menuOpen from '@iconify-icons/mdi/menu-open'
import messageText from '@iconify-icons/mdi/message-text'
import minus from '@iconify-icons/mdi/minus'
import pageFirst from '@iconify-icons/mdi/page-first'
import pageLast from '@iconify-icons/mdi/page-last'
import reload from '@iconify-icons/mdi/reload'
import shieldAccountOutline from '@iconify-icons/mdi/shield-account-outline'
import sync from '@iconify-icons/mdi/sync'
import tagOutline from '@iconify-icons/mdi/tag-outline'
import translate from '@iconify-icons/mdi/translate'
import viewDashboard from '@iconify-icons/mdi/view-dashboard'
import viewListOutline from '@iconify-icons/mdi/view-list-outline'
import viewQuiltOutline from '@iconify-icons/mdi/view-quilt-outline'
import bell from '@iconify-icons/mdi/bell'
import bellOutline from '@iconify-icons/mdi/bell-outline'
import bellRing from '@iconify-icons/mdi/bell-ring'
import bullhornOutline from '@iconify-icons/mdi/bullhorn-outline'
import emailOpenOutline from '@iconify-icons/mdi/email-open-outline'
import history from '@iconify-icons/mdi/history'
import send from '@iconify-icons/mdi/send'
import inboxOutline from '@iconify-icons/mdi/inbox-outline'
import accountOutline from '@iconify-icons/mdi/account-outline'
import accountCogOutline from '@iconify-icons/mdi/account-cog-outline'
import accountCircle from '@iconify-icons/mdi/account-circle'
import alarm from '@iconify-icons/mdi/alarm'
import alarmCheck from '@iconify-icons/mdi/alarm-check'
import bank from '@iconify-icons/mdi/bank'
import bellCheck from '@iconify-icons/mdi/bell-check'
import bookmarkOutline from '@iconify-icons/mdi/bookmark-outline'
import briefcaseOutline from '@iconify-icons/mdi/briefcase-outline'
import calendar from '@iconify-icons/mdi/calendar'
import calendarCheck from '@iconify-icons/mdi/calendar-check'
import chartLine from '@iconify-icons/mdi/chart-line'
import chartBar from '@iconify-icons/mdi/chart-bar'
import checkCircle from '@iconify-icons/mdi/check-circle'
import checkCircleOutline from '@iconify-icons/mdi/check-circle-outline'
import clipboardCheckOutline from '@iconify-icons/mdi/clipboard-check-outline'
import clockOutline from '@iconify-icons/mdi/clock-outline'
import cloudOutline from '@iconify-icons/mdi/cloud-outline'
import codeTags from '@iconify-icons/mdi/code-tags'
import contentCopy from '@iconify-icons/mdi/content-copy'
import database from '@iconify-icons/mdi/database'
import desktopClassic from '@iconify-icons/mdi/desktop-classic'
import download from '@iconify-icons/mdi/download'
import emailOutline from '@iconify-icons/mdi/email-outline'
import eyeOutline from '@iconify-icons/mdi/eye-outline'
import fileDownloadOutline from '@iconify-icons/mdi/file-download-outline'
import fileOutline from '@iconify-icons/mdi/file-outline'
import filterOutline from '@iconify-icons/mdi/filter-outline'
import finance from '@iconify-icons/mdi/finance'
import folderMultipleOutline from '@iconify-icons/mdi/folder-multiple-outline'
import gift from '@iconify-icons/mdi/gift'
import headset from '@iconify-icons/mdi/headset'
import heart from '@iconify-icons/mdi/heart'
import imageOutline from '@iconify-icons/mdi/image-outline'
import informationOutline from '@iconify-icons/mdi/information-outline'
import keyboard from '@iconify-icons/mdi/keyboard'
import keyVariant from '@iconify-icons/mdi/key-variant'
import laptop from '@iconify-icons/mdi/laptop'
import linkVariant from '@iconify-icons/mdi/link-variant'
import magnify from '@iconify-icons/mdi/magnify'
import mapMarkerOutline from '@iconify-icons/mdi/map-marker-outline'
import noteOutline from '@iconify-icons/mdi/note-outline'
import openInNew from '@iconify-icons/mdi/open-in-new'
import paperclip from '@iconify-icons/mdi/paperclip'
import pencilOutline from '@iconify-icons/mdi/pencil-outline'
import phoneOutline from '@iconify-icons/mdi/phone-outline'
import plusCircleOutline from '@iconify-icons/mdi/plus-circle-outline'
import printerOutline from '@iconify-icons/mdi/printer-outline'
import shieldLockOutline from '@iconify-icons/mdi/shield-lock-outline'
import starOutline from '@iconify-icons/mdi/star-outline'
import tableIcon from '@iconify-icons/mdi/table'
import tools from '@iconify-icons/mdi/tools'
import upload from '@iconify-icons/mdi/upload'
import viewGridOutline from '@iconify-icons/mdi/view-grid-outline'
import web from '@iconify-icons/mdi/web'
import wrench from '@iconify-icons/mdi/wrench'
import type { IconRegistry } from '@vea/components'

/**
 * 图标注册表:
 * - 键为 iconify 名(如 'mdi:view-dashboard'), 供菜单 meta.icon / Icon 组件按名解析;
 * - 另注册一组"简单别名"(如 'dashboard'/'user'/'role'/'menu'), 兼容后端菜单种子里的图标值,
 *   菜单管理中填写这些别名或 'mdi:xxx' 均可正常渲染。
 */
export const icons = {
  // iconify 标准键
  'mdi:account': account,
  'mdi:account-group': accountGroup,
  'mdi:account-key-outline': accountKeyOutline,
  'mdi:account-supervisor-outline': accountSupervisorOutline,
  'mdi:apps': apps,
  'mdi:card-account-details-outline': cardAccountDetailsOutline,
  'mdi:cart': cart,
  'mdi:check': check,
  'mdi:chevron-double-left': chevronDoubleLeft,
  'mdi:chevron-double-right': chevronDoubleRight,
  'mdi:clipboard-text-outline': clipboardTextOutline,
  'mdi:close': close,
  'mdi:cog-outline': cogOutline,
  'mdi:currency-cny': currencyCny,
  'mdi:dots-horizontal': dotsHorizontal,
  'mdi:file-document-outline': fileDocumentOutline,
  'mdi:file-tree': fileTree,
  'mdi:folder-open-outline': folderOpenOutline,
  'mdi:folder-outline': folderOutline,
  'mdi:help-circle': helpCircle,
  'mdi:home-outline': homeOutline,
  'mdi:key-outline': keyOutline,
  'mdi:lock-outline': lockOutline,
  'mdi:menu': menu,
  'mdi:menu-open': menuOpen,
  'mdi:message-text': messageText,
  'mdi:minus': minus,
  'mdi:page-first': pageFirst,
  'mdi:page-last': pageLast,
  'mdi:reload': reload,
  'mdi:shield-account-outline': shieldAccountOutline,
  'mdi:sync': sync,
  'mdi:tag-outline': tagOutline,
  'mdi:translate': translate,
  'mdi:view-dashboard': viewDashboard,
  'mdi:view-list-outline': viewListOutline,
  'mdi:view-quilt-outline': viewQuiltOutline,
  // 简单别名(后端菜单种子/日常录入用)
  dashboard: viewDashboard,
  home: homeOutline,
  setting: cogOutline,
  system: apps,
  user: account,
  users: accountGroup,
  role: shieldAccountOutline,
  permission: accountKeyOutline,
  menu: viewListOutline,
  lock: lockOutline,
  key: keyOutline,
  profile: cardAccountDetailsOutline,
  'card-account-details-outline': cardAccountDetailsOutline,
  clipboard: clipboardTextOutline,
  folder: folderOutline,
  'folder-outline': folderOutline,
  'folder-open-outline': folderOpenOutline,
  // 通知公告相关
  bell: bell,
  'bell-outline': bellOutline,
  'bell-ring': bellRing,
  'mdi:bell': bell,
  'mdi:bell-outline': bellOutline,
  'mdi:bell-ring': bellRing,
  'mdi:bullhorn-outline': bullhornOutline,
  notice: bellOutline,
  announcement: bullhornOutline,
  'mdi:email-open-outline': emailOpenOutline,
  send: send,
  'mdi:history': history,
  history: history,
  'mdi:inbox-outline': inboxOutline,
  inbox: inboxOutline,
  'mdi:account-outline': accountOutline,
  'mdi:account-cog-outline': accountCogOutline,
  'mdi:account-circle': accountCircle,
  'mdi:alarm': alarm,
  'mdi:alarm-check': alarmCheck,
  'mdi:bank': bank,
  'mdi:bell-check': bellCheck,
  'mdi:bookmark-outline': bookmarkOutline,
  'mdi:briefcase-outline': briefcaseOutline,
  'mdi:calendar': calendar,
  'mdi:calendar-check': calendarCheck,
  'mdi:chart-line': chartLine,
  'mdi:chart-bar': chartBar,
  'mdi:check-circle': checkCircle,
  'mdi:check-circle-outline': checkCircleOutline,
  'mdi:clipboard-check-outline': clipboardCheckOutline,
  'mdi:clock-outline': clockOutline,
  'mdi:cloud-outline': cloudOutline,
  'mdi:code-tags': codeTags,
  'mdi:content-copy': contentCopy,
  'mdi:database': database,
  'mdi:desktop-classic': desktopClassic,
  'mdi:download': download,
  'mdi:email-outline': emailOutline,
  'mdi:eye-outline': eyeOutline,
  'mdi:file-download-outline': fileDownloadOutline,
  'mdi:file-outline': fileOutline,
  'mdi:filter-outline': filterOutline,
  'mdi:finance': finance,
  'mdi:folder-multiple-outline': folderMultipleOutline,
  'mdi:gift': gift,
  'mdi:headset': headset,
  'mdi:heart': heart,
  'mdi:image-outline': imageOutline,
  'mdi:information-outline': informationOutline,
  'mdi:keyboard': keyboard,
  'mdi:key-variant': keyVariant,
  'mdi:laptop': laptop,
  'mdi:link-variant': linkVariant,
  'mdi:magnify': magnify,
  'mdi:map-marker-outline': mapMarkerOutline,
  'mdi:note-outline': noteOutline,
  'mdi:open-in-new': openInNew,
  'mdi:paperclip': paperclip,
  'mdi:pencil-outline': pencilOutline,
  'mdi:phone-outline': phoneOutline,
  'mdi:plus-circle-outline': plusCircleOutline,
  'mdi:printer-outline': printerOutline,
  'mdi:shield-lock-outline': shieldLockOutline,
  'mdi:star-outline': starOutline,
  'mdi:table': tableIcon,
  'mdi:tools': tools,
  'mdi:upload': upload,
  'mdi:view-grid-outline': viewGridOutline,
  'mdi:web': web,
  'mdi:wrench': wrench
} satisfies IconRegistry
