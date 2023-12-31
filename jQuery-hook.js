// ==UserScript==
// @name         jQuery Hook
// @namespace    https://github.com/JSREI/jQuery-hook
// @version      0.4
// @description  用于快速定位使用jQuery绑定到DOM元素上的事件的代码的真实位置，辅助逆向分析。
// @document     https://github.com/JSREI/jQuery-hook
// @author       CC11001100
// @match       *://*/*
// @run-at      document-start
// @grant       none
// ==/UserScript==
(() => {

    // 可自定义的一个变量前缀，尽量唯一有区分度即可，可以替换为为自己的ID
    const globalUniqPrefix = "cc11001100";

    // 用于控制打印在控制台的消息的大小
    const consoleLogFontSize = 12;

    // ----------------------------------------------- -----------------------------------------------------------------

    /**
     * 用于统一构建待颜色的日志输出，采用构建者模式
     *
     * from: https://github.com/JSREI/js-color-log
     */
    class ColorLogBuilder {

        /**
         * 创建一条日志，调用show()方法将其打印到控制台
         *
         * 因为认为字体颜色是没有区分度的，所以这里就不支持指定字体的颜色，字体恒定为黑色
         *
         * @param normalTextBackgroundColor {string} 此条日志中普通文本的背景色
         * @param highlightTextBackgroundColor {string} 此条日志中要高亮的文本的背景色
         * @param _consoleLogFontSize {string} 日志的大小
         */
        constructor(normalTextBackgroundColor = "#FFFFFF", highlightTextBackgroundColor = "#FFFFFF", _consoleLogFontSize = consoleLogFontSize) {
            this.normalTextBackgroundColor = normalTextBackgroundColor;
            this.highlightTextBackgroundColor = highlightTextBackgroundColor;
            this.consoleLogFontSize = _consoleLogFontSize;
            this.messageArray = [];

            // 每天日志都使用统一的前缀，在创建的时候就设置好
            // 先是一个日期，然后是插件的名字，以便与其它工具的输出相区分
            // 此处的统一前缀自行修改，因为使用的时候都是拷贝过去的
            this.append(`[${this.nowTimeString()}] `).append("jQuery Hook: ");
        }

        /**
         *  往日志中追加普通类型的信息
         *
         * @param msg {string}
         * @return {ColorLogBuilder}
         */
        append(msg) {
            this.appendNormal(msg);
            return this;
        }

        /**
         * 往日志中追加普通类型的信息
         *
         * @param msg {string}
         * @return {ColorLogBuilder}
         */
        appendNormal(msg) {
            this.messageArray.push(`color: black; background: ${this.normalTextBackgroundColor}; font-size: ${this.consoleLogFontSize}px;`);
            this.messageArray.push(msg);
            return this;
        }

        /**
         * 往日志中追加高亮的内容
         *
         * @param msg {string}
         */
        appendHighlight(msg) {
            this.messageArray.push(`color: black; background: ${this.highlightTextBackgroundColor}; font-size: ${this.consoleLogFontSize}px; font-weight: bold;`);
            this.messageArray.push(msg);
            return this;
        }

        /**
         * 把当前这条日志打印出来
         */
        show() {
            console.log(this.genFormatArray(this.messageArray), ...this.messageArray);
        }

        nowTimeString(fmt = "yyyy-MM-dd HH:mm:ss") {
            const now = new Date();
            let o = {
                "M+": now.getMonth() + 1, "d+": now.getDate(), //日
                "H+": now.getHours(), //小时
                "m+": now.getMinutes(), //分
                "s+": now.getSeconds(), //秒
                "q+": Math.floor((now.getMonth() + 3) / 3), //季度
                "S": now.getMilliseconds() //毫秒
            };
            if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (now.getFullYear() + "").substr(4 - RegExp.$1.length));
            for (let k in o) if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
            return fmt;
        }

        genFormatArray(messageAndStyleArray) {
            const formatArray = [];
            for (let i = 0, end = messageAndStyleArray.length / 2; i < end; i++) {
                formatArray.push("%c%s");
            }
            return formatArray.join("");
        }

    }

    // ----------------------------------------------- -----------------------------------------------------------------

    // 在第一次初始化jQuery的时候添加Hook，jQuery初始化的时候会添加一个名为$的全局变量，在添加这个变量的时候对其动一些手脚
    Object.defineProperty(window, "$", {
        set: $ => {

            // 为jquery的各种方法添加Hook
            try {
                addHook($);
            } catch (e) {
                new ColorLogBuilder("#FF6766", "#E50000")
                    .append("add hook error, msg = ")
                    .appendHighlight(e)
                    .show();
            }
            // 删除set描述符拦截，恢复正常赋值，假装啥都没发生过，但实际上已经狸猫换太子了...
            delete window["$"];
            window["$"] = $;
        }, configurable: true
    });

    /**
     * 为jquery添加一些hook，等会儿使用jquery为dom元素绑定事件的话就会被捕获到
     * @param $
     */
    function addHook($) {

        addEventHook($);

        addAjaxHook($);

        new ColorLogBuilder("#65CC66", "#669934")
            .append("在当前页面上检测到jQuery的加载，添加jQuery Hook完成")
            .show();
    }

    /**
     * 增加Ajax Hook
     *
     * @param $
     */
    function addAjaxHook($) {
        if (!$["ajaxSetup"]) {
            new ColorLogBuilder("#FF6766", "#E50000")
                .appendHighlight("$不是jQuery对象，没有 ajaxSetup 属性，因此不添加Ajax Hook")
                .show();
            return;
        }
        const oldAjaxSetUp = $.ajaxSetup;
        $.ajaxSetup = function () {
            try {
                if (arguments.length === 1) {
                    const {formatEventName, eventFuncGlobalName} = storeToWindow("ajaxSetup", arguments[0]);
                    new ColorLogBuilder("#65CC66", "#669934")
                        .append("检测到ajaxSetup全局拦截器设置请求参数，已经挂载到全局变量：")
                        .appendHighlight(eventFuncGlobalName)
                        .show();
                }
            } catch (e) {
                console.error(e);
            }
            return oldAjaxSetUp.apply(this, arguments);
        }
    }

    /**
     * 增加事件Hook
     *
     * @param $
     */
    function addEventHook($) {
        if (!$["fn"]) {
            new ColorLogBuilder("#FF6766", "#E50000")
                .appendHighlight("$不是jQuery对象，没有 fn 属性，因此不添加 Event Hook")
                .show();
            return;
        }

        // 一些比较通用的事件的拦截
        const eventNameList = ["click", "dblclick", "blur", "change", "contextmenu", "error", "focus", "focusin", "focusout", "hover", "holdReady", "proxy", "ready", "keydown", "keypress", "keyup", "live", "load", "mousedown", "mouseenter", "mouseleave", "mousemove", "mouseout", "mouseover", "mouseup"];
        for (let eventName of eventNameList) {
            const old = $.fn[eventName];
            $.fn[eventName] = function () {
                try {
                    setEventFunctionNameToDomObjectAttribute(this, eventName, arguments[0]);
                } catch (e) {
                    new ColorLogBuilder("#FF6766", "#E50000")
                        .appendHighlight(`为jQuery添加${eventName}类型的事件的Hook时发生错误： ${e}`)
                        .show();
                }
                return old.apply(this, arguments);
            }
        }

        // on，不仅是内置事件类型，还有可能有一些自定义的事件类型
        // https://api.jquery.com/on/
        const fnOnHolder = $.fn.on;
        $.fn.on = function () {
            try {
                const eventName = arguments[0];
                let eventFunction = undefined;
                for (let x of arguments) {
                    if (x instanceof Function) {
                        eventFunction = x;
                        break;
                    }
                }
                if (eventFunction instanceof Function) {
                    setEventFunctionNameToDomObjectAttribute(this, eventName, eventFunction);
                }
            } catch (e) {
                new ColorLogBuilder("#FF6766", "#E50000")
                    .appendHighlight(`为jQuery添加on方法的Hook时发生错误： ${e}`)
                    .show();
            }
            return fnOnHolder.apply(this, arguments);
        }

        // TODO 还有delegate之类的比较隐晦的绑定事件的方式

    }


    /**
     * 为绑定了jquery事件的dom元素添加元素，提示所绑定的事件与对应的函数代码的全局变量的名称，只需要复制粘贴跟进去即可
     * 注意，有可能会为同一个元素重复绑定相同的事件
     *
     * @param domObject
     * @param eventName
     * @param eventFunction
     */
    function setEventFunctionNameToDomObjectAttribute(domObject, eventName, eventFunction) {
        const {formatEventName, eventFuncGlobalName} = storeToWindow(eventName, eventFunction);
        const attrName = `${globalUniqPrefix}-jQuery-${formatEventName}-event-function`;
        if (domObject.attr(attrName)) {
            domObject.attr(attrName + "-" + new Date().getTime(), eventFuncGlobalName);
        } else {
            domObject.attr(attrName, eventFuncGlobalName);
        }
    }

    // ----------------------------------------------- -----------------------------------------------------------------

    // 用于缓存事件函数到全局变量的映射关系
    // <事件函数, 全局变量>
    const eventFuncCacheMap = new Map();

    /**
     * 为事件的函数绑定一个全局变量，如果之前已经绑定过了则返回之前的
     *
     * @param eventName {string}
     * @param eventFunc {Function}
     * @return {{string, string}} 事件名和其对应的函数绑定到的全局变量
     */
    function storeToWindow(eventName, eventFunc) {
        if (eventFunc in eventFuncCacheMap) {
            return eventFuncCacheMap[eventFunc];
        }
        // 注意，事件名可能会包含一些非法的字符，所以需要转义
        // cc11001100-jquery-$destroy-event-function
        const formatEventName = safeSymbol(eventName);
        const eventFuncGlobalName = globalUnique(formatEventName);
        window[eventFuncGlobalName] = eventFunc;
        eventFuncCacheMap[eventFunc] = eventFuncGlobalName;
        return {
            formatEventName, eventFuncGlobalName,
        };
    }

    /***
     * 将事件名称转为合法的变量名称
     *
     * @param name
     */
    function safeSymbol(name) {
        const replaceMap = {
            ".": "_dot_",
            "$": "_dollar_",
            "-": "_dash_",
            " ": "_whitespace_"
        };
        let newName = "";
        for (let c of name) {
            if (c in replaceMap) {
                newName += replaceMap[c];
            } else if (isOkVarChar(c)) {
                newName += c;
            }
        }
        return newName;
    }

    /**
     * 判断字符是否是合法的变量名字符
     *
     * @param c {string}
     * @returns {boolean}
     */
    function isOkVarChar(c) {
        return (/^[a-zA-Z0-9]$/).test(c);
    }

    // ----------------------------------------------- -----------------------------------------------------------------

    // 每个事件一个独立的自增id
    const addressIdGeneratorMap = {};

    /**
     * 为给定的事件生成一个全局唯一的标识，这个标识中会带上事件类型以方便区分不同事件
     *
     * @param eventName {string}
     */
    function globalUnique(eventName) {
        const id = (addressIdGeneratorMap[eventName] || 0) + 1;
        addressIdGeneratorMap[eventName] = id;
        return `${globalUniqPrefix}__${eventName}__${id}`;
    }

    // ----------------------------------------------- -----------------------------------------------------------------

    /**
     * 解析当前代码的位置，以便能够直接定位到事件触发的代码位置
     *
     * @param keyword {string}
     * @returns {string}
     */
    function getCodeLocation(keyword = "cc11001100") {
        const callstack = new Error().stack.split("\n");
        while (callstack.length && callstack[0].indexOf(keyword) === -1) {
            callstack.shift();
        }
        callstack.shift();
        // callstack.shift();

        return callstack[0].trim();
    }

})();

