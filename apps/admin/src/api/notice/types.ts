import type { PageResult } from '@/api/system/types'

/** 通知公告类型: 1通知 2公告 */
export type NoticeKind = 1 | 2

/** 发送范围: 1全部用户 2按角色 3按用户 */
export type NoticeTargetType = 1 | 2 | 3

/** 通知公告条目(与后端 SysNoticeVo 对齐; 列表接口不返回 content) */
export interface NoticeRow {
  id: number
  noticeType: NoticeKind
  title: string
  content?: string
  senderId?: number
  senderName?: string
  targetType?: NoticeTargetType
  targetDesc?: string
  /** 是否已读(我的接口): 0未读 1已读 */
  isRead?: number
  readTime?: string
  gmtCreated?: string
}

/** 我的通知公告分页查询 */
export interface NoticeMyQuery {
  current: number
  size: number
  /** 类型: 0/不传 全部, 1通知, 2公告 */
  type?: 0 | NoticeKind
  /** 已读: 不传 全部, 0未读, 1已读 */
  read?: 0 | 1
}

/** 发送入参 */
export interface NoticeSendPayload {
  noticeType: NoticeKind
  title: string
  content: string
  targetType: NoticeTargetType
  roleIds?: number[]
  userIds?: number[]
}

export type { PageResult }
