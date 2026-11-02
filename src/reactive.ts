import { reactive, readonly, shallowReactive, shallowReadonly } from "vue";

const state = reactive({
  count: 0,
  user: {
    name: 'Tom',
    age: 18,
  }
});

state.user.name

state.user.name = 'Jerry'

