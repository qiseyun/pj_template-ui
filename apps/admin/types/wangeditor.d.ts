/**
 * 补齐 @wangeditor/editor-for-vue 的类型声明
 *
 * 该包 package.json 的 exports 未暴露 types 字段, 在 moduleResolution: bundler 下
 * TypeScript 无法解析其自带 d.ts, 故在此按组件契约手动声明(Vue3 版组件)。
 */
declare module '@wangeditor/editor-for-vue' {
  import type { DefineComponent } from 'vue'

  /** 编辑器组件: 传入 editorRef(shallowRef) 与 defaultConfig */
  export const Editor: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  /** 工具栏组件: 传入 editorRef 与 defaultConfig */
  export const Toolbar: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
}

export {}
