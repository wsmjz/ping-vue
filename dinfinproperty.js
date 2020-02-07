function observe(obj) {
    Object.defineProperty(obj, 'name', {
        get() {
            return obj.name
        },
        set(newValue) {
            updata()
        }
    })
}
function updata() {
    console.log('视图更新了')
}
let obj = {
    name: 'zhangsan'
}
observe(obj)
obj.name = 'wangwu'