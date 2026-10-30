// 使用本地安装的 Vue 3.5.4 开发版，可单步进入可读的 Vue JS 实现。
import {
  createApp, defineComponent, ref, h, nextTick,
  onBeforeMount, onMounted, onBeforeUpdate, onUpdated,
  onBeforeUnmount, onUnmounted,
} from '/vue.js'

const status = document.querySelector('#status')
const updateButton = document.querySelector('#update')
const unmountButton = document.querySelector('#unmount')
let count

const Demo = defineComponent({
  name: 'LifecycleDemo',
  setup() {
    console.log('1. setup：创建状态、注册生命周期钩子')
    debugger
    count = ref(0)

    onBeforeMount(() => {
      console.log('2. beforeMount：首次渲染之前，组件 DOM 尚未挂载')
      debugger
    })
    onMounted(() => {
      console.log('4. mounted：组件 DOM 已挂载', document.querySelector('#count'))
      debugger
    })
    onBeforeUpdate(() => {
      console.log('5. beforeUpdate：状态已改变，DOM 尚未更新', document.querySelector('#count').textContent)
      debugger
    })
    onUpdated(() => {
      console.log('7. updated：DOM 已更新', document.querySelector('#count').textContent)
      debugger
    })
    onBeforeUnmount(() => {
      console.log('8. beforeUnmount：组件即将卸载，DOM 仍在')
      debugger
    })
    onUnmounted(() => {
      console.log('9. unmounted：组件已卸载', document.querySelector('#count'))
      debugger
    })

    // 初次挂载和状态更新都会调用此 render 函数。
    return () => {
      console.log('3 / 6. render：读取 count，生成新的 VNode', count.value)
      debugger
      return h('p', { id: 'count' }, `count = ${count.value}`)
    }
  },
})

console.log('开始：createApp → mount')
debugger
const app = createApp(Demo)
// 在这一行按 F11，跟进 mount → 创建组件实例 → setup → 渲染 effect → patch。
app.mount('#app')
status.textContent = '已挂载，可以更新或卸载'
updateButton.disabled = false
unmountButton.disabled = false

updateButton.addEventListener('click', async () => {
  console.log('操作：count.value++，触发组件更新任务入队')
  debugger
  count.value++
  // 组件更新通过调度队列异步执行，可在 beforeUpdate / render 中继续观察。
  await nextTick()
  console.log('nextTick：本轮组件 DOM 更新已完成')
})

unmountButton.addEventListener('click', async () => {
  console.log('操作：app.unmount()')
  debugger
  app.unmount()
  updateButton.disabled = true
  unmountButton.disabled = true
  await nextTick()
  status.textContent = '已卸载，刷新页面重新开始'
})
