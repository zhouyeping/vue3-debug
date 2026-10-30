import { reactive, effect } from '@vue/reactivity'

// 在 VS Code 中选择“调试数组响应式”，按 F5。
// 每个 debugger 都会暂停；在后面的操作行按 F11，可进入 Vue 实现。
debugger
const list = reactive([10, 20, 30])

// 1. 收集三类依赖。effect 注册时会立即执行一次。
effect(() => {
  console.log('[索引 0]', list[0])
})

effect(() => {
  console.log('[长度]', list.length)
})

effect(() => {
  // 展开运算符读取迭代器，收集 ARRAY_ITERATE_KEY 依赖。
  console.log('[遍历]', [...list])
})

console.log('\n--- 修改已有索引：索引 effect、遍历 effect 执行 ---')
debugger
list[0] = 100

console.log('\n--- push：长度 effect、遍历 effect 执行 ---')
// 留意 push 的包装函数、pauseTracking、startBatch/endBatch。
// 暂停收集依赖不会阻止触发更新。
debugger
list.push(40)

console.log('\n--- 缩短 length：长度 effect、遍历 effect 执行 ---')
// 索引 0 仍然存在，因此它对应的 effect 不执行。
debugger
list.length = 1

console.log('\n--- 清空：三个 effect 都执行，索引 0 变为 undefined ---')
debugger
list.length = 0

console.log('\n--- 已完成 ---')
