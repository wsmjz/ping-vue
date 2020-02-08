class Dep {
    constructor() {
        this.subs = []
    }
    // 订阅
    addSub(watcher) {
        this.subs.push(watcher)
    }
    // 发布
    notify() { // 通知
        this.subs.forEach(watcher => watcher.update())
    }
}
// 观察者模式
class Watcher {
    constructor(vm, expr, cb) { // this.$watch(vm, expr, (newValue) => {})
        this.vm = vm
        this.expr = expr
        this.cb = cb
        this.oldValue = this.get()
    }
    get() {
        Dep.target = this // !!!!!!!!!!!!!!!!!!!!!!  先把自己放到this上
        //  取值 把这个观察者 和数据关联起来
        let value = CompileUtil.getVal(this.expr, this.vm)
        Dep.target = null // 不取消 任何值取值都会添加watcher
        return value
    }
    update() {
        let newValue = CompileUtil.getVal(this.expr, this.vm)
        if(newValue != this.oldValue) {
            this.cb(newValue)
        }
    }
}
class Observe { // 变成一个defineProperty对象
    constructor(data) {
        this.observe(data)
    }
    observe(data) {
        if(data && typeof data == 'object') {
            for(let key in data) {
                this.defineReactive(data, key, data[key])
            }
        }
    }
    defineReactive(data, key, value) {
        this.observe(value) // value 有可能是一个对象
        let dep = new Dep() // 给每一个属性 都加上一个具有发布订阅的功能  
        // 只对修改了的 执行 school: [watcher, watcher]  b: [watcher]
        Object.defineProperty(data, key, {
            get() {
                Dep.target && dep.addSub(Dep.target) // 穿件watcher实例时 会取到对应的内容，并且把watcher放到了全局上
                return value
            },
            set:(newValue) => {
                if(newValue != value) {
                    this.observe(newValue) // {school: {name: '张三'}} school = {} ？？？？？？都加上get set
                    value = newValue
                    dep.notify()
                }
            }
        })
    }
}

class Compiler {
    constructor(el, vm) {
        this.el = this.isElementNode(el)?el:document.querySelector(el)
        // 1.把当前节点中的元素 获取到 放到内存中
        this.vm = vm
        let fragment = this.node2fragment(this.el)
        // 2.把节点中的内容进行替换

        // 3.编译模板 数据编译
        this.compile(fragment)
        // 4.把内容再塞到页面中
        this.el.appendChild(fragment)
    }
    isDirective(attrName) {
        return attrName.startsWith('v-')
    }
    compileElement(node) {
        let attributes = node.attributes;
        [...attributes].forEach(attr => {
            let {name, value:expr} = attr
            if(this.isDirective(name)) { //v-model v-html v-bind
                let [, directive] = name.split('-')
                let [directiveName, eventName] = directive.split(':') // v-on:click
                console.log(node, '元素节点')
                CompileUtil[directiveName](node, expr, this.vm, eventName)
            }
        })
    }
    compileText(node) {
        let content = node.textContent // 第一层为空文本
        if(/\{\{(.+?)\}\}/.test(content)) {
            console.log(content, '文本节点')
            CompileUtil['text'](node, content, this.vm)
        }
    }
    compile(node) {
        let childNodes = node.childNodes;
        [...childNodes].forEach(child => {
            if(this.isElementNode(child)) {
                this.compileElement(child)
                this.compile(child)
            } else {
                this.compileText(child)
            }
        });
    }
    node2fragment(node) { // 把节点移动到内存中
        let fragment = document.createDocumentFragment() // 创建一个文档碎片
        let firstChild
        while (firstChild = node.firstChild) { // 不停拿第一个
            fragment.appendChild(firstChild) // appendChild具有移动性
        }
        return fragment
    }
    isElementNode(node) {
        return node.nodeType == 1
    }
}

CompileUtil = {
    getVal(expr, vm) { // expr 'school.name'
        return expr.split('.').reduce((data, current) => { // vm.$data就是data current是当前项  data[current] 会作为下一次形参上的data
            return data[current]
        }, vm.$data)
    },
    setValue(vm, expr, value) { // 'school.name' = '新值' 1.vm.$data.school 2.vm.$data.school.name
        expr.split('.').reduce((data, current, index, arr) => {
            if(index == arr.length - 1) { // 表达式取到最后一项时 赋值 （）
                return data[current] = value
            }
            return data[current]
        }, vm.$data)
    },
    model(node, expr, vm) { // expr 表达式
        let fn = this.updater['modelUpdater']
        let value = this.getVal(expr, vm)
        new Watcher(vm, expr, (newVal) => { // 给输入框加一个观察者， 数据更新会触发此方法 会拿新值给输入框赋值
            fn(node, newVal)
        })
        node.addEventListener('input', (e) => {
            let value = e.target.value
            this.setValue(vm, expr, value)
        })
        fn(node, value)
    },
    html(node, expr, vm) { // v-html="message"  expr => message
        let fn = this.updater['htmlUpdater']
        let value = this.getVal(expr, vm)
        new Watcher(vm, expr, (newVal) => {
            fn(node, newVal)
        })
        fn(node, value)
    },
    getContentVal(vm, expr) { // 表达式 将内容重新替换成一个完整的内容 返回
        return expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
            return this.getVal(args[1], vm)
        })
    },
    on(node, expr, vm, eventName) { // v-on:click="change"  expr => change
        node.addEventListener(eventName, (e) => {
            // vm[expr](e) this指向不明确
            vm[expr].call(vm, e) // this.change 需代理
        })
    },
    text(node, expr, vm) { // expr => {{a}} {{b}}
        let fn = this.updater['textUpdater']
        // 说明： / /区间  /{ => 转义{  g => 多次匹配
        let content = expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
            // 给表达式 每个{{}} 都加上观察者
            new Watcher(vm, args[1], (newVal) => {
                fn(node, this.getContentVal(vm, expr)) // 返回一个全的字符串
            })
            return this.getVal(args[1], vm)
        })
        fn(node, content)
    },
    updater: {
        htmlUpdater(node, value) {
            node.innerHTML = value
        },
        modelUpdater(node, value) {
            node.value = value
        },
        textUpdater(node, value) {
            node.textContent = value
        }
    },
}

class Vue {
    constructor(options) {
        this.$el = options.el
        this.$data = options.data
        let computed = options.computed
        let methods= options.methods
        if(this.$el) {
            new Observe(this.$data)
            // {{getNewName}} reduce vm.$data.getNewName 所以下面应代理到 this.$data
            for(let key in computed) { // 有依赖关系 依赖一个变量（data）
                Object.defineProperty(this.$data, key, {
                    // get() {
                    //     return computed[key]()
                    // }
                    get: () => {
                        return computed[key].call(this) // 保证this 指向Vue实例
                    }
                })
            }
            for(let key in methods) {
                Object.defineProperty(this, key, {
                    get() {
                        return methods[key]
                    }
                })
            }
            // 代理 拦截  把数据获取操作 vm上的取值操作 都代理岛vm.$data
            this.proxyVm(this.$data)
            new Compiler(this.$el, this)
        }
    }
    proxyVm(data) {
        for(let key in data) { // school: {name: '张三'}
            Object.defineProperty(this, key, {
    // 相当于去this实例上的值(this.school) 的时候 返回return的是this.$data上的值(data就是传下来的this.$data)
                get() {
                    return data[key] // 进行了转化操作
                },
                set(newValue) { // 设置代理方法 vm.message = '<h3>修改了</h3>' 修改时
                    data[key] = newValue
                }
            })
        }
    }
}