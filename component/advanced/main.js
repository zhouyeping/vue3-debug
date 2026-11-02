// 使用完整版开发构建：浏览器会把下面的 template 编译为 render 函数。
// 所以 v-for、v-if、slot 都走真实的模板编译与运行时路径。
import {
  createApp, defineComponent, ref, computed, watch, watchEffect,
  nextTick, onMounted, onBeforeMount, onBeforeUpdate, onUpdated,
  onBeforeUnmount, onUnmounted, onRenderTracked, onRenderTriggered,
  provide, inject, useAttrs,
} from '/vue-full.js'

let sequence = 0
function trace(label, detail = '') {
  const message = `${++sequence}. ${label} ${detail}`
  console.log(message)
  const panel = document.querySelector('#logs')
  panel.textContent += `${message}\n`
  panel.scrollTop = panel.scrollHeight
  // 日志使用普通 DOM，不引入额外的 Vue 响应式依赖。
  if (document.querySelector('#pause-hooks').checked) debugger
}
document.querySelector('#clear-log').onclick = () => {
  document.querySelector('#logs').textContent = ''
}

function lifecycle(name) {
  trace(`${name} setup`)
  onBeforeMount(() => trace(`${name} beforeMount`))
  onMounted(() => trace(`${name} mounted`))
  onBeforeUpdate(() => trace(`${name} beforeUpdate`))
  onUpdated(() => trace(`${name} updated`))
  onBeforeUnmount(() => trace(`${name} beforeUnmount`))
  onUnmounted(() => trace(`${name} unmounted`))
  // 开发模式调试钩子：不读取 target 的属性，避免日志自己收集依赖。
  onRenderTracked(e => trace(`${name} renderTracked`, `${e.type} ${String(e.key)}`))
  onRenderTriggered(e => trace(`${name} renderTriggered`, `${e.type} ${String(e.key)}`))
}

let instanceId = 0
const themeKey = Symbol('debug-theme')
const InjectLeaf = defineComponent({
  name: 'InjectLeaf',
  setup() {
    // 注入的是父组件提供的同一个 ref，模板中会自动解包。
    const theme = inject(themeKey)
    const fallback = inject('missing-debug-key', '未提供时的默认值')
    watch(theme, (value, old) => trace('Leaf inject watch', `${old} → ${value}`))
    return { theme, fallback }
  },
  template: `<p id="injected-theme">孙组件 inject：{{ theme }}；{{ fallback }}</p>`,
})
const ItemRow = defineComponent({
  name: 'ItemRow',
  props: { item: { type: Object, required: true } },
  setup(props) {
    const serial = ++instanceId
    lifecycle(`Row#${serial}`)
    // 只用初始 props 初始化一次：用于观察 key 对组件实例复用的影响。
    const draft = ref(`草稿 ${props.item.id}`)
    watch(() => props.item.id, (value, old) => {
      trace(`Row#${serial} props.id watch`, `${old} → ${value}`)
    })
    return { serial, draft }
  },
  template: `
    <li :data-id="item.id">
      <b>{{ item.id }} / {{ item.label }}</b>
      <small>（组件实例 #{{ serial }}）</small>
      <input v-model="draft" aria-label="行内草稿">
    </li>
  `,
})

