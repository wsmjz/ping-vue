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
            if(this.isDirective(name)) { //v-model v-html
                let [, directive] = name.split('-')
                console.log(node, '元素节点')
                CompileUtil[directive](node, expr, this.vm)
            }
        })
    }
    compileText(node) {
        let content = node.textContent // 第一层为空文本
        if(/\{\{(.+?)\}\}/.test(content)) {
            console.log(content, '文本节点')
            // CompileUtil['text'](node, content, this.vm)
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
    model(node, expr, vm) { // expr 表达式
        let fn = this.updater['modelUpdater']
        let value = this.getVal(expr, vm)
        fn(node, value)
    },
    text(node, expr, vm) { // expr => {{a}} {{b}}
        let fn = this.updater['textUpdater']
        // 说明： / /区间  /{ => 转义{  g => 多次匹配
        let content = expr.replace(/\{\{(.+?)\}\}/g, (...args) => {
            return this.getVal(vm, args[1])
        })
        fn(node, content)
    },
    updater: {
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
        if(this.$el) {
            new Compiler(this.$el, this)
        }
    }
}