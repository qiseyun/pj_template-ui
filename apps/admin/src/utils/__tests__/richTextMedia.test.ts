/**
 * richTextMedia 纯函数单元测试
 *
 * 运行方式(项目未内置测试运行器, 两种都可用):
 *   node --test apps/admin/src/utils/__tests__/richTextMedia.test.ts
 *   node apps/admin/src/utils/__tests__/richTextMedia.test.ts      # 直接执行打印结果
 *
 * 覆盖范围: 不依赖 pinia store 的纯逻辑(地址判定 / 追加与剥离 token / HTML 批量处理)。
 * 注意: 站内媒体地址以 /api/file/preview|video/ 开头, 与 @/api/system/file 保持一致。
 */
import assert from 'node:assert/strict'

import {
  applyMediaAuthInDom,
  injectMediaAuth,
  isAuthedMediaUrl,
  stripMediaAuth,
  stripMediaAuthInHtml,
  withMediaAuth
} from '../richTextMedia.ts'

const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjF9.abc-def_ghi'

interface Case {
  name: string
  run: () => void
}

const cases: Case[] = [
  {
    name: 'isAuthedMediaUrl 只认站内文件接口',
    run: () => {
      assert.equal(isAuthedMediaUrl('/api/file/preview/123'), true)
      assert.equal(isAuthedMediaUrl('/api/file/video/123'), true)
      assert.equal(isAuthedMediaUrl('/api/file/download/123'), false)
      assert.equal(isAuthedMediaUrl('https://cdn.example.com/a.png'), false)
      assert.equal(isAuthedMediaUrl(''), false)
    }
  },
  {
    name: 'withMediaAuth 追加 token 且不重复追加',
    run: () => {
      const once = withMediaAuth('/api/file/preview/1', TOKEN)
      assert.equal(once, `/api/file/preview/1?token=${TOKEN}`)
      assert.equal(withMediaAuth(once, TOKEN), once)
    }
  },
  {
    name: 'withMediaAuth 跳过外部地址与空 token',
    run: () => {
      assert.equal(withMediaAuth('https://example.com/a.png', TOKEN), 'https://example.com/a.png')
      assert.equal(withMediaAuth('/api/file/preview/1', ''), '/api/file/preview/1')
    }
  },
  {
    name: 'stripMediaAuth 还原干净地址(多参数/锚点/同名前缀)',
    run: () => {
      assert.equal(stripMediaAuth(`/api/file/preview/1?token=${TOKEN}`), '/api/file/preview/1')
      assert.equal(
        stripMediaAuth(`/api/file/preview/1?a=1&token=${TOKEN}&b=2`),
        '/api/file/preview/1?a=1&b=2'
      )
      assert.equal(stripMediaAuth(`/api/file/video/1?token=${TOKEN}#t=3`), '/api/file/video/1#t=3')
      assert.equal(stripMediaAuth('/api/file/preview/1'), '/api/file/preview/1')
      // token 位于中间/末尾/开头时的参数拼接
      assert.equal(stripMediaAuth(`/api/file/preview/1?a=1&token=${TOKEN}`), '/api/file/preview/1?a=1')
      assert.equal(
        stripMediaAuth(`/api/file/preview/1?token=${TOKEN}&a=1&b=2`),
        '/api/file/preview/1?a=1&b=2'
      )
      assert.equal(stripMediaAuth(`/api/file/preview/1?a=1&token=${TOKEN}#f`), '/api/file/preview/1?a=1#f')
      // 非 token 参数(如 tokenCount)不应被误删
      assert.equal(stripMediaAuth('/api/file/preview/1?tokenCount=3'), '/api/file/preview/1?tokenCount=3')
    }
  },
  {
    name: 'injectMediaAuth / stripMediaAuthInHtml 只处理 img 与 video 的 src',
    run: () => {
      const html =
        '<p>正文</p><img src="/api/file/preview/9" alt="a"><video src="/api/file/video/7"></video>' +
        '<a href="/api/file/preview/9?token=x">链接</a><img src="https://cdn.example.com/b.png">'

      const injected = injectMediaAuth(html, TOKEN)
      assert.ok(injected.includes(`<img src="/api/file/preview/9?token=${TOKEN}"`), '图片应注入 token')
      assert.ok(injected.includes(`<video src="/api/file/video/7?token=${TOKEN}"`), '视频应注入 token')
      assert.ok(injected.includes('src="https://cdn.example.com/b.png"'), '外链图片保持原样')
      assert.ok(injected.includes('href="/api/file/preview/9?token=x"'), '链接地址不应被改写')

      // 剥离后与原始内容完全一致(写库不残留 token)
      assert.equal(stripMediaAuthInHtml(injected), html)
    }
  },
  {
    name: 'applyMediaAuthInDom 就地修正媒体地址(不触碰外链与已带 token 的地址)',
    run: () => {
      interface FakeEl {
        attrs: Record<string, string>
        getAttribute(name: string): string | null
        setAttribute(name: string, value: string): void
      }
      const makeEl = (src: string): FakeEl => ({
        attrs: { src },
        getAttribute(name) {
          return this.attrs[name] ?? null
        },
        setAttribute(name, value) {
          this.attrs[name] = value
        }
      })
      const a = makeEl('/api/file/preview/1')
      const b = makeEl(`/api/file/video/2?token=${TOKEN}`)
      const c = makeEl('https://cdn.example.com/x.png')

      const root = {
        querySelectorAll: () => [a, b, c]
      } as unknown as Element

      applyMediaAuthInDom(root, TOKEN)
      assert.equal(a.attrs.src, `/api/file/preview/1?token=${TOKEN}`)
      assert.equal(b.attrs.src, `/api/file/video/2?token=${TOKEN}`)
      assert.equal(c.attrs.src, 'https://cdn.example.com/x.png')

      // 未传 token 时不做任何改动
      const d = makeEl('/api/file/preview/3')
      applyMediaAuthInDom({ querySelectorAll: () => [d] } as unknown as Element, '')
      assert.equal(d.attrs.src, '/api/file/preview/3')
    }
  },
  {
    name: '空内容不抛错',
    run: () => {
      assert.equal(stripMediaAuthInHtml(''), '')
      assert.equal(injectMediaAuth('', TOKEN), '')
    }
  }
]

let passed = 0
const failures: string[] = []

for (const item of cases) {
  try {
    item.run()
    passed += 1
    console.log(`ok   - ${item.name}`)
  } catch (error) {
    failures.push(item.name)
    console.log(`FAIL - ${item.name}`)
    console.log(`       ${error instanceof Error ? error.message : String(error)}`)
  }
}

console.log(`\n${passed}/${cases.length} passed`)

if (failures.length) {
  console.error(`failed: ${failures.join('; ')}`)
  process.exitCode = 1
}