const ChildPanel = defineComponent({
  name: 'ChildPanel',
  inheritAttrs: false,
  props: {
    title: String,
    count: Number,
    modelValue: String,
    items: { type: Array, required: true },
    useIndexKey: Boolean,
  },
  emits: ['increment', 'update:modelValue'],
  components: { ItemRow, InjectLeaf },
  setup(props, { emit, expose }) {
    lifecycle('Child')
    const localClicks = ref(0)
    const attrs = useAttrs()
    // attrs 会随父组件更新，但不是可 watch 的响应式对象；在更新钩子读取。
    onUpdated(() => trace('Child attrs 更新后', `data-note=${attrs['data-note']}; class=${attrs.class}`))
    const doubled = computed(() => {
      trace('Child computed 求值', `count=${props.count}`)
      return props.count * 2
    })
    watch(() => props.count, (value, old, onCleanup) => {
      trace('Child watch(props.count) pre', `${old} → ${value}`)
      onCleanup(() => trace('Child watch 清理', `上轮 count=${value}`))
    })
    // 子组件只发事件，父组件负责修改自己的数据。
    function increment() {
      if (document.querySelector('#pause-actions').checked) debugger
      localClicks.value++
      emit('increment')
    }
    function inspectComputed() {
      trace('computed 连续读取两次', `${doubled.value} / ${doubled.value}`)
    }
    expose({ report: () => `子组件本地点击次数=${localClicks.value}`, inspectComputed })
    return { localClicks, doubled, increment }
  },
  template: `
    <article v-bind="$attrs">
      <header><slot name="header" :count="count">header 后备内容</slot></header>
      <h3>{{ title }}</h3>
      <p>props.count={{ count }}；computed={{ doubled }}；子组件本地次数={{ localClicks }}</p>
      <p>attrs.data-note={{ $attrs['data-note'] }}（显式透传到 article）</p>
      <InjectLeaf />
      <button @click="increment">子 emit → 父 count++</button>
      <label>组件 v-model：
        <input :value="modelValue" @input="$emit('update:modelValue', $event.target.value)">
      </label>
      <div><slot :count="count" :doubled="doubled">默认插槽后备内容</slot></div>
      <ul>
        <ItemRow v-for="(item, index) in items" :key="useIndexKey ? index : item.id" :item="item" />
      </ul>
      <footer><slot name="footer">footer 后备内容：父组件没有传 footer 插槽</slot></footer>
    </article>
  `,
})

