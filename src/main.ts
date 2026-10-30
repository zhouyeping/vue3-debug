import { ref, effect } from '@vue/reactivity'

const a = ref(1)

// 先执行一次，让 inner 已经拥有 a 对应的 Link
const inner = effect(() => {
  console.log('inner', a.value)
})
