/**
 * 富文本媒体鉴权的运行时桥接层
 *
 * 把 pinia 中的 accessToken 注入 utils/richTextMedia 的纯函数,
 * 组件只依赖本文件, 纯函数层因此可脱离 store 单独测试。
 */
import { useUserStoreWithOut } from '@/store/modules/user'
import {
  applyMediaAuthInDom,
  injectMediaAuth as injectMediaAuthWithToken,
  withMediaAuth as withMediaAuthToken
} from '@/utils/richTextMedia'

/** 读取当前 accessToken(未登录/异常返回空串, 调用方据此降级为不带 token) */
export const getAccessToken = (): string => {
  try {
    return useUserStoreWithOut().token || ''
  } catch {
    // pinia 尚未安装等极端场景下降级
    return ''
  }
}

/** 单个媒体地址追加当前 token */
export const withMediaAuth = (url: string): string => withMediaAuthToken(url, getAccessToken())

/** HTML 内媒体地址追加当前 token(展示用) */
export const injectMediaAuth = (html: string): string =>
  injectMediaAuthWithToken(html, getAccessToken())

/** 就地修正 DOM 中媒体地址的 token(编辑/展示容器实时渲染用) */
export const applyMediaAuth = (root: Element | null | undefined): void => {
  applyMediaAuthInDom(root, getAccessToken())
}