const App = defineComponent({
  name: 'DebugApp',
  components: { ChildPanel },
  setup() {
    lifecycle('Parent')
    const count = ref(0)
    const title = ref('父组件传来的标题')
    const message = ref('hello')
    const showChild = ref(true)
    const visible = ref(true)
    const childKey = ref(0)
    const child = ref(null)
    const messageInput = ref(null)
    const theme = ref('浅色')
    const attrNote = ref('初始附加属性')
    provide(themeKey, theme)
    watch(child, value => trace('父组件模板 ref 变化', value ? '已设置，可调用 report' : 'null：已卸载'), { flush: 'post' })
    const useIndexKey = ref(false)
    const items = ref([
      { id: 'A', label: '苹果' }, { id: 'B', label: '香蕉' },
      { id: 'C', label: '橙子' }, { id: 'D', label: '葡萄' },
    ])
    let nextId = 1

    // 同一状态上观察三种 flush 时机；默认 pre/post 会合并同步多次修改。
    watch(count, (v, old) => trace('Parent watch sync', `${old} → ${v}`), { flush: 'sync' })
    watch(count, (v, old) => trace('Parent watch pre', `${old} → ${v}`))
    watch(count, (v, old) => {
      trace('Parent watch post / 当前 DOM', `${old} → ${v}; ${document.querySelector('#parent-count').textContent}`)
    }, { flush: 'post' })
    watchEffect(onCleanup => {
      const snapshot = message.value
      trace('Parent watchEffect', `message=${snapshot}`)
      onCleanup(() => trace('Parent watchEffect 清理', `上轮 message=${snapshot}`))
    })

    async function act(label, mutate) {
      trace(`操作开始：${label}`)
      if (document.querySelector('#pause-actions').checked) debugger
      // F11 进入 mutate，然后跟进具体赋值。异步更新可在钩子或 flushJobs 处断住。
      mutate()
      trace('同步操作结束 / 此时 DOM', document.querySelector('#parent-count').textContent)
      await nextTick()
      trace('nextTick / 本轮 DOM', document.querySelector('#parent-count').textContent)
    }
    const actions = {
      addCount: () => act('父 count++ → 子 props 更新', () => { count.value++ }),
      batch: () => act('同步连续三次 count++', () => { count.value++; count.value++; count.value++ }),
      rename: () => act('修改标题', () => { title.value += '！' }),
      changeMessage: () => act('修改 v-model / watchEffect', () => { message.value += '!' }),
      reorder: () => act('重排 [A,B,C,D] → [D,B,A,C]（初始列表时）', () => {
        const [a, b, c, d, ...rest] = items.value
        if (d) items.value = [d, b, a, c, ...rest]
      }),
      append: () => act('追加新 key', () => { items.value.push({ id: `N${nextId++}`, label: '新项目' }) }),
      remove: () => act('删除第二项', () => { items.value.splice(1, 1) }),
      editItem: () => act('修改第一项内容，保留 key', () => { if (items.value[0]) items.value[0].label += '！' }),
      toggleKeyMode: () => act('切换 id / index key（切换本身会重建行）', () => { useIndexKey.value = !useIndexKey.value }),
      toggleChild: () => act('v-if 挂载 / 卸载子树', () => { showChild.value = !showChild.value }),
      toggleVisible: () => act('v-show 仅切换显示', () => { visible.value = !visible.value }),
      replaceChild: () => act('同类型组件改变 key → 销毁并重建', () => { childKey.value++ }),
      inspectRef: () => trace('父通过模板 ref 访问 expose', child.value?.report() ?? '子组件尚未挂载'),
      inspectComputed: () => child.value ? child.value.inspectComputed() : trace('computed', '请先挂载子组件'),
      changeTheme: () => act('修改 provide 的 ref → 孙组件 inject 更新', () => { theme.value = theme.value === '浅色' ? '深色' : '浅色' }),
      changeAttrs: () => act('修改未声明为 prop 的 attrs', () => { attrNote.value += '！' }),
      focusInput: async () => {
        await nextTick()
        messageInput.value.focus()
        trace('DOM ref', `tag=${messageInput.value.tagName}; value=${messageInput.value.value}`)
      },
    }
    return { count, title, message, showChild, visible, childKey, child, messageInput, theme, attrNote, useIndexKey, items, ...actions }
  },
  template: `
    <section class="controls">
      <p id="parent-count">父 count={{ count }}</p>
      <p>父 message={{ message }}；key 模式={{ useIndexKey ? 'index' : 'item.id' }}</p>
      <button @click="addCount">1. 父更新 props</button>
      <button @click="batch">2. 同步更新三次</button>
      <button @click="rename">3. 更新标题 / 插槽</button>
      <button @click="changeMessage">4. 更新 message</button>
      <br>
      <button @click="reorder">5. 重排列表</button>
      <button @click="append">6. 追加</button>
      <button @click="remove">7. 删除第二项</button>
      <button @click="editItem">8. 修改内容</button>
      <button @click="toggleKeyMode">9. 切换 key 模式</button>
      <br>
      <button @click="toggleChild">10. v-if 切换</button>
      <button @click="toggleVisible">11. v-show 切换</button>
      <button @click="replaceChild">12. 改变子组件 key</button>
      <button @click="inspectRef">13. ref / expose</button>
      <br>
      <button @click="inspectComputed">14. 连读 computed / 缓存</button>
      <button @click="changeTheme">15. provide / inject</button>
      <button @click="changeAttrs">16. 更新 attrs</button>
      <button @click="focusInput">17. DOM ref 聚焦</button>
      <p>父 provide theme={{ theme }}</p>
      <label>父 DOM ref：<input ref="messageInput" v-model="message" aria-label="父 DOM ref 输入框"></label>
    </section>
    <ChildPanel v-if="showChild" v-show="visible" ref="child" :key="childKey"
      :title="title" :count="count" :items="items" :use-index-key="useIndexKey"
      v-model="message" @increment="count++" class="child-attrs" :data-note="attrNote">
      <template #header="{ count: childCount }">
        <strong>具名作用域插槽 header：{{ title }} / 子传回 count={{ childCount }}</strong>
      </template>
      <template #default="{ count: childCount, doubled }">
        <p>默认作用域插槽：父 message={{ message }}；子 count={{ childCount }} / doubled={{ doubled }}</p>
      </template>
    </ChildPanel>
    <p v-else>v-if=false：子组件已卸载，再点按钮重新挂载。</p>
  `,
})

// 在这里打断点，可以从模板编译、组件实例创建一路跟到 DOM 挂载。
debugger
createApp(App).mount('#app')
