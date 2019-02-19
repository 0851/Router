# Router 
> - Router in Browser >= IE8
> - 没有采用编译 
> - 没有任何依赖
> - 简单

### usage
```js

/**
 * 路由实例
 * @constructor
 * @param setting <object>
 *     setting.hash <bool> default true
 *     setting.debug <bool> default false
 *     setting.dom <element> default document
 *
 * router = new Router(setting)
 */
var router = new Router({
    debug: true
});

/**
 * 注册路由处理过程 , 路由更改后触发
 * @param path 正则语法
 * @param middleware 匹配路径后执行方法
 * @param level 触发middleware的顺序执行,等级越高,越后执行
 * 
 * router.use: function (path, middleware, level)
 */

router.use('/aaa', function (path,query) {
    console.log('aaa')
});
router.use(/d/, function (path,query) {
    console.log('dd')
});
router.use(/^\/a/, function (path,query) {
    console.log('a no hash start')
});
router.use(/^\/b/, function (path,query) {
    console.log('b no hash start')
});

/**
 * 启动路由
 * router.start: function ()
 */
router.start();

/**
 * 跳转路径
 * @param path
 * @param isReplace
 * router.go: function (path, isReplace)
 */
router.go('/index')

/**
 * 给指定的element 元素添加跳转劫持
 * @param dom
 * router.attach: function (dom)
 */
router.attach(document.querySelector('#id'));

/**
 * 回退历史记录
 * router.back: function()
 */
router.back()


/**
 * 销毁路由
 * router.destroy: function ()
 */
router.destroy();

```

