let _Vue = null

export default class VueRouter {
  static install (Vue) {
    // 1. 判断当前插件是否已被安装
    if (VueRouter.install.installed) {
      return
    }
    VueRouter.install.installed = true
    // 2. 把  Vue 构造函数记录到全局变量
    _Vue = Vue
    // 3. 把创建 Vue 实例时传入的 router 对象注入到 Vue 实例上
    _Vue.mixin({
      beforeCreate () {
        // 如果是 vue 实例，将 router 注入
        // 如果是 组件，就不注入
        if (this.$options.router) {
          _Vue.prototype.$router = this.$options.router
          this.$options.router.init()
        }
      }
    })
  }

  constructor (options) {
    this.options = options
    this.routeMap = {}
    this.data = _Vue.observable({
      current: '/'
    })
  }

  init () {
    this.createRouteMap()
    this.initComponents(_Vue)
    this.initEvent()
  }

  createRouteMap () {
    // 遍历所有的路由规则，把路由规则解析成键值对的形式，存储到 routeMap 中
    this.options.routes.forEach(route => {
      this.routeMap[route.path] = route.component
    })
  }

  initComponents (Vue) {
    Vue.component('router-link', {
      props: {
        to: String
      },
      // vue.config.js runtimeCompiler: true 切换到完整版本的 Vue
      // template: '<a :href="to"><slot></slot></a>'
      // 使用运行时版本的 Vue
      render (h) {
        return h('a', {
          attrs: {
            href: this.to
          },
          on: {
            click: this.clickHandler
          }
        }, [this.$slots.default]) // 添加默认插槽
      },
      methods: {
        clickHandler (e) {
          // 调用 pushState 修改地址栏地址
          history.pushState({}, '', this.to) // 第一个参数是触发 popstate 事件时传递给 popstate 的参数
          this.$router.data.current = this.to // data 是响应式的，data 发生变化，router-view 中的 component 也会变化
          e.preventDefault()
        }
      }
    })

    const self = this
    Vue.component('router-view', {
      render (h) {
        // 找到当前路由的地址
        // 根据当前的地址，在 routeMap 中找到对应组件
        const component = self.routeMap[self.data.current]
        return h(component)
      }
    })
  }

  initEvent () {
    // 点击浏览器前进后退按钮、history.back/forward 方法  =>  popstate
    window.addEventListener('popstate', () => {
      this.data.current = window.location.pathname
    })
  }
}
