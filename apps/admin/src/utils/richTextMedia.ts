/**
 * 富文本内嵌媒体(图片/视频)的鉴权辅助 —— 纯函数层(不依赖 store, 可单独测试)
 *
 * 背景:
 * - 服务端 /file/preview/{id}、/file/video/{id} 需要 accessToken;
 * - <img src> / <video src> 由浏览器直接发起请求, 无法携带 Authorization 请求头;
 * - 因此展示与编辑预览时把当前 accessToken 追加到查询串(后端媒体接口允许从 token 参数读取),
 *   而**入库内容始终保持干净 URL**, 由展示组件在渲染时注入, 避免把会过期的 token 写进数据库。
 *
 * 当前 accessToken 由调用方传入(组件内使用 @/utils/richTextAuth 取 pinia 中的值),
 * 未显式传入时本模块不追加任何参数, 保证纯函数行为可预测、可测试。
 */

/** 需要携带鉴权参数的媒体接口前缀(仅站内文件接口, 外部图片不做改动) */
const MEDIA_AUTH_PATTERNS = [/^\/api\/file\/preview\//, /^\/api\/file\/video\//]

/** 媒体鉴权查询参数名(后端 AuthSupport 同步读取该参数) */
const TOKEN_PARAM = 'token'

/** 是否为需要鉴权的站内媒体地址 */
export const isAuthedMediaUrl = (url: string): boolean => {
  if (!url) return false
  return MEDIA_AUTH_PATTERNS.some((pattern) => pattern.test(url))
}

/** 为单个媒体地址补充鉴权参数(非站内媒体或未传 token 时原样返回) */
export const withMediaAuth = (url: string, token = ''): string => {
  if (!url || !token || !isAuthedMediaUrl(url)) return url
  if (new RegExp(`[?&]${TOKEN_PARAM}=`).test(url)) return url
  return `${url}${url.includes('?') ? '&' : '?'}${TOKEN_PARAM}=${encodeURIComponent(token)}`
}

/** 去掉地址中的鉴权参数(用于剥离 token 后再入库/展示) */
export const stripMediaAuth = (url: string): string => {
  if (!url || url.indexOf(TOKEN_PARAM) < 0) return url
  return url
    // token 非首个参数时连同其前面的分隔符一起删除, 避免残留 "&&"
    .replace(new RegExp(`&${TOKEN_PARAM}=[^&#]*(?=&|#|$)`, 'g'), '')
    .replace(new RegExp(`([?&])${TOKEN_PARAM}=[^&#]*(?=&|#|$)`, 'g'), '$1')
    .replace(/[?&](?=#|$)/g, '')
    .replace(/\?&/g, '?')
    .replace(/&&/g, '&')
}

/**
 * 对 HTML 片段中的媒体地址做统一处理
 *
 * @param html   原始 HTML
 * @param mapper 地址映射(注入或剥离)
 */
const mapMediaSrc = (html: string, mapper: (url: string) => string): string => {
  if (!html) return ''
  return html.replace(
    /(<(?:img|video)\b[^>]*?\ssrc=")([^"]*)(")/gi,
    (_match, prefix: string, url: string, suffix: string) => `${prefix}${mapper(url)}${suffix}`
  )
}

/** HTML → 追加鉴权参数(展示/编辑预览用) */
export const injectMediaAuth = (html: string, token = ''): string =>
  mapMediaSrc(html, (url) => withMediaAuth(url, token))

/** HTML → 剥离鉴权参数(写接口/入库用) */
export const stripMediaAuthInHtml = (html: string): string =>
  mapMediaSrc(html, (url) => stripMediaAuth(url))

/**
 * 就地修正 DOM 中的媒体地址(供编辑器/展示组件实时渲染使用)
 *
 * 仅改动 DOM 属性, 不写入编辑器数据模型, 因此不会污染内容、也不会影响撤销栈。
 *
 * @param root  容器元素
 * @param token 当前 accessToken(为空则不处理)
 */
export const applyMediaAuthInDom = (root: Element | null | undefined, token = ''): void => {
  if (!root || !token) return
  const nodes = root.querySelectorAll('img[src], video[src], video source[src]')
  nodes.forEach((node) => {
    const current = node.getAttribute('src')
    if (!current || !isAuthedMediaUrl(current)) return
    const next = withMediaAuth(current, token)
    if (next !== current) node.setAttribute('src', next)
  })
}
