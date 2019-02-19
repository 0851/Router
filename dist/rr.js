(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(factory);
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root.Router = factory();
    }
}(this, function () {

    /**
     * 循环方法 from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach
     * @param arr
     * @param callback
     */
    function each(arr, callback) {

        var T, k;

        if (this == null) {
            throw new TypeError('this is null or not defined');
        }

        var O = Object(arr);

        var len = O.length >>> 0;

        if (typeof callback !== 'function') {
            throw new TypeError(callback + ' is not a function');
        }
        if (arguments.length > 1) {
            T = arguments[1];
        }

        k = 0;

        while (k < len) {

            var kValue;


            if (k in O) {

                kValue = O[k];

                callback.call(T, kValue, k, O);
            }
            k++;
        }
    }

    function hasOwnProperty(obj, prop) {
        return Object.prototype.hasOwnProperty.call(obj, prop);
    }

    function queryDecoder(qs, sep, eq, options) {
        sep = sep || '&';
        eq = eq || '=';
        var obj = {};

        if (typeof qs !== 'string' || qs.length === 0) {
            return obj;
        }

        var regexp = /\+/g;
        qs = qs.split(sep);

        var maxKeys = 1000;
        if (options && typeof options.maxKeys === 'number') {
            maxKeys = options.maxKeys;
        }

        var len = qs.length;
        // maxKeys <= 0 means that we should not limit keys count
        if (maxKeys > 0 && len > maxKeys) {
            len = maxKeys;
        }

        for (var i = 0; i < len; ++i) {
            var x = qs[i].replace(regexp, '%20'),
                idx = x.indexOf(eq),
                kstr, vstr, k, v;

            if (idx >= 0) {
                kstr = x.substr(0, idx);
                vstr = x.substr(idx + 1);
            } else {
                kstr = x;
                vstr = '';
            }

            k = decodeURIComponent(kstr);
            v = decodeURIComponent(vstr);

            if (!hasOwnProperty(obj, k)) {
                obj[k] = v;
            } else if (Array.isArray(obj[k])) {
                obj[k].push(v);
            } else {
                obj[k] = [obj[k], v];
            }
        }

        return obj;
    }

    /**
     * 判断类型
     * @param o
     * @param type
     * @returns {boolean}
     */
    function is(o, type) {
        var str = Object.prototype.toString.call(o);
        return new RegExp(type, 'i').test(str);
    }


    /**
     * matched  匹配到路由的执行方法
     * @param listeners
     * @param path
     */
    function onMatched(listeners, path) {
        var filters = [];
        var self = this;
        self.__inner.console.log(listeners, path, 'all listeners');
        each(listeners, function (listener) {
            if (listener.type === 'regexp'
                && listener.path.test(path) === true) {
                filters.push(listener);
            }
            if (listener.type === 'string'
                && listener.path === path) {
                filters.push(listener);
            }
        });
        filters.sort(function (a, b) {
            var al = parseInt(a.level) || 0;
            var bl = parseInt(b.level) || 0;
            if (al > bl) {
                return 1;
            }
            if (al < bl) {
                return -1;
            }
            return 0;
        });
        self.__inner.console.log(filters, path, 'filters listeners');
        each(filters, function (filter) {

            if (!is(filter.middleware, 'function')) {
                return
            }

            var paths = path.split('?');

            filter.middleware(paths[0], paths[1] ? queryDecoder(paths[1]) : {});

        });
    }

    /**
     * 路由改变时触发
     */
    function onPopstate(event) {
        if (event.state === null) {
            event.preventDefault();
            return false;
        }
        var self = this;
        var _location = window.location;

        self.__inner.console.log(arguments, 'onpopstate', _location);

        var listeners = self.__inner.listeners;
        var link = _location.pathname;

        onMatched.call(self, listeners, link);
    }

    /**
     * hash改变时触发
     */
    function onHashchange(event) {
        var self = this;
        var _location = window.location;

        self.__inner.console.log(arguments, 'onhashchange', _location);

        var listeners = self.__inner.listeners;
        var link = _location.hash.replace(/^#/, '');

        onMatched.call(self, listeners, link);
    }


    /**
     * 是否在单击时启用router跳转
     * @param e
     * @param isHash
     * @returns {boolean}
     */
    function enableGo(e, isHash) {
        if (!e) {
            return false
        }
        //组合键不执行
        if (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) {
            return false
        }
        //禁用了默认事件不执行
        if (e.defaultPrevented) {
            return false
        }
        //不是左键不执行
        if (e.button !== undefined && e.button !== 0) {
            return false
        }
        var target = e.target || e.srcElement;
        //_blank不执行,没有href不执行,#不执行
        var attributeTarget = target.getAttribute('target');
        var attributeHref = target.getAttribute('href');
        if (!attributeHref) {
            return false
        }
        if (/^#/.test(attributeHref) && isHash !== true) {
            return false
        }
        if (!/^#/.test(attributeHref) && isHash === true) {
            return false
        }
        if (/_blank/i.test(attributeTarget)) {
            return false
        }
        if (e.preventDefault) {
            e.preventDefault();
        }
        return true
    }

    /**
     * 全局附加单击事件
     * @param e
     */
    function onAttach(e) {
        var self = this;
        var target = e.target || e.srcElement;
        var attributeHref = target.getAttribute('href');
        var attributeReplace = target.getAttribute('replace');
        if (enableGo(e, self.__inner.isHash) !== true) {
            return
        }
        self.go(attributeHref, attributeReplace);
    }

    /**
     * 路由实例
     * @constructor
     * @param setting <object>
     *     setting.hash <bool>
     *     setting.debug <bool>
     *     setting.dom <element>
     */
    function Router(setting) {
        setting = is(setting, 'object') ? setting : {};
        var dom = is(setting.dom, 'html') ? setting.dom : document;
        var isHash = is(setting.hash, 'bool') ? setting.hash : true;
        var isDebugger = is(setting.debug, 'bool') ? setting.debug : false;
        var self = this;
        var _console = {
            warn: function () {
                self.__inner.isDebugger && console.warn.apply(null, arguments);
            },
            error: function () {
                self.__inner.isDebugger && console.error.apply(null, arguments);
            },
            info: function () {
                self.__inner.isDebugger && console.info.apply(null, arguments);
            },
            log: function () {
                self.__inner.isDebugger && console.log.apply(null, arguments);
            }
        };
        self.__inner = {
            listeners: [],
            isDebugger: !!isDebugger,
            isHash: !!isHash,
            onPopstate: function () {
                return onPopstate.apply(self, arguments)
            },
            onHashchange: function () {
                return onHashchange.apply(self, arguments)
            },
            onAttach: function () {
                return onAttach.apply(self, arguments)
            },
            console: _console,
            doms: [dom]
        };
        self.__inner.console.log('init success');
    }

    Router.prototype = {
        start: function () {
            var self = this;
            self.attach();
            self.__inner.console.log('attach event success');
        },
        /**
         * 注册路由处理过程 , 路由更改后触发
         * @param path 正则语法
         * @param middleware 匹配路径后执行方法
         * @param level 触发middleware的顺序执行,等级越高,越后执行
         */
        use: function (path, middleware, level) {

            var self = this;
            var index = -1;

            each(self.__inner.listeners, function (value, i) {
                if (value.middleware === middleware
                    && value.path === path
                    && value.level === level
                ) {
                    index = key;
                }
            });

            if (index >= 0) {
                return
            }

            var type = '';
            if (is(path, 'regexp')) {
                type = 'regexp'
            }
            if (is(path, 'string')) {
                type = 'string'
            }
            if (type === '') {
                return
            }

            self.__inner.listeners.push({
                path: path,
                middleware: middleware,
                level: level,
                type: type
            });

        },
        /**
         * 跳转路径
         * @param path
         * @param isReplace
         */
        go: function (path, isReplace) {
            var self = this;
            path = window.encodeURI(path);
            if (self.__inner.isHash === true) {
                window.location.hash = path;
                return
            }
            var state = {
                key: Date.now(),
                path: path
            };
            var popEvent = new PopStateEvent('popstate', {state: state});
            if (isReplace === true) {
                window.history.replaceState(state, '', path);
            } else {
                window.history.pushState(state, '', path);
            }
            dispatchEvent(popEvent);
        },
        /**
         * 回退历史记录
         */
        back: function () {
            window.history.go(-1);
        },
        /**
         *
         * @param dom
         */
        attach: function (dom) {
            var self = this;
            if (is(dom, 'html')) {
                self.__inner.doms.push(dom);
            }
            if (self.__inner.isHash !== true) {
                var initEvent = {
                    state: {
                        key: Date.now(),
                        path: window.location.pathname
                    }
                };
                self.__inner.onPopstate.call(this, initEvent);
                window.addEventListener("popstate", self.__inner.onPopstate);
            } else {
                self.__inner.onHashchange.call(this);
                window.addEventListener('hashchange', self.__inner.onHashchange)
            }
            each(self.__inner.doms, function (dom) {
                dom.addEventListener('click', self.__inner.onAttach, false);
            });
        },
        destroy: function () {
            var self = this;
            self.__inner.isHash !== true && window.removeEventListener('popstate', self.__inner.onPopstate);
            self.__inner.isHash === true && window.removeEventListener('hashchange', self.__inner.onHashchange);
            each(self.__inner.doms, function (dom) {
                dom.removeEventListener('click', self.__inner.onAttach, false);
            });
        }
    };

    return Router

}));
