# Vue 3.5.4 综合调试示例

在项目根目录运行 `npm run component`，打开 http://127.0.0.1:5174/advanced/ 。
也可以选择 VS Code 的“调试组件综合示例”配置，按 F5。

## 调试开关

- “操作前暂停”默认开启。点击按钮后暂停，跟进 `mutate()` 进入赋值操作。
- “钩子 / watch / render 时暂停”默认关闭，避免初次挂载暂停太多次。勾选后在公共 `trace()` 中暂停，向上查看调用栈即可定位具体钩子。
- 观察初次挂载：在 `createApp(App).mount('#app')` 处设置断点并刷新；或在 HTML 中给第二个 checkbox 添加 `checked` 后刷新。
- 浏览器开发者工具：F8 继续、F10 单步跳过、F11 进入。VS Code：F5 继续。

## 推荐实验顺序

1. **初次挂载**：Parent setup → Parent beforeMount → Child setup → Child beforeMount → 行组件挂载 → Child mounted → Parent mounted。父 mounted 时子树已挂载。
2. **父更新 props**：父 count 变化 → 调度更新 → 父渲染 → 子 props 更新 → 子渲染 → DOM patch。注意父子生命周期和 watch 的实际日志顺序。
3. **同步三次修改**：sync watcher 会逐次运行；pre/post watcher 和组件任务会批处理。赋值后的同步日志与 nextTick 后日志可比较 DOM 时机。
4. **子 emit**：点击子组件按钮，看 emit 如何调用父监听器；子组件本地状态和父 count 都发生变化。
5. **v-model**：在子输入框输入，跟进 `update:modelValue` → 父 message → 新 modelValue prop。比较 watchEffect 的执行及上一轮清理。
6. **插槽**：修改标题、count 或 message，跟进 header/default 插槽。插槽内容访问父作用域；作用域插槽参数来自子组件的 `<slot>`。footer 演示后备内容。
7. **keyed diff**：刷新后直接重排，初始 `[A,B,C,D]` 变为 `[D,B,A,C]`。观察 `patchKeyedChildren` 中的 key 映射、`newIndexToOldIndexMap`、`getSequence()` 和 `move()`；同一 key 的行保留实例编号、草稿和 DOM。
8. **增删和内容更新**：分别追加、删除第二项、修改内容，比较 mount、unmount 和 patch；修改 label 不需要重建行。
9. **index key 对照**：刷新，先切换到 index key，再编辑行内草稿并重排。切换 key 模式本身会重建行；之后重排时实例按位置保留，草稿可能和业务数据错位。index key 仍然走 keyed diff，但 key 表达的是位置。
10. **v-if / v-show**：v-if 卸载并重新创建子树，局部状态重置、watch 清理；v-show 只调整 display，保留组件和状态。隐藏时仍可响应更新。
11. **改变组件 key**：类型相同但 key 不同，会销毁旧子树再创建新子树。父 count/message/items 保留，子局部状态重新初始化。
12. **ref / expose**：父组件读取子组件显式暴露的方法；v-if 卸载后 ref 为 null。挂载/更新后访问 DOM 或 ref 时注意 nextTick。
13. **计算属性缓存**：点按钮 14，连续读取两次 `doubled.value`；初次渲染已经求值，因此依赖不变时不会再次出现“Child computed 求值”。点按钮 1 改变 count，子组件下一次渲染读取 computed 时重新求值；再点 14 继续复用缓存。点按钮 3 修改无关标题也不会重新求值。可在 getter 中设置断点，比较依赖失效、重新读取和缓存命中。
14. **provide / inject**：点按钮 15，父组件修改提供的 `theme` ref，孙组件 `InjectLeaf` 直接读取注入值并更新，途中不需要声明或转发 theme prop。`inject` 返回同一个 ref；模板自动解包，JS 中用 `.value`。另一个未提供的 key 演示默认值。用 v-if 卸载再挂载，孙组件会重新注入父组件当前的值。
15. **attrs**：点按钮 16，观察子组件的 `$attrs['data-note']`、更新钩子日志和浏览器 Elements 中 article 的 `data-note`。`title/count` 是已声明 props，`increment` 是已声明事件，不属于 attrs；未声明的 `class/data-note` 属于 attrs。Child 使用 `inheritAttrs: false` 并在 article 上显式 `v-bind="$attrs"`。`useAttrs()` 返回的对象保持最新，但不是可通过 watch 订阅的响应式对象。
16. **DOM ref 与组件 ref**：按钮 17 在 nextTick 后通过 `messageInput.value` 聚焦父输入框并记录 DOM 信息；按钮 13 通过 `child.value` 调用 expose 方法。观察父组件模板 ref 日志：初次挂载后设置、v-if 卸载后为 null、重新挂载或改变 key 后指向新实例；v-show 隐藏仍保留引用。ref 是渲染器赋值的引用，不是 HTML 的 ref 属性。

## 源码断点

本示例实际加载 `node_modules/vue/dist/vue.esm-browser.js`，是包含编译器的开发版单文件构建；没有映射到本地 TS 源码。可在浏览器 Sources 中打开 `/vue-full.js`，搜索以下函数设置断点。

| 场景 | 函数 | 对照本地 Vue 源码 |
| --- | --- | --- |
| 模板编译 | compileToFunction | packages/vue/src/index.ts |
| 创建和挂载 | mountComponent / setupRenderEffect | packages/runtime-core/src/renderer.ts |
| setup | setupStatefulComponent | packages/runtime-core/src/component.ts |
| props | updateProps | packages/runtime-core/src/componentProps.ts |
| 插槽 | updateSlots / renderSlot | packages/runtime-core/src/componentSlots.ts、helpers/renderSlot.ts |
| 列表 render | renderList | packages/runtime-core/src/helpers/renderList.ts |
| 列表 diff | patchKeyedChildren / getSequence / move | packages/runtime-core/src/renderer.ts |
| 调度 | queueJob / flushJobs | packages/runtime-core/src/scheduler.ts |
| watch | doWatch / watch | packages/runtime-core/src/apiWatch.ts、packages/reactivity/src/watch.ts |
| computed | ComputedRefImpl.value getter / refreshComputed | packages/reactivity/src/computed.ts、effect.ts |
| provide / inject | provide / inject | packages/runtime-core/src/apiInject.ts |
| attrs | initProps / updateProps / setupContext.attrs / renderComponentRoot | packages/runtime-core/src/componentProps.ts、component.ts、componentRenderUtils.ts |
| 模板 ref / expose | setRef / getComponentPublicInstance / expose | packages/runtime-core/src/rendererTemplateRef.ts、component.ts |
| 事件 | emit | packages/runtime-core/src/componentEmits.ts |
| v-show | vShow | packages/runtime-dom/src/directives/vShow.ts |
| 卸载 | unmountComponent | packages/runtime-core/src/renderer.ts |

模板可能被编译器标记为稳定插槽，更新插槽不一定经过所有通用分支。观察实际调用栈，而不是假定每个分支每次都会执行。

此例聚焦常见组件流程；不包含 Router、KeepAlive、Teleport、Suspense、Transition、异步组件等后续场景。

已补充：计算属性、provide/inject、attrs、DOM refs 与组件 ref/expose（按钮 13–17）。
