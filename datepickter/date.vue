<template>
  <div v-click-outside>
    <input type="text" :value="formater">
    <div v-if="isVisibile">
      <p>左 右</p>
      <div>
        <!-- {{visibedays}} -->
        <!-- i从1开始 -->
        <div v-for="i in 6" :key="i">
          <span v-for="k in 7" :key="k"
           class="cell">
            {{visibedays[(i-1)*7+(k-1)].getDate()}}
          </span>
        </div>
      </div>
      <p>返回今天</p>
    </div>
  </div>
</template>
<script>
  import * as utils from './utils.js';
  export default {
    data() {
      return {
        isVisibile: false
      }
    },
    props: {
      value: {
        type: Date,
        default: () => new Date()
      }
    },
    computed: {
      visibedays() {
        let {
          year,
          month
        } = utils.getDayMD(new Date())
        let currentFirstDay = utils.getDate(year, month, 1) // dangqian
        let week = currentFirstDay.getDay()
        let startDay = currentFirstDay - week * 60 * 60 * 1000 * 24
        let arr = []
        for (let i = 0; i < 42; i++) {
          arr.push(new Date(startDay + i * 3600000 * 24))
        }
        return arr
      },
      formater() {
        let {
          year,
          month,
          day
        } = utils.getDayMD(new Date())
        return `${year}-${month}-${day}`
      }
    },
    directives: {
      clickOutside: {
        bind(el, bindings, vnode) {
          let handle = (e) => {
            if (el.contains(e.target)) {
              if (!vnode.context.isVisibile) {
                vnode.context.focus1()
              }
            } else {
              if (vnode.context.isVisibile) {
                vnode.context.blues()
              }
            }
          }
          el.handle = handle
          document.addEventListener('click', handle)
        },
        unbind(el) {
          document.removeEventListener('click', el.handle)
        }
      }
    },
    methods: {
      focus1() {
        this.isVisibile = true
      },
      blues() {
        this.isVisibile = false
      }
    },
  }
</script>
<style>
  .cell {
    display: inline-flex;
    width: 32px;
    height: 32px;
    justify-content: center;
    align-items: center
  }
  .cell:hover {
    background-color: green;
    color: #fff;
    cursor: pointer;
    border-radius: 50%;
  }
</style>