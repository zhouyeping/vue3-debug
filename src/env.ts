/**
 * Vue 源码里的 `__DEV__` 是 rollup 构建时用 @rollup/plugin-replace
 * 注入的编译期常量，直接跑 TS 源码时并不存在。
 *
 * 这里在入口模块被求值之前，把它挂到 globalThis 上，
 * 使得源码中的裸标识符 `__DEV__` 能解析到全局属性。
 *
 * 必须通过 `node --import ./src/env.ts` 预加载，
 * 因为 ESM 的静态 import 会先于本文件体内的语句执行。
 */
;(globalThis as any).__DEV__ = true
;(globalThis as any).__TEST__ = false

export {}
