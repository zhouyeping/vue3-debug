import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'

// 显式列出可访问文件，无需安装额外依赖。
const routes = {
  '/advanced/': [new URL('./advanced/index.html', import.meta.url), 'text/html; charset=utf-8'],
  '/advanced/main.js': [new URL('./advanced/main.js', import.meta.url), 'text/javascript; charset=utf-8'],
  '/vue-full.js': [new URL('../node_modules/vue/dist/vue.esm-browser.js', import.meta.url), 'text/javascript; charset=utf-8'],
  '/': [new URL('./index.html', import.meta.url), 'text/html; charset=utf-8'],
  '/main.js': [new URL('./main.js', import.meta.url), 'text/javascript; charset=utf-8'],
  '/vue.js': [new URL('../node_modules/vue/dist/vue.runtime.esm-browser.js', import.meta.url), 'text/javascript; charset=utf-8'],
}

createServer(async (req, res) => {
  const route = routes[new URL(req.url, 'http://localhost').pathname]
  if (!route) {
    res.writeHead(404).end('Not found')
    return
  }
  try {
    const content = await readFile(route[0])
    res.writeHead(200, { 'Content-Type': route[1], 'Cache-Control': 'no-store' })
    res.end(content)
  } catch (error) {
    console.error(error)
    res.writeHead(500).end('Failed to read example file')
  }
}).listen(5174, '127.0.0.1', () => {
  console.log('组件调试示例：http://127.0.0.1:5174')
})
