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
// @require     file://D:\workspace\jQuery-hook\jQuery-hook.js
// ==/UserScript==
(() => {

    // 尽量唯一有区分度即可，您可自定义为自己的ID
    const globalUniqPrefix = "cc11001100";

    // 用于控制打印在控制台的消息的大小
    const consoleLogFontSize = 12;

    // 在第一次设置jquery的时候添加Hook，jQuery初始化的时候会添加一个名为$的全局变量，在添加这个变量的时候对其动一些手脚
    Object.defineProperty(window, "$", {
        set: $ => {

            // 为jquery的各种方法添加Hook
            try {
                addHook($);
            } catch (e) {
                const valueStyle = `color: black; background: #E50000; font-size: ${consoleLogFontSize}px; font-weight: bold;`;
                const normalStyle = `color: black; background: #FF6766; font-size: ${consoleLogFontSize}px;`;

                const message = [

                    normalStyle, now(),

                    normalStyle, "jQuery Monitor: ",

                    normalStyle, "add hook error, msg = ",

                    valueStyle, `${e}`,];
                console.log(genFormatArray(message), ...message);
            }

            // 删除set描述符拦截，恢复正常赋值，假装啥都没发生过...
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

        const valueStyle = `color: black; background: #669934; font-size: ${consoleLogFontSize}px; font-weight: bold;`;
        const normalStyle = `color: black; background: #65CC66; font-size: ${consoleLogFontSize}px;`;

        const message = [

            normalStyle, now(),

            normalStyle, "jQuery Monitor: ",

            normalStyle, "设置jQuery Hook成功！",];
        console.log(genFormatArray(message), ...message);
    }

    /**
     * 增加Ajax Hook
     *
     * @param $
     */
    function addAjaxHook($) {
        if (!$["ajaxSetup"]) {
            const valueStyle = `color: black; background: #E50000; font-size: ${consoleLogFontSize}px; font-weight: bold;`;
            const normalStyle = `color: black; background: #FF6766; font-size: ${consoleLogFontSize}px;`;

            const message = [

                normalStyle, now(),

                normalStyle, "jQuery Monitor: ",

                normalStyle, "$不是jQuery对象，没有 ajaxSetup 属性，因此不添加Ajax Hook",];
            console.log(genFormatArray(message), ...message);
            return;
        }
        const oldAjaxSetUp = $.ajaxSetup;
        $.ajaxSetup = function () {
            try {
                if (arguments.length === 1) {
                    const valueStyle = `color: black; background: #669934; font-size: ${consoleLogFontSize}px; font-weight: bold;`;
                    const normalStyle = `color: black; background: #65CC66; font-size: ${consoleLogFontSize}px;`;

                    const message = [

                        normalStyle, now(),

                        normalStyle, "jQuery Monitor: ",

                        normalStyle, "检测到ajaxSetup全局拦截器设置请求参数",

                        normalStyle, `, code location = ${getCodeLocation("$.ajaxSetup")}`];
                    console.log(genFormatArray(message), ...message);
                    console.log(arguments);
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
            const valueStyle = `color: black; background: #E50000; font-size: ${consoleLogFontSize}px; font-weight: bold;`;
            const normalStyle = `color: black; background: #FF6766; font-size: ${consoleLogFontSize}px;`;

            const message = [

                normalStyle, now(),

                normalStyle, "jQuery Monitor: ",

                normalStyle, "$不是jQuery对象，没有 fn 属性，因此不添加 Event Hook",];
            console.log(genFormatArray(message), ...message);
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
                    const valueStyle = `color: black; background: #E50000; font-size: ${consoleLogFontSize}px; font-weight: bold;`;
                    const normalStyle = `color: black; background: #FF6766; font-size: ${consoleLogFontSize}px;`;

                    const message = [

                        normalStyle, now(),

                        normalStyle, "jQuery Monitor: ",

                        normalStyle, `为jQuery添加${eventName}类型的事件的Hook时发生错误： ${e}`,];
                    console.log(genFormatArray(message), ...message);
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
                const valueStyle = `color: black; background: #E50000; font-size: ${consoleLogFontSize}px; font-weight: bold;`;
                const normalStyle = `color: black; background: #FF6766; font-size: ${consoleLogFontSize}px;`;

                const message = [

                    normalStyle, now(),

                    normalStyle, "jQuery Monitor: ",

                    normalStyle, `为jQuery添加on方法的Hook时发生错误： ${e}`,];
                console.log(genFormatArray(message), ...message);
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
            ".": "_dot_", "$": "_dollar_", "-": "_dash_"
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
        if (c >= 'a' && c <= 'z') {
            return true;
        }
        if (c >= 'A' && c <= 'Z') {
            return true;
        }
        if (c >= '0' && c <= '9') {
            return true;
        }
        return false;
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

    function now() {
        // 东八区专属...
        return "[" + new Date(new Date().getTime() + 1000 * 60 * 60 * 8).toJSON().replace("T", " ").replace("Z", "") + "] ";
    }

    function genFormatArray(messageAndStyleArray) {
        const formatArray = [];
        for (let i = 0, end = messageAndStyleArray.length / 2; i < end; i++) {
            formatArray.push("%c%s");
        }
        return formatArray.join("");
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

