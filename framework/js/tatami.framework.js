;(function(rc) {
  if (!rc) {
    rc = window.Tatami = {};
  }

  var readyList = [];

  /*
   *
   * 将需要在初始化完成之后发送的内容放到这个里面去
   * @param{Object}order 传入的指令
   * @param order.key: 对应的功能块
   * @param order.act: [可选]对应的功能块里的子集，可以省略
   * @param order.value: 对应的当前的内容
   */
  function getReadyList(order) {
    readyList.push(order);
  }

  // 开始分配各个需要在初始化之后发送的内容
  function resolveReadyList() {
    rc.util.map(readyList, function(o) {
      rc.pub('TATAMI.FEATURESTART.' + o.key, o);
    });
  }

  rc.init = function(conf) {
    // 最开始的时候收集那些需要在所有功能件初始化完成之后的任务
    this.sub('TATAMI.FEATUREREADY', getReadyList, this, true);

    // 初始化事件管理器
    this.events.init(conf);
    // 初始化请求管理器
    this.request.init(conf);
    // 初始化模块管理器
    this.modules.init(conf);
    // 初始化视图管理器
    this.views.init(conf);
    // 组件管理器
    this.controls.init(conf);
    // 初始化路由管理器
    this.pages.init(conf);
    // 错误日志的上报等处理
    this.error.init(conf);
    // 日志信息上报处理
    this.logs.init(conf);
    // 初始化util管理器
    this.util.init(conf);
    // 本地缓存部分的加载
    this.localcache.init(conf);

    // 向订阅了任务的所有功能件派发收集之后的任务
    resolveReadyList();
  };
})(window.Tatami);


/**
 * @class events
 * @author Jerrod
 */
(function(rc) {

  if (!rc) {
    window.Tatami = rc = {};
  }
  if (!rc.events) {
    rc.events = {};
  }



  rc.events = {
    _isCanClick: true,

    setClickStatus: function(val) {
      return this._isCanClick = val;
    },
    getClickStatus: function() {
      return this._isCanClick;
    },


    // 以dom 节点对应的数据的集合点, 在数组中便利才能够识别
    _dataDomEvtHandlerNode: [],

    /**
     * @private
     * @param{String} evtName   事件名称
     * @param{Object} nodeObj     该节点的所有属性
     * @param nodeObj.elm     元素
     * @param nodeObj.evts    事件集合
     */
    _domEvtBind: document.addEventListener ? function(evtName, nodeObj, capture) {
      var that = this;
      nodeObj.funcs[evtName] = function() {
        that.__domEvtListApply(evtName, nodeObj, [].slice.apply(arguments));
      };
      nodeObj.elm.addEventListener(evtName, nodeObj.funcs[evtName], capture);
    } : function(evtName, nodeObj, capture) {
      var that = this, evtname = evtName;
      nodeObj.funcs[evtName] = function() {
        that.__domEvtListApply(evtName, nodeObj, [].slice.apply(arguments));
      };
      if (capture) {
        evtname = this._speicalInterfaceEvtList[evtName];
      }
      nodeObj.elm.attachEvent('on' + evtname, nodeObj.funcs[evtName]);
    },

    /**
     *  对于特殊的事件，我们采用直接绑定的方式来处理
     * @private
     * @param{String} evtName   事件名称
     * @param{Object} nodeObj     该节点的所有属性
     * @param nodeObj.elm:    元素
     * @param nodeObj.evts:   事件集合
     *
     */
    _domEvtBind_Speical: function(evtName, nodeObj) {
      var that = this;
      nodeObj.funcs[evtName] = function() {
        that.__domEvtListApply(evtName, nodeObj, [].slice.apply(arguments));
      };
      nodeObj.elm['on' + evtName] = nodeObj.funcs[evtName];
    },

    /**
     * @private
     * @param{String} evtName   事件名称
     * @param{Object} nodeObj     该节点的所有属性
     * @param{Array} args     传递过来的上一个 events
     */
    __domEvtListApply: function(evtName, nodeObj, args) {
      if (!nodeObj.evts[evtName] || !nodeObj.evts[evtName].length) {
        return;
      }
      var i = 0, arr = nodeObj.evts[evtName], ni = arr.length, fn, elm = nodeObj.elm;
      for (; i < ni; i++) {
        fn = arr[i];
        fn.apply(elm, args);
      }
    },

    /**
     * @private
     * @param{Object} nodeObj     该节点的所有属性
     * @param{String} evtName   事件名称
     */
    _domEvtUnbind: document.addEventListener ? function(nodeObj, evtName) {
      nodeObj.elm.removeEventListener(evtName, nodeObj.funcs[evtName]);
      delete nodeObj.funcs[evtName];
    } : function(nodeObj, evtName) {
      nodeObj.elm.detachEvent(evtName, nodeObj.funcs[evtName]);
      delete nodeObj.funcs[evtName];
    },

    /**
     *  特殊事件的解绑
     * @private
     * @param{Object} nodeObj     该节点的所有属性
     * @param{String} evtName   事件名称
     */
    _domEvtUnBind_Speical: function(nodeObj, evtName) {
      nodeObj.elm['on' + evtName] = null;
      delete nodeObj.funcs[evtName];
    },

    // 一些特殊的事件，个性化的事件，我们也需要兼顾
    _speicalPluginEvtList: /^ifClicked|ifChanged/,

    // 接口事件, 接口事件需要启动捕获
    _speicalInterfaceEvtList: {
      focus: 'focusin',
      blur: 'focusout',
      load: 'load',
      change: 'change',
      submit: 'submit',
      scroll: 'scroll'
    },

    /**
     *
     * @private
     */
    _getEvtType: function(type) {
      if (this._speicalPluginEvtList.test(type)) {
        // 这个是说我们需要完全使用 on ＋ 某事件来代理的
        return 'p0';
      } else if (this._speicalInterfaceEvtList[type] != undefined) {
        // 这个是接口事件，需要捕获的
        return 'p1';
      }
      // 这个是常规事件
      return 'p2';
    },

    /**
     * @param elm     需要绑定的元素(HtmlElement)
     * @param{String} evtName   事件名称
     * @param{Function} handler   事件句柄
     */
    domEvtBind: function(elm, evtName, handler) {
      var i = 0, arr = this._dataDomEvtHandlerNode, ni = arr.length;
      var finder, node, newNode;
      for (; i < ni; i++) {
        node = arr[i];
        if (node.elm === elm) {
          finder = node;
          break;
        }
      }
      var _dtype = this._getEvtType(evtName);
      // 如果找到，则继续添加判断
      if (finder) {
        if (!finder.evts[evtName]) {
          finder.evts[evtName] = [];
          this[_dtype === 'p0' ? '_domEvtBind_Speical' : '_domEvtBind'](evtName, finder, _dtype === 'p1');
        }
        finder.evts[evtName].push(handler);
      } else {
        newNode = {
          elm: elm,
          evts: {},
          funcs: {},
        };
        newNode.evts[evtName] = [handler];
        this[_dtype === 'p0' ? '_domEvtBind_Speical' : '_domEvtBind'](evtName, newNode, _dtype === 'p1');
        this._dataDomEvtHandlerNode.push(newNode);

      }
    },

    /**
     * @param dom     需要绑定的元素(HtmlElement)
     * @param{String} evtName   事件名称
     * @param{Function} handler   事件句柄
     */
    domEvtUnbind: function(elm, evtName, handler) {
      var i = 0, arr = this._dataDomEvtHandlerNode, ni = arr.length;
      var finder, node, newNode;
      for (; i < ni; i++) {
        node = arr[i];
        if (node.elm === elm) {
          finder = node;
          break;
        }
      }
      if (!finder || !finder.evts[evtName] || !finder.evts[evtName].length) {
        return;
      }
      var fn;
      for (i = 0, arr = finder.evts[evtName], ni = arr.length; i < ni; i++) {
        fn = arr[i];
        if (fn == handler) {
          // FIXME, 原则上我们不允许塞进同样的一个handler执行请求，因为那样无法识别，所以将全部删除同类操作
          arr.splice(i, 1);
        }
      }
      var _dtype;
      if (!arr.length) {
        // 当里面没有操作当时候，我们则去掉整个该事件，以减少事件链的长度
        delete finder.evts[evtName];
        _dtype = this._getEvtType(evtName);
        this[_dtype === 'p0' ? '_domEvtUnBind_Speical' : '_domEvtUnbind'](finder, evtName);
      }
    },


    /**
     *  once 是sub 事件的特例
     * @param{String} name      该事件的名称
     * @param{Function} callback  该事件的句柄回调
     * @param{Object} context   该事件的上下文
     *
     */
    once: function(name, callback, context) {
      return this.sub(name, callback, context, true);
    },

    /**
     * @private
     * event 有多方用途:
     * 1. event 主要用于处理与我们的需求与 jqm 冲突的事件级的处理方式, 主要是click 事件;
     * 2. 事件的订阅和派送, 建立pub/sub 机制
     */
    _list: {},

    // 内部系统级用的事件队列－减少大队列的时间
    _sysList: {},

    /**
     * @private
     * @param {String} name   输入名字判断是否属于系统内部的
     */
    _checkIsSysKey: function(name) {
      return /^(ERROR|MODULES|EVENTS|PAGES|TATAMI|CONTROLS|SERVER|VIEWS)\./.test(name);
    },

    /**
     * @param {String} name
     * @param callback 相应订阅时的事件
     * @param context  当前上下文
     * @param isOnce   是否只运行一次的事件
     *
     */
    sub: function(name, callback, context, isOnce) {
      var isSysKey = this._checkIsSysKey(name),
        list = this[isSysKey ? '_sysList' : '_list'], it = list[name];
      if (!it) {
        it = this[isSysKey ? '_sysList' : '_list'][name] = [];
      }
      it.push({
          isOnce: !!isOnce,
          func: context ? function() {
            callback.apply(context, arguments);
          } : callback,
          // FIXME 增加了一个原始的引用用于之后做判断
          orignFunc: callback
        }
      );
      return this;
    },
    /**
     * 派发事件
     * @param {String} name - 字符串
     */
    pub: function(name, params) {
      var isSysKey = this._checkIsSysKey(name),
        list = this[isSysKey ? '_sysList' : '_list'], i, j, nj, it;
      //var _params = Array.prototype.splice.call(arguments, 1);
      var _params = [].slice.call(arguments, 1);

      for (i in list) {
        if (name === i) {
          it = list[i];
          for (j = 0, nj = it.length; j < nj; j++) {
            it[j] && it[j].func && it[j].func.apply(null, _params);
            // FIXME 由于一些内容已经被删除导致了该文件不存在，所以需要判断一次
            if (it[j] && it[j].isOnce) {
              // 如果是once，则使用完一次后，移除
              this.removeSub(name, it[j].func);
            }
          }
        }
      }
      return this;
    },

    /**
     * 移除派发事件
     * @param {String} name
     * @param {Function} callback
     */
    removeSub: function(name, callback) {
      var isSysKey = this._checkIsSysKey(name),
        list = this[isSysKey ? '_sysList' : '_list'], i, j, nj, it;
      for (i in list) {
        if (name === i) {
          it = list[i];
          if (!callback) {
            list[i] = [];
            return this;
          }
          for (j = 0, nj = it.length; j < nj; j++) {
            if (!it[j]) {
              continue;
            }
            if (it[j].orignFunc === callback) {
              it.splice(j, 1);
            }
          }
          if (!it.length) {
            delete list[i];
          }
        }
      }
      return this;
    },

    //是否允许进一步的点击.
    clickable: function(callback, context) {
      var that = this;
      return function() {
        if (!that.getClickStatus()) {
          return false;
        }
        var arg = arguments;
        if (context !== undefined) {
          arg = [].slice.call(arguments);
          arg = [context].concat(arg);
        }
        return callback ? callback.apply(this, arg) : false;
      };
    },

    /**
     *
     * @param {Object} callback
     * @param {Object} context
     * 代理，其实就是对于clickable的简化
     */
    proxy: function(callback, context) {
      return function() {
        var args = arguments;
        callback.apply(context || this, args);
      };
    },

    // window resize 事件的句柄
    __domEvtWinResizeHandler: null,

    /**
     * @private
     *
     * 派发window.resize 事件,
     */
    _pubDomEvtWinResize: function() {
      clearTimeout(this.__domEvtWinResizeHandler); //老版本的浏览器下, resize 会2次的问题. 此操作为拖拽停止时, 才会处理相应.
      this.__domEvtWinResizeHandler = setTimeout(function() {
        rc.pub('EVENTS.WINRESIZE', true);
      }, 1);
    },

    //派发click 事件
    _domEvtDocClick: function(e) {
      this.pub('EVENTS.DOCCLICK', {
        e: e,
        target: e.target || e.srcElement
      });
    },

    // 派发 hashchange 事件
    _pubDomEvtHashchange: function() {
      this.pub('EVENTS.HASHCHANGE', location.href);
    },

    // 派发 sessionstorage change 事件
    _pubDomEvtWinSession: function() {
      this.pub('EVENTS.SESSIONCHANGE', [].slice.call(arguments));
    },

    // 派发 localstorage change 事件
    _pubDomEvtWinStorage: function() {
      this.pub('EVENTS.STORAGECHANGE', [].slice.call(arguments));
    },

    // 派发 js error
    _pubDomEvtJsError: function() {
      this.pub('ERROR.JSERROR', [].slice.call(arguments));
    },


    init: function() {
      this.domEvtBind(window, 'resize', this.proxy(this._pubDomEvtWinResize, this));
      this.domEvtBind(window, 'hashchange', this.proxy(this._pubDomEvtHashchange, this));
      this.domEvtBind(document.body, 'click', this.proxy(this._domEvtDocClick, this));
      this.domEvtBind(window, 'session', this.proxy(this._pubDomEvtWinSession, this));
      this.domEvtBind(window, 'storage', this.proxy(this._pubDomEvtWinStorage, this));
      this.domEvtBind(window, 'error', this.proxy(this._pubDomEvtJsError, this));
    }
  };

  rc.sub = function(name, callback, context) {
    return this.events.sub(name, callback, context);
  };
  rc.pub = function(name, params) {
    return this.events.pub.apply(this.events, arguments);
  };
  rc.removeSub = function(name, callback) {
    return this.events.removeSub(name, callback);
  };
})(window.Tatami);


/**
 * @class
 * @author Jerrod
 */
(function(rc) {

  if (!rc) {
    window.Tatami = rc = {};
  }

  /**
   * 我们当前的所有的信息, 都将是用json的格式 存或取.
   * 可以使用 sessionStorage, 保持当前的会话状态, 刷新也可以存在. 但是关闭之后消失. 可以有更高安全性, 对客户端的存储压力也更小.
   */
  rc.localcache = { //本地缓存部分都在这里,
    _sessionstorage: window.sessionStorage,
    _localstorage: window.localStorage, //修改成了localStorage, 以便于保存更多的内容.

    /**
     * 初始化监听 storage 或者 session 变化
     */
    init: function() { //初始化事件的绑定等.
      //当某个session 在另一个页面被改动时触发
      rc.sub('EVENTS.SESSIONCHANGE', this._onSession, this);
      rc.sub('EVENTS.STORAGECHANGE', this._onStorage, this);
    },

    /**
     *
     * 判断是否存在storage 这个方法
     */
    _hasStorage: function() {
      return this._sessionstorage || this._localstorage;
    },

    /**
     *  多页应用时, session的值发生改变时, 触发另外一个.
     * @private
     * @param{Object} e
     */
    _onSession: function(e) {
      e = e || window.event;
      //TO DO
    },

    /**
     *  多页应用时, session的值发生改变时, 触发另外一个.
     * @private
     * @param{Object} e
     */
    _onStorage: function(e) {
      e = e || window.event;
      //TO DO
    },

    /**
     *  返回一个类别
     * @private
     * @param{String} tp    类别 session/storage，默认storage
     */
    _getstorage: function(tp) {
      return !tp ? this._localstorage : tp === 'session' ? this._sessionstorage : this._localstorage;
    },

    /**
     *  返回该类别下的所有数据
     * @param{String} tp    类别 session/storage，默认storage
     */
    getAll: function(tp) {
      if (!this._hasStorage()) {return false;}
      //这里没有做decode (decodeURIComponent) 处理, 我们假设我们拿的都是原数据, 我们需要的. 具体显示时各业务模块自己处理
      var i, s = this._getstorage(tp), data = {};
      for (i in s) {
        data[i] = this.get(i, tp);
      }
      return data;
    },

    /**
     *  返回该类别下的该字段数据
     * @param{String} key   选择的字段
     * @param{String} tp    类别 session/storage，默认storage
     */
    get: function(key, tp) {
      if (!this._hasStorage()) {return false;}
      var s = this._getstorage(tp);
      if (!key || ! s.getItem(key)) {
        return false;
      }
      var v = s.getItem(key);
      if (/^(\{(.*)\}|\[(.*)\])$/.test(v)) {
        //取的时候, 一般情况下我们给出的应该是json对象.
        return rc.util.jsonParse(s.getItem(key));
      }
      return v;
    },

    /**
     *  设置 session
     * @param {String} key      键值
     * @param {Object} value    存储内容
     * @param {String} tp       类别 session/storage，默认storage
     */
    set: function(key, value, tp) {
      if (!this._hasStorage() || !key || value === undefined) {
        return false;
      }
      var s = this._getstorage(tp);
      if (typeof value === 'object') {
        if (value instanceof Object) {
          value._lastModified = rc.util.date.getdate();
        }
        val = rc.util.jsonString(value);
      } else {
        val = value;
      }
      s.setItem(key, val);
    },

    /**
     *  移除某类别下某键值的值
     * @param {String}key     键值
     * @param {String}tp      类别 session/storage，默认storage
     */
    remove: function(key, tp) {
      if (!key || !this._hasStorage()) {
        return false;
      }
      var s = this._getstorage(tp);
      if (s.getItem(key)) {
        s.removeItem(key);
        return true;
      }
      return false;
    },

    /**
     *  移除全部或者移除某个类别的全部
     * @param {String}tp    类别 session/storage，默认storage
     * @param {Object}isAll   是否删除所有
     */
    removeAll: function(tp, isAll) {
      if (!this._hasStorage()) {return false;}
      if (!isAll) {
        return this._getstorage(tp).clear();
      }
      this._sessionstorage.clear();
      this._localstorage.clear();
      return true;
    }
  };
})(window.Tatami);


/**
 * @class util
 * require Tatami.events
 */
;(function(rc) {
  if (!rc) {
    rc = window.Tatami = {};
  }
  // 工具集合
  rc.util = {

    /**
     * @param{Object} conf 配置表
     */
    init: function(conf) {
      if (!conf.plugins || !conf.plugins.notis) {
        return;
      }
      var notis = conf.plugins.notis;
      //消息的派送
      notis.showLoading && rc.sub('NOTI.SHOWLOADING', notis.showLoading, this);
      notis.showWarnning && rc.sub('NOTI.SHOWWARNNING', notis.showWarnning, this);
      notis.showSuccess && rc.sub('NOTI.SHOWSUCCESS', notis.showSuccess, this);
      notis.showFail && rc.sub('NOTI.SHOWFAIL', notis.showFail, this);
      notis.clearShow && rc.sub('NOTI.CLEARSHOW', notis.clearShow, this);
    },

    /**
     *  json.stingify 转化
     * @param {Object}  data 需要转化为string 的object 或者 json
     */
    jsonString: function(data) {
      if (typeof data !== 'object') {
        return false;
      }
      if (JSON && JSON.stringify) {
        return JSON.stringify(data);
      }
      return this._clone(data, true);
    },

    /**
     *  json.parse 转化
     * @param {String}  str 需要转化为data 的string
     */
    jsonParse: function(str) {
      if (typeof str !== 'string') {
        return false;
      }
      var data;
      try {
        data = JSON.parse(str);
      } catch(e) {
        try {
          data = eval('(' + str + ')');
        } catch(e) {}
      }
      return data || undefined;
    },

    /**
     *
     *  利用递归返回一个深度克隆的对象
     * @param {Object} data 需要被clone 的元素
     */
    deepClone: function(data) {
      var _data;
      switch(typeof data) {
        case 'string':
          _data = data + '';
          break;
        case 'number':
          _data = + data;
          break;
        case 'boolean':
          _data = !!data;
          break;
        default:
        case 'object':
          _data = this._clone(data);
          break;
      }
      return _data;
    },

    /**
     *
     *  递归克隆
     * @private
     * @param {Object} data
     * @param {Boolean} isFormatData    是否需要格式化
     */
    _clone: function(data, isFormatData) {
      var isArray = data instanceof Array,
        o = isArray ? [] : {},
        i, ni, it, itType;
      if (isArray) {
        for (i = 0, ni = data.length; i < ni; i++) {
          it = data[i];
          itType = typeof it;
          o.push(itType === 'object' ?
            this._clone(it, isFormatData) : it);
        }
      } else if (data === null) {
        o = null;
      } else {
        for (i in data) {
          it = data[i];
          itType = typeof it;
          o[isFormatData ? '"' + i + '"' : i] = itType === 'object' ?
            this._clone(it, isFormatData) : it;
        }
      }
      return o;
    },

    date: {
      _date_cur_date: new Date(),
      _date_reg_all: /^[12][0-9]{3}(-|\/)(0?[0-9]|1[0-2])(-|\/)(0?[1-9]|[1-2][0-9]|3[0-1]).(0?[0-9]|1[0-9]|2[0-3]):(0?[0-9]|[1-5][0-9]):(0?[0-9]|[1-5][0-9])$/,
      _date_reg_year_month: /^[12][0-9]{3}(-|\/)(0?[0-9]|1[0-2])$/,
      _date_reg_year_month_date: /^[12][0-9]{3}(-|\/)(0?[0-9]|1[0-2])(-|\/)(0?[1-9]|[1-2][0-9]|3[0-1])$/,
      _date_reg_year_month_date_hour: /^[12][0-9]{3}(-|\/)(0?[0-9]|1[0-2])(-|\/)(0?[1-9]|[1-2][0-9]|3[0-1]).(0?[0-9]|1[0-9]|2[0-3])$/,
      _date_reg_year_month_date_hour_minute: /^[12][0-9]{3}(-|\/)(0?[0-9]|1[0-2])(-|\/)(0?[1-9]|[1-2][0-9]|3[0-1]).(0?[0-9]|1[0-9]|2[0-3]):(0?[0-9]|[1-5][0-9])$/,
      _date_reg_time: /^(0?[0-9]|1[0-9]|2[0-3]):(0?[0-9]|[1-5][0-9]):(0?[0-9]|[1-5][0-9])$/,

      /***
       * @param {Object|Number|String} date
       * @param {Object} format
       */
      getdate: function(date, format) {
        var now = this.tojsdate(date),
          year = now.getFullYear(),
          month = (now.getMonth() + 1),
          day = now.getDate(),
          hour = now.getHours(),
          minute = now.getMinutes(),
          second = now.getSeconds(),
          result, fill = function(val) {
            return (val < 10 ? '0' : '') + val;
          };
        month = fill(month);
        day = fill(day);
        hour = fill(hour);
        minute = fill(minute);
        second = fill(second);

        switch(format) {
          case 'YY-MM':
            result = year + '-' + month;
            break;
          case 'MM-DD':
            result = month + '-' + day;
            break;
          case 'YY-MM-DD':
            result = year + '-' + month + '-' + day;
            break;
          case 'YY-MM-DD HH:MM:SS':
            result = year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second;
            break;
          case 'YY-MM-DD HH:MM':
            result = year + '-' + month + '-' + day + ' ' + hour + ':' + minute;
            break;
          case 'YY/MM/DD HH:MM':
            result = year + '/' + month + '/' + day + ' ' + hour + ':' + minute;
            break;
          case 'HH:MM':
            result = hour + ':' + minute;
            break;
          case 'HH:MM:SS':
            result = hour + ':' + minute + ':' + second;
            break;
          default:
            result = year + '/' + month + '/' + day + ' ' + hour + ':' + minute + ':' + second;
        }
        return result;
      },
      setcurdate: function(val) {
        this._date_cur_date = new Date(this.format_date(val));
      },
      //以后所有的时间都从这块来, 这块的时间将会配合时间矫正来处理.
      getcurdate: function() {
        return new Date(this._date_cur_date);
      },
      //转化成为js 的时间
      tojsdate: function(date) {
        if (!this.is_date(date)) {
          return this.getcurdate();
        }
        if (typeof date === 'string') {
          if (/^\d{11,}$/.test(date)) {
            return  new Date(+date);
          }
          date = date.replace(/-/g, '\/');
          if (this._date_reg_year_month.test(date)) {
            date += '/01';
          }
        }
        return new Date(date);
      },
      /**
       *
       * Number+  y|mo|d|h|m|s 分别表示年/月/日/小时/分/秒.  如果没带后缀, 则默认为天.
       * @param {Object|Number|String} oldDate
       * @param {String|Number} changeDate
       */
      getdiffdate: function(oldDate, changeDate, format) {
        var curDate = this.tojsdate(oldDate);
        if (/^(-?\d+)y$/.test(changeDate)) {
          curDate.setFullYear(curDate.getFullYear() + (+ RegExp.$1));
        } else if (/^(-?\d+)mo$/.test(changeDate) && RegExp.$1 != 0) {
          // 缓存当前的天
          var _cache_day = curDate.getDate();

          // 重置到月初. 如果当前的 getDate() 大于目标月的最大日期就悲剧了
          curDate.setDate(1);

          // 设置月份
          curDate.setMonth(curDate.getMonth() + (+ RegExp.$1));
          curDate.setDate(_cache_day);

          if (curDate.getDate() != _cache_day) {
            // 上个月的最后一天
            curDate.setDate(0);
          }

        } else if (/^(-?\d+)d$/.test(changeDate)) {
          curDate.setDate(curDate.getDate() + (+ RegExp.$1));
        } else if (/^(-?\d+)h$/.test(changeDate)) {
          curDate.setHours(curDate.getHours() + (+ RegExp.$1));
        } else if (/^(-?\d+)m$/.test(changeDate)) {
          curDate.setMinutes(curDate.getMinutes() + (+ RegExp.$1));
        } else if (/^(-?\d+)s$/.test(changeDate)) {
          curDate.setSeconds(curDate.getSeconds() + (+ RegExp.$1));
        }
        return this.getdate(curDate, format);
      },
      format_date: function(date) {
        if (!date || !this.is_date(date)) {
          return false;
        }
        var reg = this._date_reg_time;
        if (reg.test(date)) {
          return date.replace(/-/g, '\/');
        } else {
          return this.getdate(date);
        }
      },
      is_date: function(date) {
        if (!date || date === null) {
          return false;
        }
        var newdate;
        if (typeof date === 'string') {
          if (/^\d{11,}$/.test(date)) {
            newdate = new Date(+date);
            return newdate != 'Invalid Date';
          }
          return this._date_reg_all.test(date) ||
            this._date_reg_year_month.test(date) ||
            this._date_reg_year_month_date.test(date) ||
            this._date_reg_year_month_date_hour.test(date) ||
            this._date_reg_year_month_date_hour_minute.test(date);
        }
        newdate = new Date(date);
        return newdate != 'Invalid Date';
      },
    },
    /**
     * 模板字符串过滤
     *
     * @param{String} str   需要过滤的字符串
     */
    htmlFilter: function(str) {
      return typeof str === 'string' ? str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : str;
    },
    /**
     * 模板字符串过滤
     * @param{Object} object    需要循环的对象,<IE9不支持对象，只支持数组
     * @param{Function} iteratee迭代器
     * @param{Object} context   上下文环境
     */
    map: function(object, iteratee, context) {
      var obj = rc.util.deepClone(object),
        keys = !(typeof obj.length == 'number') && Object.keys(obj),
        length = (keys || obj).length,
        index,
        currentKey;
      for (index = 0; index < length; index++) {
        currentKey = keys ? keys[index] : index;
        obj[currentKey] = iteratee ? context ?
          iteratee.call(context, obj[currentKey], currentKey, obj) : iteratee(obj[currentKey], currentKey, obj) : obj[currentKey];
      }
      return obj;
    },
  };
})(window.Tatami);


/**
 * @depned Tatami.events
 */
;(function(rc) {
  if (!rc) {
    rc = window.Tatami = {};
  }

  /**
   * @descript 我们会上报所有可能的错误日志，包括http 请求，js error 等
   */
  rc.error = {

    /**
     *
     * @param {String} errMsg   错误信息
     * @param {String} scriptURI  出错的文件
     * @param {Number} lineNum    出错代码的行号
     * @param {Number} colNum   出错代码的列号
     * @param {Object} errObj   错误的详细信息
     * @descript 上报我们的js引起的错误信息
     */
    _collectJsError: function(errMsg, scriptURI, lineNum, colNum, errObj) {
      rc.pub('SERVER.REQUEST_REQ', {
        method: 'post',
        dataType: 'form',
        requestAddr: this._jsErrUpPath,
        data: {
          errMsg: errMsg,
          scriptURI: scriptURI,
          lineNum: lineNum,
          colNum: colNum,
          errObj: rc.util.jsonString(errObj)
        }
      });
    },

    /**
     *
     * @param {Object} errObj 错误信息的对象
     * @descript 上报我们serverCall 的错误信息
     */
    _collectRequestApiError: function(errObj) {
      rc.pub('SERVER.REQUEST_REQ', {
        method: 'get',
        dataType: 'form',
        requestAddr: this._apiErrUpPath,
        data: {}
      });
    },

    /**
     *
     * @param {Object} errObj 错误信息的对象
     * @descript 上报我们pages 的错误信息, 路由错误等
     */
    _collectPagesError: function(errObj) {

    },

    /**
     *
     * @param {Object} errObj 错误信息的对象
     * @descript 上报我们mdul 错误：mdul 不存在等
     */
    _collectMdulsError: function(errObj) {

    },

    _jsErrUpPath: null,
    _apiErrUpPath: null,
    _pagesErrUpPath: null,
    _mdulsErrUpPath: null,


    init: function(conf) {
      if (conf.jsErrUpPath) {
        this._jsErrUpPath = conf.jsErrUpPath;
        rc.sub('ERROR.JSERROR', this._collectJsError, this);
      }
      if (conf.apiErrUpPath) {
        this._apiErrUpPath = conf.apiErrUpPath;
        rc.sub('ERROR.REQUEST_API', this._collectRequestApiError, this);
      }
      if (conf.pagesErrUpPath) {
        this._pagesErrUpPath = conf.pagesErrUpPath;
        rc.sub('ERROR.PAGES', this._collectPagesError, this);
      }
      if (conf.mdulsErrUpPath) {
        this._mdulsErrUpPath = conf.mdulsErrUpPath;
        rc.sub('ERROR.MODULES', this._collectMdulsError, this);
      }
    }
  };
})(window.Tatami);

/**
 * @class pages
 * @author Jerrod
 */
(function(rc) {

  if (!rc) {
    rc = window.Tatami = {};
  }

  rc.pages = {

    // 路由里配置得虚拟目录结构
    _mainPath: ['root', 'app', 'classification'],

    // 当前的 url
    _curUrl: '',
    // 当前的 hashs 对象
    _curHashs: {},
    // 上一次的 url
    _prevUrl: '',
    // 上一次的 hashs 对象
    _prevHashs: {},


    /**
     * 设置当前的url
     * @private
     */
    _setCurUrl: function(url) {
      if (url) {
        this._curUrl && this._setPrevUrl(this._curUrl);
        this._curUrl = url;
      }
    },

    /**
     * 获得当前的url
     * @private
     */
    _getCurUrl: function() {
      return this._curUrl;
    },


    /**
     * 设置当前的hashs
     * @private
     */
    _setCurHashs: function(hashs) {
      if (hashs) {
        this._curHashs && this._setPrevHashs(this._curHashs);
        this._curHashs = hashs;
      }
    },

    /**
     *
     * 获得当前的url
     * @private
     */
    _getCurHashs: function() {
      return this._curHashs;
    },


    /**
     *
     * 设置上一个的url
     * @private
     */
    _setPrevUrl: function(url) {
      if (url) {
        this._prevUrl = url;
      }
    },

    /**
     *
     * 获得上一个的url
     * @private
     */
    _getPrevUrl: function() {
      return this._prevUrl;
    },


    /**
     * 设置上一个的hashs
     * @private
     */
    _setPrevHashs: function(hashs) {
      if (hashs) {
        this._prevHashs = hashs;
      }
    },

    /**
     *
     * 获得上一个的url
     * @private
     */
    _getPrevHashs: function() {
      return this._prevHashs;
    },

    /**
     *
     * @private
     * 历史数据
     */
    _histories: [],

    /**
     *  根据分割符号从url 里切除相应的内容，没有则为空
     * @private
     * @param{String}symbol   需要分割的符号
     * @param{String}url    传入的url 地址
     */
    _getFilterUrlBySymbol: function(symbol, url) {
      var ind = url.indexOf(symbol || '#');
      return ind === -1 ? '' : url.slice(ind, url.length);
    },


    /**
     * 获得当前的location的 fullpath
     * @private
     */
    _getLocationFullPath: function() {
      return location.protocol + '//' + location.hostname + ((location.port === 80 || location.port === '') ? '' : ':' + location.port) + location.pathname;
    },

    /**
     * 可以将字符串按照 & 的格式分割
     * @param{String}str    需要转化的字符串
     * @param{Object}obj    [可选] 需要挂载上的对象
     * @private
     */
    _queryParser: function(str, obj) {
      if (!str) {return obj || {};}
      var re = obj || {}, i = 0, arrQuery = str.split('&'), ni = arrQuery.length, it, key, val;
      for (; i < ni; i++) {
        it = arrQuery[i].split('=');
        if (it.length === 0) {
          continue;
        }
        key = it[0];
        val = it[1] ? decodeURIComponent(it[1]) : '';
        if (!re[key]) {
          re[key] = val;
          continue;
        }
        re[key] += ',' + val;
      }
      return re;
    },

    /**
     *  通过传入url 获得一个经过解析的querySting 对象
     * @param {String} url url 地址
     */
    getQueries: function(url) {
      var strQuery = this._getFilterUrlBySymbol('?', url);
      if (!strQuery) {
        return {};
      }
      // 这个部分获得的应该是？ 后 ＃ 前的内容
      strQuery = strQuery.slice(1, strQuery.indexOf('#') !== -1 ? strQuery.indexOf('#') : strQuery.length);
      return this._queryParser(strQuery);
    },

    /**
     *
     * 将一段string 解析成对象
     * @param {String} str    需要解析的字符串
     */
    getQueriesObject: function(str) {
      return typeof str === 'string' ? this._queryParser(str) : {};
    },


    // 存放转化后的路由数据
    _routeMapping: {},

    /**
     *
     *  返回该节点名称下的路由里的映射数据
     * @private
     * @param {String} routeName 该节点的名称
     */
    _getRouteNode: function(routeName) {
      return this._routeMapping[routeName || '_default'];
    },

    /**
     *
     *  返回一个hash 的host path，如 /root/
     * @private
     * @param {Object} hashs     一个hashs对象
     * @param {Boolean} isConvert  是否需要覆盖
     * @param {Boolean} isFillHD   是否补全前，后的‘／’
     */
    _getHashHostPath: function(hashs, isConvert, isFillHD) {
      var mainPath = this._mainPath, i = 0, ni = mainPath.length, hash = [], it;
      for (; i < ni; i++) {
        it = mainPath[i];
        if (hashs[it]) {
          hash.push(hashs[it]);
        }
      }
      hash = hash.join('.');
      var node = this._getRouteNode(hash);
      if (!isConvert) {
        return node ? node.name : hash;
      }
      var converts = (node.name || hash).replace(/\./g, '/');
      if (isFillHD) {
        return '/' + converts + '/';
      }
      return converts;
    },


    /**
     *  返回一个hashs对象
     *
     * @private
     * @param {String} url    url 字段
     */
    _getHashs: function(url) {
      var aHash = url.replace(/^#/, ''), obj = {},
        aFolder, sSearch, folders, i, ni, j, mainPath = this._mainPath, itName;
      // 我们的虚拟目录结构为 /root/app/classification/?a=x&b=y&c=z 最多三层虚拟目录，后续为不同多尾字段
      if (/^\/(\w+)(\/(\w+)){0,2}(\/\?(\w+=[^&]*|\w+)|\/$)/.test(aHash)) {
        aFolder = aHash.slice(0, aHash.indexOf('?'));
        sSearch = /\?/.test(aHash) ? aHash.slice(aHash.indexOf('?') + 1, aHash.length) : '';
        folders = aFolder.split('/');
        for (i = 0, ni = folders.length, j = 0; i < ni; i++) {
          if (!folders[i] || folders[i] === '') {
            continue;
          }
          itName = mainPath[j++];
          obj[itName] = folders[i];
        }
        if (sSearch) {
          obj = this._queryParser(sSearch, obj);
        }
      } else {
        obj.root = '';
      }
      return obj;
    },

    /**
     *
     *  根据module判断是否页面发生了改变
     * @private
     * @param {Object} curHashs     当前的hashs对象
     * @param {Object} prevHashs    上个的hashs对象
     */
    _isPagechange: function(curHashs, prevHashs) {
      if (!curHashs || !prevHashs) {
        return false;
      }
      // 其实只需要判断 3 层, root, app, classification
      return curHashs.root !== prevHashs.root || curHashs.app !== prevHashs.app || curHashs.classification !== prevHashs.classification;
    },

    /**
     *
     *  监听window hashchange 事件，然后更新下面的url变化
     * @private
     * @param {String} url      hashchange 时获得的url
     */
    _hashchange: function(url) {
      var prevUrl = this._getCurUrl();
      if (prevUrl === url) {
        return;
      }
      var hash = this._getFilterUrlBySymbol('#', url);
      this._doPagechangeAct(hash, false, url);
    },

    /**
     *
     * 通过匹配去获得一个变化了的mdul name
     * @param {Object} prevHashs      之前的hashs
     * @param {Object} curHashs       当前的hashs
     */
    _getDisabledMdul: function(prevHashs, curHashs) {
      var i = 0, marr = this._mainPath, ni = marr.length, it, arr = [];
      for (; i < ni; i++) {
        it = marr[i];
        if (prevHashs[it] !== undefined) {
          arr.push(prevHashs[it]);
        }
        if (prevHashs[it] !== curHashs[it]) {
          if (prevHashs[it] === undefined) {
            // 如果prev 当前已经就没有了，说明当前的不需要隐藏掉
            return false;
          }
          return arr.join('.');
        }
      }
      return false;
    },

    /**
     *
     * 根据node 里会有得默认节点参数，获得一个新得hashs对象（因为有些hashs如{root: 'index'} 实际应该还有一层 {root: 'index', app: 'list'}
     * @param {Object} hashs    原始hashs
     * @param {Object} node     当前的node 对象
     */
    _getHashsIfHasDefault: function(hashs, node) {
      var i = 0, nodeArr;
      // 匹配长度
      rc.util.map(hashs, function() {i++;}, this);
      nodeArr = node.name.split('.');
      // 存在有这样的需求，由于有默认的default_index，所以hashs当前的包裹起始并不明确，我们需要让他明确起来
      if (i !== nodeArr.length) {
        rc.util.map(nodeArr, function(it, idx) {
          hashs[this._mainPath[idx]] = it;
        }, this);
      }
      return hashs;
    },

    /**
     *
     *  当页面发生改变时，我们来处理
     * @private
     * @param {String} hashs    hash 字符串
     * @param {Boolean} isInit    是否初次执行
     * @param {String} url      访问地址
     */
    _doPagechangeAct: function(hash, isInit, url) {
      var hashs = this._getHashs(hash);
      // hash === '' || !hashs.root
      if (!hash || !hashs.root) {
        //200 - 'hash 为空或者不存在'
        rc.pub('ERROR.PAGES', {result: 200});
        isInit ? this._jumpToDefault() : this.goback();
        return;
      }

      this._histories.push({
        url: url,
        hashs: hashs,
        time: new Date()
      });
      this._setCurUrl(url);
      this._setCurHashs(hashs);

      // pages 只需要告诉module 哪些内容发生变化就可以了，其他的由module 自己去处理
      var routeKey = this._getNodeNameByHashs(hashs), curMdul, node = this._getRouteNode(routeKey);

      // 用 routeKey 和我们初始化后的路由配置对比
      if (!node) {
        // 不存在我们也返回默认页去
        //201 - 'route module 在配置里不存在'
        rc.pub('ERROR.PAGES', {result: 201});
        this.goback();
        return;
      }
      curMdul = node.name;

      rc.pub('PAGES.HASHCHANGE', hashs);

      var prevHashs = this._getPrevHashs(),
        prevRoot = prevHashs.root,
        prevKey = this._getNodeNameByHashs(prevHashs), nPrevKey;

      this.setTitle(node.value.title);

      hashs = this._getHashsIfHasDefault(hashs, node);
      if (isInit) {
        this._setCurHashs(hashs);
        rc.pub('TATAMI.FEATUREREADY', {key: 'PAGES', act: 'PAGES.HASHCHANGE', value: hashs});
        rc.pub('TATAMI.FEATUREREADY', {key: 'PAGES', act: 'PAGES.PAGECHANGE', value: hashs});
        rc.pub('TATAMI.FEATUREREADY', {key: 'PAGES', act: 'MODULES.ROOTLOAD', value:  {
          prevRoot: prevRoot, // 需要被销毁的mdul
          curRoot: hashs.root, // 需要被加载的mdul
          curMdul: curMdul, // 需要被更新的mdul
          prevMdul: prevKey, // 上一个需要被隐藏的mdul
          url: url, // 发送过去的url
          hashs: hashs // 需要
        }});

      } else {
        // root 发生里转变，会需要destroy 之前的模块，load 新模块
        if (prevRoot !== hashs.root) {
          rc.pub('PAGES.PAGECHANGE', hashs);
          rc.pub('MODULES.ROOTLOAD', {
            prevRoot: prevRoot, // 需要被销毁的mdul
            curRoot: hashs.root, // 需要被加载的mdul
            curMdul: curMdul, // 需要被更新的mdul
            prevMdul: prevKey, // 上一个需要被隐藏的mdul
            url: url, // 发送过去的url
            hashs: hashs // 需要
          });
        } else {
          // 如果模块发生变化了，则pub一个变化事件出来
          if (this._isPagechange(hashs, prevHashs)) {
            nPrevKey = this._getDisabledMdul(prevHashs, hashs);
            rc.pub('PAGES.PAGECHANGE', hashs);
          }
          rc.pub('MODULES.SWITCHMDUL', {
            prevMdul: prevKey,
            nPrevKey: nPrevKey,
            curMdul: curMdul,
            hashs: hashs,
            url: url
          });
        }
      }

      // 广播当前的path 是否是跟节点下的
      rc.pub('PAGES.ISROOTPAGE', this._isRootPath(hashs));
    },

    /**
     *  根据类似 a.b.c 来解析成 #/a/b/c/
     * @private
     * @param {String} nodeName   nodeName 字符串
     */
    _getPathByNodeName: function(nodeName) {
      return '#/' + nodeName.replace(/\./g, '/') + '/';
    },

    /**
     *  根据类似 {root:a,app:b,classitication:c} 解析成 a.b.c
     * @private
     * @param {Object} hashs    hash 的对象
     */
    _getNodeNameByHashs: function(hashs) {
      if (!hashs || !hashs.root) {
        return '';
      }
      var key = hashs.root;
      if (hashs.app) {
        key += '.' + hashs.app;
        if (hashs.classification) {
          key += '.' + hashs.classification;
        }
      }
      return key;
    },

    /**
     *
     * 跳到我们的默认页
     * @private
     */
    _jumpToDefault: function() {
      var dNode = this._getRouteNode();
      if (!dNode) {
        return;
      }
      var path = this._getPathByNodeName(dNode.name);
      this.goPage(path, true);
    },

    /**
     *  根据hashs 来判断是否是root path
     * @private
     * @param {Object} hashs    hash 的对象
     */
    _isRootPath: function(hashs) {
      var rm = this._routeMapping;
      if (hashs.app) {
        var appDefault = rm[hashs.root].default_index;
        if (appDefault !== hashs.app) {
          return false;
        }
        if (!hashs.classification) {
          return true;
        }
        if (hashs.classification && !rm[hashs.root].app_list[hashs.app].classification_list) {
          return false;
        }
        if (hashs.classification !== rm[hashs.root].app_list[hashs.app].default_index) {
          return false;
        }
        return true;
      } else {
        return true;
      }
    },

    /**
     * @param {Object | String} a   如果 a 是一个 hashs 对象，则我们去获得对象过滤后得到的新地址，否则 a 表示地址
     * @param {Boolean} b   表示是否不需要encode，默认encode
     * @param {Boolean} c   表示否是否清空之前的queryString
     */
    pagesModify: function(a, b, c, d) {
      // 如果 a 是一个对象，则我们去获得对象过滤后得到的新地址
      var newUrl;
      if (typeof a === 'object') {
        newUrl = this._getNewPathByHashsChange(a, b, c);
        this.goPage(newUrl);
        return;
      }

    },

    /**
     *  获得一个只有root，app，classifition 的对象
     * @private
     * @param {Object} hashs  传入一个对象
     */
    _getRootHashs: function(hashs) {
      var mainPath = this._mainPath, i = 0, ni = mainPath.length, it, obj = {};
      for (;i < ni; i++) {
        it = mainPath[i];
        if (hashs[it]) {
          obj[it] = hashs[it];
        }
      }
      return obj;
    },

    /**
     *  获得一个通过modify 改造后的新地址
     * @private
     * @param {Object} modified   需要修改的内容
     * @param {Boolean} isNotDecode 是否不做decode处理
     * @param {Boolean} isClear   是否需要清空之前的 queryString（指在hash后的部分）
     */
    _getNewPathByHashsChange: function(modified, isNotDecode, isClear) {
      if (!modified || typeof modified !== 'object') {
        return;
      }
      var curHashs = this._getCurHashs(), // 当前的root，app，classification
        rootHashs = this._getRootHashs(curHashs),
        curQuery = isClear ? {} : this.getHashQueryObject() || {}, // 当前的所有搜索内容 (不含root，app，classification), 如果全清空，则完全为空
        getValue = !isNotDecode ? function(val) {
          return encodeURIComponent(val);
        } : function(val) {
          return val;
        },
        mainPathStr = this._mainPath.join('.');
      var i, urlArr = [], it, j, rootPath = '#/';

      for (i in modified) {
        it = modified[i];
        if (RegExp('\\b' + i + '\\b').test(mainPathStr)) {
          if (it === undefined || it === '') {
            delete rootHashs[i];
          } else {
            rootHashs[i] = it;
          }
          continue;
        }

        if (curQuery[i]) {
          if (it === undefined || it === '') {
            delete curQuery[i];
          } else {
            curQuery[i] = it;
          }
          continue;
        }

        curQuery[i] = getValue(it);
      }
      for (i in rootHashs) {
        rootPath += rootHashs[i] + '/';
      }
      for (i in curQuery) {
        urlArr.push(i + '=' + curQuery[i]);
      }
      if (urlArr.length) {
        rootPath += '?' + urlArr.join('&');
      }
      return rootPath;
    },

    /**
     * @param{String} title 需要设置的title 名
     */
    setTitle: function(title) {
      (top.document || document).title = title;
    },

    /**
     * 获得在当前的历史纪录信息 (url || hashs)
     * @param{String|Number} target     想获得的内容，可以是string可以是数字
     * @param{String} type            获得内容的格式
     */
    getHistory: function(target, type) {
      // 上一页
      var ni;
      // type 默认为hashs
      if (!type) {
        type = 'hashs';
      }
      if (target === 'prev') {
        return this[type === 'url' ? '_getPrevUrl' : '_getPrevHashs']();
      } else if (target === 'cur') {
        return this[type === 'url' ? '_getCurUrl' : '_getCurHashs']();
      } else if (/^-?\d+$/.test(target)) {
        ni = this._histories.length;
        if (!ni) {
          return false;
        }
        // 一般是 －1， 0 表示当前
        if (target > 0) {
          return false;
        } else if (target === 0) {
          return this._histories[0][type === 'url' ? 'url' : 'hashs'];
        }
        if (this._histories[ni + (+ target)]) {
          return this._histories[ni + (+ target)][type === 'url' ? 'url' : 'hashs'];
        }
        return false;
      }
      return false;
    },

    /**
     *
     * 将数据格式转化成一个以&拼接的URL格式
     * @param {Object} data   需要插入的查询内容，如果是多维将压缩成一维
     * @param {Boolean} notEncode 是否会需要编码，默认编码
     */
    dataToQuerystr: function(data, notEncode) {
      var i, it, query = data || {}, str = [],
        funcFilter = !!notEncode ?  function(it) {
          // 第二层必须被编码
          return typeof it === 'object' ? encodeURIComponent(rc.util.jsonString(it)) : it;
        } : function(it) {
          return encodeURIComponent(typeof it === 'object' ? (rc.util.jsonString(it)) : it);
        };
      for (i in query) {
        it = query[i];
        str.push(i + '=' + funcFilter(it));
      }
      return str.join('&');
    },

    /**
     *
     * 将需要拼接的查询内容添加到url 后面去
     * @param {String} url      需要拼接的url
     * @param {Object|String} query   需要插入的查询内容，如果是多维将压缩成一维, 支持字符串与对象
     * @param {Boolean} notEncode   是否会需要编码，默认编码
     */
    dataJoinUrl: function(url, query, notEncode) {
      var a0, a1, b0, b1, str = typeof query === 'object' ? this.dataToQuerystr(query, notEncode) : (query || '');
      a0 = url.indexOf('?'); //第一个？的位置
      a1 = url.lastIndexOf('?'); //最后一个？的位置
      b0 = url.indexOf('#'); //第一个＃的位置
      b1 = url.lastIndexOf('#'); //最后一个＃的位置
      if (a0 === -1 && b0 === -1) {
        // 既没 ＃，又没 ？
        url += '?' + str;
      } else if (a0 !== -1 && b0 === -1) {
        // 有？ 没＃
        url += '&' + str;
      } else if (a0 === -1 && b0 !== -1) {
        // 有＃ 没？
        url += '?' + str;
      } else if (a0 !== -1 && b0 !== -1) {
        // 有？有＃
        if (a0 === a1 && b0 === b1) {
          // 一个？一个＃
          if (a0 < b0) {
            url += '?' + str;
          } else {
            url += '&' + str;
          }
        } else {
          // ？一个，多个＃
          // 多个？一个＃
          // 多个 ？多个＃
          if (b1 > a1) {
            url += '?' + str;
          } else {
            url += '&' + str;
          }
        }
      }
      return url;
    },

    /**
     *
     *  页面跳转（200）
     * @param {String} url    url 地址
     * @param {Object} query  带有搜索的内容的转化(当只有2个参数时， 可以用于表示isReplace 或者本身)
     * @param {Boolean} isReplace 是否替换地址
     */
    goPage: function(url, query, isReplace) {
      if (!url || url === undefined || url === '') {
        return;
      }
      url = typeof query === 'object' ? this.dataJoinUrl(url, query) : url;
      // 只有2个参数时，第二个参数可以表示isReplace的意思
      if (isReplace || query === true) {
        location.replace(url);
        return;
      }
      location.href = url;
    },

    /**
     *  刷新当前页，启用此方式的时候其实并不会触发url 跳转，而是直接让module 重新处理
     */
    reflash: function() {
      var curMdul,
        curHashs = this._getCurHashs(),
        curUrl = this._getCurUrl();

      if (!curUrl || !curHashs.root) {
        return;
      }
      curMdul = this._getNodeNameByHashs(curHashs);
      // 先销毁当前的，然后在加载当前的
      rc.pub('MODULES.DESTROY', {mdulName: curHashs.root, hashs: curHashs});
      rc.pub('MODULES.LOAD', {mdulName: curHashs.root, hashs: curHashs});
      rc.pub('MODULES.UPDATE', {mdulName: curMdul, hashs: curHashs, url: curUrl});
    },

    /**
     * @param{Number} backStep 需要回跳的步数
     * @param{Boolean} isReplaceStatus 是否取代当前的状态
     */
    goback: function(backStep, isReplaceStatus) {
      var len = this._histories.length;
      if (backStep < len) {
        this._histories = this._histories.slice(len - backStep, len);
        history.back && history.back(backStep || 1);
      } else if (this._histories.length) {
        this._histories = [this._histories.shift()];
        history.back();
      }
    },

    /**
     *  从location 或者 某个url 里解析出 hashkey
     * @param {String}key   需要去从url 上获得的hash key
     * @param {String}url   可选，从某个url 里获得
     */
    getHashKey: function(key, url) {
      url = url || this._getCurUrl();
      var strQuery = this._getFilterUrlBySymbol('#', url);
      if (!strQuery) {
        // 不存在
        return undefined;
      }
      var obj = this._getHashs(strQuery);
      return obj[key] || undefined;
    },

    /**
     *  从location 或者 某个url 里解析出 querykey
     * @param {String}key   需要去从url 上获得的query key
     * @param {String}url   可选，从某个url 里获得
     */
    getHashQueryKey: function(key, url) {
      url = url || this._getCurUrl();
      var queryObj = this.getHashQueryObject(url);
      if (!queryObj) {
        return undefined;
      }
      return queryObj[key] || undefined;
    },

    /**
     *  从location 或者 某个url 里解析出 query object
     * @param {String}url   可选，从某个url 里获得
     */
    getHashQueryObject: function(url) {
      url = url || this._getCurUrl();
      var strQuery = this._getFilterUrlBySymbol('#', url);
      strQuery = this._getFilterUrlBySymbol('?', strQuery);
      if (!strQuery) {
        return false;
      }
      return this._queryParser(strQuery.substr(1));
    },

    /**
     *  获得这边的由解析路由得到的配置表
     * @private
     * @param {Object} route 必选的路由配置
     */
    _getRouteConf: function(route) {
      var obj = {},
        getList = function(curconf){
          return curconf.list || curconf.cp_list || curconf.app_list || curconf.classification_list;
        },
        fn = function(name, conf) {
          var list = getList(conf), p, o;
          if (!list) {
            // list不存在， 结束
            obj[name] = {
              name : name,
              value : conf
            };
          } else {
            // 递归list
            for (p in list) {
              fn(name + '.' + p, list[p]);
            }
            // 如果default_index存在，说明当前path要指向default_index
            if (conf.default_index) {
              obj[name] = obj[name + '.' + conf.default_index];
            } else {
              // 不存在default_index，说明是个独立的module, 复制除了list的值
              o = {};
              for (p in conf) {
                if (conf[p] !== list) {
                  o[p] = conf[p];
                }
              }
              obj[name] = {
                name : name,
                value : o
              };
            }
          }
        };
      // conf首次肯定有list, 放在外面， 是为了不用拼接name.
      var list = getList(route), p;
      for (p in list) {
        fn(p, list[p]);
      }
      obj["_default"] = obj[route.default_index];
      return obj;
    },

    /**
     *  框架加载完成之后的任务执行队列
     * @private
     * @param{Object} order   执行队列
     */
    _afterInit: function(order) {
      order.act && rc.pub(order.act, order.value);
    },


    /**
     *
     * 初始化
     * @param {Object} conf 必选的路由配置
     * @param {String} conf.route 表示路由配置表
     * @param {String} conf.url   [可选]默认的当前地址
     */
    init: function(conf) {
      rc.sub('TATAMI.FEATURESTART.PAGES', this._afterInit, this, true);
      rc.sub('EVENTS.HASHCHANGE', this._hashchange, this);
      rc.sub('PAGES.GOBACK', this.goback, this);

      var url = conf.url || location.href,
        hash = this._getFilterUrlBySymbol('#', url);
      this._routeMapping = this._getRouteConf(conf.route);
      this._doPagechangeAct(hash, true, url);
    }
  };

  /**
   *
   * 提供给module 和 control 使用的关于pages 的操作部分
   */
  rc.pages.pagesInterface = function() {
    var self = this;
    return {
      /**
       *  module 将内建pageschange 方法以减少对于pages 功能件的调用
       * @param {Object} urlObject      传递的需要改变的urlPath
       * @param {Boolean} isNotDecode     是否需要encode
       * @param {Boolean} isClear       是否需要清空之前的 queryString（指在hash后的部分）
       */
      pagesModify: function(urlObject, isNotDecode, isClear) {
        return self.pagesModify(urlObject, isNotDecode, isClear);
      },

      /**
       *  从location 或者 某个url 里解析出 hashkey
       * @param {String}key   需要去从url 上获得的hash key
       * @param {String}url   可选，从某个url 里获得
       */
      getHashKey: function(key, url) {
        return self.getHashKey(key, url);
      },

      /**
       *  从location 或者 某个url 里解析出 querykey
       * @param {String}key   需要去从url 上获得的query key
       * @param {String}url   可选，从某个url 里获得
       */
      getHashQueryKey: function(key, url) {
        return self.getHashQueryKey();
      },

      /**
       *  从location 或者 某个url 里解析出 query object
       * @param {String}url   可选，从某个url 里获得
       */
      getHashQueryObject: function(url) {
        return self.getHashQueryObject(url);
      },

      /**
       * @param{Number} backStep 需要回跳的步数
       * @param{Boolean} isReplaceStatus 是否取代当前的状态
       */
      goback: function(backStep, isReplaceStatus) {
        return self.goback(backStep, isReplaceStatus);
      },

      /**
       *  刷新当前页，启用此方式的时候其实并不会触发url 跳转，而是直接让module 重新处理
       */
      reflash: function() {
        return self.reflash();
      },

      /**
       *
       *  页面跳转（200）
       * @param {String} url    url 地址
       * @param {Object} query  传入需要跳转的参数，当只有2个参数时，可以表示isReplace
       * @param {Boolean} isReplace 是否替换地址
       */
      goPage: function(url, query, isReplace) {
        return self.goPage(url, isReplace);
      },

      /**
       * @param{String|Number} target     想获得的内容，可以是string可以是数字
       * @param{String} type            获得内容的格式
       * 获得在当前的历史纪录信息 (url || hashs)
       */
      getHistory: function(target, type) {
        return self.getHistory(target, type);
      }
    };
  };
})(window.Tatami);


/**
 * @class request
 * depend on event util
 * @author Jerrod
 *
 */
(function(rc, $) {
  var resultRule = {
    1: 'success',
    2: '参数异常',
    3: '服务端运行异常',
    4: '服务端内部错误',
    5: '服务端内部调用失败',
    6: '淘宝服务调用失败',
    7: '调用内部程序失败',
    8: '用户没有权限'
  };
  if (!rc) {
    rc = window.Tatami = {};
  }


  var regScriptTxt = /^(?:text|application)\/javascript/i, // 验证script 内容 (从mime 里来)
    regXmlType = /^(?:text|application)\/xml/i, // 验证 xml 的内容 (从mime 里来)
    ckJsonType = 'application/json', // 验证是否 json (从mime 里来)
    ckHtmlType = 'text/html',
    ckCssType = 'text/css',
    ckPlainType = 'text/plain'; // 验证是否 html (从mime 里来)

  /**
   * 判断mime 的类型
   * @param {String} mime   来自于header 里 'content-type' 的类型
   */
  function getMimeType(mime) {
    return mime === ckHtmlType ? 'html' :
      mime === ckJsonType ? 'json' :
        mime === ckCssType ? 'css' :
          mime === ckPlainType ? 'plain' :
            regScriptTxt.test(mime) ? 'script' :
              regXmlType.test(mime) ? 'xml' : 'text';
  }
  // 几种基本的请求类型集合
  var requireContentType = {
    script: 'text/javascript, application/javascript',
    json: ckJsonType,
    xml: 'application/xml, text/xml',
    html: ckHtmlType,
    text: ckPlainType
  };

  /**
   *
   * 单独封装的ajax，它支持和jq类似的处理逻辑，但是更简化
   * 目前暂时支持xhr1，另外需要支持到jsonp
   * @param {Object} settings     设置选项
   * @param {Object} settings.accepts     内容类型发送请求头（Content-Type）
   * @param {Boolean} settings.async      是否异步，默认true
   * @param {Function} settings.beforeSend  发送前的操作
   * @param {Boolean} settings.cache      是否会需要添加随机字串在后面从而不缓存，默认true
   * @param {Function} settings.complete    结束之后的调用，在success || error 后面
   * @param {Boolean|String} settings.contentType   (default: 'application/x-www-form-urlencoded; charset=UTF-8')
   * @param {Boolean} settings.crossDomain  是否需要跨域，默认false
   * @param {Object|String} settings.data   需要发送过去的内容，可以是对象也可以是字符串
   * @param {String} settings.dataType    需要返回的内容 (xml, json, script, or html)，我们默认不指定则为string
   * @param {Function} settings.fail      失败之后的执行操作
   * @param {Object} settings.headers     header 里的内容设置
   * @param {String} settings.jsonp     在一个JSONP请求中重写回调函数的名字。这个值用来替代在"callback=?"这种GET或POST请求中URL参数里的"callback"部分
   * @param {String} settings.jsonpCallback 为jsonp 指定一个特定的返回执行操作
   * @param {String} settings.method      发送方式，默认“get” （get，default）
   * @param {Function} settings.success   成功之后的回调（data，status，xhr）
   * @param {Function} settings.receiving   接受中的回调（data，status，xhr）
   * @param {Number} settings.timeout     超时时间
   * @param {String} settings.type      等同 method
   * @param {String} settings.url       需要发送的地址，默认相对当前地址
   * @param {String} settings.withCredentials    是否发送凭证信息
   *
   */
  function ajax(settings) {
    if (settings.dataType === 'jsonp' || settings.jsonp || settings.jsonpCallback) {
      return funcJsonp(settings);
    }
    var xhr = getXhr(),
      isGet = /get/i.test(settings.method) || /get/i.test(settings.type) || (!settings.method && !settings.type),
      isAsync = settings.async !== false, url = settings.url, handler, isBreak;

    var preHeaders = {}, mime;

    // 如果有需要传递 mime 的类型
    if (mime = requireContentType[settings.dataType]) {
      // FIXME 暂时不想要支持重写 overrideMimeType. 因为他会构成两次请求
      preHeaders['Accept'] = mime;
      mime = mime.split(',')[0]; // 如果遇到多选的条件, 则我们只需要第一个就可以了.
      // 重写需要传递的mime, xhr2 开始支持, 可以自定义前后端所需要格式
      xhr.overrideMimeType && xhr.overrideMimeType(mime);
    }

    // 如果有设置接受的类型
    if (settings.contentType ) {
      preHeaders['Content-Type'] = settings.contentType || 'application/x-www-form-urlencoded';
    }

    // 如果有设置头信息
    settings.headers && rc.util.map(settings.headers, function(it, key) {
      preHeaders[key] = it;
    }, this);
    var dataType = settings.dataType;
    xhr.onreadystatechange = function() {
      var trunk, rState = xhr.readyState, isError;
      if (isBreak) { return;}
      if (rState >= 3) {
        // >=3 就已经开始接收数据了
        if (!dataType) {
          dataType = getMimeType(xhr.getResponseHeader('content-type'));
        }
        try {
          switch(dataType) {
            case 'script':
              eval(xhr.responseText);
              break;
            case 'xml':
              trunk = xhr.responseXML;
              break;
            case 'json':
              trunk = rc.util.jsonParse(xhr.responseText);
              break;
            default:
              trunk = xhr.responseText;
              break;
          }
        } catch(e) {
          isError = true;
          settings.fail && settings.fail(xhr, e);
        }
        clearTimeout(handler);
        if (isError) { return; }
        if (rState === 3) {
          settings.receiving && settings.receiving(xhr, trunk);
        } else if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304 || xhr.status === 0) {
          // 成功 || 被跳转了 || 失败, 被abort 掉了, 都应该走到这个流程里来
          settings.success && settings.success(trunk, xhr);
          settings.complete && settings.complete(xhr, trunk);
        } else {
          settings.fail && settings.fail(xhr, trunk);
          settings.complete && settings.complete(xhr, trunk);
        }
      }
    };
    if (isGet && settings.data) {
      url = rc.pages.dataJoinUrl(url, settings.data);
    }
    xhr.open(isGet ? 'get' : 'post', url, isAsync);

    //设置跨域是否将cookie等凭证发送到服务器
    settings.withCredentials && (xhr.withCredentials = true);

    // 设置全部请求的头
    rc.util.map(preHeaders, function(it, key) {
      xhr.setRequestHeader(key, it);
    }, this);

    if (typeof settings.timeout === 'number') {
      handler = setTimeout(function() {
        xhr.onreadystatechange = null;
        isBreak = true;
        xhr.abort();
        settings.fail && settings.fail(xhr, settings);
        settings.complete && settings.complete(xhr, settings);
      }, settings.timeout);
    }

    var sData = settings.data, tpSData = typeof sData;
    xhr.send(isGet || sData === undefined ? null :
      /^number|string$/i.test(tpSData) ? sData :
        /^array$/i.test(tpSData) ? sData.join(',') : rc.pages.dataToQuerystr(settings.data));

    // 如果在beforeSend 里直接就阻止了, 我们就不往下进行了.
    if (settings.beforeSend && settings.beforeSend(xhr, settings) === false) {
      xhr.abort();
      return xhr;
    };
    return xhr;
  }

  // 暴露接口用于测试
  window.Ajax = ajax;

  /**
   *
   * 通过创建script 标签并且加载解析其内容完成跨域的请求操作
   * @param {Object} settings     设置选项
   * @param {Function} settings.beforeSend  发送前的操作
   * @param {Boolean} settings.cache      是否会需要添加随机字串在后面从而不缓存，默认true
   * @param {Function} settings.complete    结束之后的调用，在success || error 后面
   * @param {Object|String} settings.data   需要发送过去的内容，可以是对象也可以是字符串
   * @param {Function} settings.fail      失败之后的执行操作
   * @param {Object} settings.headers     header 里的内容设置
   * @param {Function} settings.success   成功之后的回调（data，status，xhr）
   * @param {Number} settings.timeout     超时时间
   * @param {String} settings.url       需要发送的地址，默认相对当前地址
   * @param {String} settings.jsonp     在一个JSONP请求中重写回调函数的名字。这个值用来替代在"callback=?"这种GET或POST请求中URL参数里的"callback"部分
   * @param {String} settings.jsonpCallback 为jsonp 指定一个特定的返回执行操作
   *
   */
  function funcJsonp(settings) {
    var script = document.createElement('script'), header = document.getElementsByTagName('header')[0] || document.documentElement,
      url = settings.url, sdata = funcJsonp.getPresendData(settings.data),
      curTime = +new Date(),
      onLoadedKey, isNeedLoadedFunc, isBreak, handler;

    onLoadedKey = 'jsonpcall_' + curTime + '_' + Math.floor(Math.random() * 1000);
    sdata = funcJsonp.filterKeyCallback(settings.jsonp, settings.jsonpCallback, onLoadedKey, sdata, function(_isNeedLoadedFunc) {
      isNeedLoadedFunc = _isNeedLoadedFunc;
    });
    // 不缓存
    if (settings.cache === false) {
      sdata._ = curTime;
    }
    if (typeof settings.timeout === 'number') {
      handler = setTimeout(function() {
        isBreak = true;
        settings.fail && settings.fail(script, settings);
        settings.complete && settings.complete(script, settings);
      }, settings.timeout);
    }
    var receiveData;
    // 如果是用的我们自己的已经存在的函数
    if (isNeedLoadedFunc) {
      window[onLoadedKey] = function(data) {
        clearTimeout(handler);
        receiveData = data;
        settings.success && settings.success(data, script, settings);
        settings.complete && settings.complete(script, settings);
        delete window[onLoadedKey];
      };
    }
    // 如果在beforeSend 里直接就阻止了, 我们就不往下进行了.
    if (settings.beforeSend && settings.beforeSend(script) === false) {
      return script;
    };
    url = rc.pages.dataJoinUrl(url, sdata);
    script.src = url;
    script.crossorigin = 'crossorigin';
    script.type = 'text/javascript';
    // 加载完成的时候window[onLoadedKey]那段代码自然会执行，所以不需要去额外处理了。
    script.onerror = function() {
      if (isBreak) { return;}
      isBreak = true;
      clearTimeout(handler);
      settings.fail && settings.fail(script, {});
      settings.complete && settings.complete(script);
    };
    header.appendChild(script);
    return script;
    //settings.beforeSend
  }

  /**
   * funcJsonp 的私有方法，用于获得一个预备发送的数据
   * @param {Object} data 需要去转化的数据
   */
  funcJsonp.getPresendData = function(data) {
    if (typeof data === 'object') {
      return data;
    } else if (typeof data === 'string') {
      return rc.pages.getQueriesObject(data);
    } else {
      return {};
    }
  };

  /**
   * funcJsonp 的私有方法，用于过滤掉callback 的key 或者索引的value
   * @param {String} jsonp      在执行函数里对应的执行方法的key，如 xx= 代替了 callback=
   * @param {String} jsonpCallback  在执行函数里对应的执行方法的方法名, 如 xx=dd
   * @param {String} onLoadedKey  在执行函数里对应的执行方法的方法名, 如 xx=dd
   * @param {Object} sdata      当前已经存在的数据集合
   * @param {Function} checkNeedLoadedFunc  回调判断是否需要使用系统自己的函数名
   */
  funcJsonp.filterKeyCallback = function(jsonp, jsonpCallback, onLoadedKey, sdata, checkNeedLoadedFunc) {
    if (jsonp) {
      if (sdata.callback) {
        if (jsonpCallback) {
          sdata[jsonp] = jsonpCallback;
        }
        delete sdata.callback;
      } else {
        sdata[jsonp] = jsonpCallback || onLoadedKey;
        checkNeedLoadedFunc && checkNeedLoadedFunc(sdata[jsonp] === onLoadedKey);
      }
    } else {
      if (sdata.callback && jsonpCallback) {
        sdata.callback = jsonpCallback;
      } else {
        sdata.callback = jsonpCallback || onLoadedKey;
        checkNeedLoadedFunc && checkNeedLoadedFunc(sdata.callback === onLoadedKey);
      }
    }
    return sdata;
  };

  /**
   * 获得一个 xhr 对象
   * @return {Object} xhr       返回一个xhr 对象
   */
  function getXhr() {
    var xhr, xhrList, i, ni;
    try {
      xhr = new XMLHttpRequest();
    } catch(e) {
      xhrList = ["Msxml3.XMLHTTP", "Msxml2.XMLHTTP", "Microsoft.XMLHTTP"];
      for (i = 0,ni = xhrList.length; i < ni; i++) {
        try {
          xhr = new ActiveXObject(xhrList[i]);
        } catch(e) {continue;}
      }
    }
    return xhr;
  }

  //SERVER_CALL 将单一化功能，可以订阅派送


  // 封装 ajax 的数据传递
  /**
   *  ajax 呼起服务器内容的方法
   * @param{Object} data      需要传递的数据
   * @param{String} requestAddr 请求地址
   * @param{String} dataType    json/xml/txt
   * @param{String} method      方法,get/post
   * @param{Function} callback  成功回调
   * @param{Function} fail    失败回调
   * @param{Object} headers   头信息
   * @param{Boolean} isSync   是否同步
   * @param{Number} timeout   过期时间
   * @param{Boolean} withCredentials 凭证带入
   */
  function ajaxCall(data, requestAddr, dataType, method, callback, fail, headers, isSync, timeout, withCredentials) {
    if (!data || !requestAddr) {
      return;
    }
    var isComplete, params = {
      dataType: dataType || 'json',
      type: method || 'get',
      success: function(sd) {
        var _d;
        if (params.dataType == 'json') {
          if (typeof sd === 'object') {
            _d = sd;
          } else {
            _d = rc.util.jsonParse(sd);
          }

          // ajax 里我们只接受我们自己的格式
          if (!_d) {
            conf.isSuccess = false;
            conf.result = 'format error';
            conf.endTime = new Date();
            fail && fail(_d, conf);
            isComplete = true;
            return;
          }
          // 100 表示我们的成功
          if (/^1(\d{2})?$/.test(_d.result)) {
            callback && callback(_d);
          } else if ('700' == _d.result){
            rc.pub('common.sys_session_invalid');
          } else if ('702' == _d.result){
            //session 超时
            rc.pub('common.sys_session_invalid');
          } else if ('704' == _d.result){
            //短授权
            rc.pub('common.short_sign');
          } else {
            conf.isSuccess = false;
            conf.result = 'api result not 100';
            conf.endTime = new Date();
            fail && fail(_d, conf);
          }
          isComplete = true;
          return;
        }
        // 字符串 或者 xml
        _d = sd;
        if (!_d) {
          conf.isSuccess = false;
          conf.result = 'no content';
          conf.endTime = new Date();
          fail && fail(_d, conf);
          isComplete = true;
          return;
        }
        callback && callback(_d);
      },
      fail: function(xhr) {
        //_d.readyState === 0, 表示我们abort 掉的
        if (!xhr.readyState) {
          isComplete = true;
          return;
        }
        conf.isSuccess = false;
        conf.result = 'ajax error';
        conf.endTime = new Date();
        isComplete = true;
        fail && fail(xhr, conf);
      },
      complete: function(xhr) {
        // 已经完成过的，我们不在做处理了
        if (isComplete || !xhr.readyState) {
          return;
        }
        var sd;
        if (params.type == 'json') {
          sd = rc.util.jsonParse(xhr.responseText);
        } else {
          sd = xhr.responseText;
        }
        conf.isSuccess = false;
        conf.result = 'not match any code';
        conf.endTime = new Date();
        fail && fail(xhr, conf);
      },
      async: !isSync
    }, conf = {
      requestAddr: requestAddr,
      requestData: data,
      method: params.type,
      dataType: params.dataType,
      startTime: new Date()
    };
    if (params.type === 'get') {
      params.url = rc.pages.dataJoinUrl(requestAddr, data || '');
    } else {
      params.url = requestAddr;
      params.data = data;
    }
    if (headers && typeof headers === 'object') {
      params.headers = headers;
    }

    withCredentials && (params.withCredentials = true);

    return ajax(params);
  }

  /**
   *  ajax 呼起服务器内容的方法
   * @param{Object} data      需要传递的数据
   * @param{String} requestAddr 请求地址
   * @param{Function} callback  成功回调
   * @param{Function} fail    失败回调
   * @param{Number} timeout   过期时间
   */
  function jsonpCall(data, requestAddr, callback, fail, timeout) {
    var params = {
      dataType: 'jsonp',
      success: function(data) {
        callback && callback(data);
      },
      error: function(xhr) {
        // 默认如果存在，则有可能timeout
        fail && fail(xhr, {
          isSuccess: false,
          result: 'timeout',
          requestAddr: requestAddr,
          requestData: data
        });
      },
      jsonpCallback: 'jsonCallback'
    };
    if (timeout) {
      params.timeout = timeout;
    }
    params.url = rc.pages.dataJoinUrl(requestAddr, data || '');
    return ajax(params);
  }

  /**
   * @param{Object} data      需要传递的数据
   * @param{String} requestAddr 请求地址
   * @param{String} method    方法,get/post
   * @param{Function} callback  成功回调
   * @param{Number} timeout   过期时间
   *
   */
  function formSend(data, requestAddr, method, callback, timeout) {
    if (!data || !requestAddr) {
      return;
    }
    var ifr = document.createElement('iframe'), ifrDoc, handler, isEnd, conf;
    ifr.style.cssText = 'display: none;';
    document.body.appendChild(ifr);
    ifrDoc = ifr.contentDocument;
    ifr.onload = function() {
      isEnd = true;
      conf.endTime = new Date();
      conf.isSuccess = true;
      conf.result = 'postEnd';
      callback && callback(conf);
      document.body.removeChild(ifr);
      ifr = null;
    };
    if (timeout) {
      handler = setTimeout(function() {
        if (isEnd) {return;}
        conf.endTime = new Date();
        conf.isSuccess = false;
        conf.result = 'timeout';
        callback && callback(conf);
        document.body.removeChild(ifr);
        ifr = null;
      }, timeout);
    }
    var form = document.createElement('form'), texA, i;
    form.method = method || 'post';
    form.action = requestAddr;
    for (i in data) {
      // 使用 textarea 可以获得更完善的内容
      texA = document.createElement('textarea');
      texA.name = i;
      texA.value = data[i];
      form.appendChild(texA);
    }
    ifrDoc.body.appendChild(form);
    form.submit();
    conf = {
      requestAddr: requestAddr,
      requestData: data,
      method: method,
      startTime: new Date()
    };
  }

  /**
   * 通过img 来发起的get 请求
   * @param{Object} data      需要传递的数据
   * @param{String} requestAddr 请求地址
   * @param{Function} callback  成功回调
   * @param{Number} timeout   过期时间
   *
   */
  function httpGetByImg(data, requestAddr, callback, timeout) {
    if (!data || !requestAddr) {
      return;
    }
    var img = new Image(), i, sArr = [], src, handler, isEnd, conf;
    for (i in data) {
      sArr.push(i + '=' + data[i]);
    }
    src = requestAddr + (sArr.length ? (/\?/.test(requestAddr) ? '&' : '?') + sArr.join('&') : '');
    if (timeout) {
      handler = setTimeout(function() {
        if (isEnd) {return;}
        conf.endTime = new Date();
        conf.isSuccess = false;
        conf.result = 'timeout';
        callback && callback(conf);
        img = null;
      }, timeout);
    }
    conf = {
      requestAddr: requestAddr,
      requestData: data,
      method: 'get',
      startTime: new Date()
    };
    img.onload = function() {
      isEnd = true;
      conf.endTime = new Date();
      conf.isSuccess = true;
      conf.result = 'postEnd';
      callback && callback(conf);
      img = null;
    };
    img.onerror = function() {
      isEnd = true;
      conf.endTime = new Date();
      conf.isSuccess = false;
      conf.result = 'load image error';
      callback && callback(conf);
      img = null;
    };
    img.src = src;
  }

  var request = {
    _apiList: {},
    _reqList: {},

    // 来自于其他第三方的访问模式
    _plugins: {},
    // 过期时间
    _sysTimeout: 20,

    /**
     *  获得response 返回的key
     * @private
     * @param{Object}conf     来自于请求的参数
     */
    _getResponsePubKey: function(conf) {
      var pubKey = 'SERVER.REQUEST_RESPONSE';
      switch(conf.comefrom) {
        case 'MODULES': pubKey += '.MODULES'; break;
        case 'CONTROLS': pubKey += '.CONTROLS'; break;
        default:
        case 'OTHERS': pubKey += '.OTHERS'; break;
      }
      return pubKey;
    },

    /**
     *  在请求成功之后, 发起一个请求, 或者直接执行他的成功事件
     * @private
     * @param{Object} conf      来自于请求的参数
     * @param{Object} api     api 的属性
     */
    _getApiSuccess: function(conf, api) {
      var that = this;
      return function(data) {
        // 完成之后删除操作
        delete that._reqList[conf.reqKey];
        // 如果是直接处理返回值
        if (conf.isForceResponse) {
          conf.success && conf.success.call(conf.context || rc.request, data);
          return;
        }
        conf.response = data;
        conf.status = 'success';
        rc.pub(that._getResponsePubKey(conf), conf);
      };
    },

    /**
     *  在请求失败之后, 发起一个请求, 或者直接执行他的失败事件
     * @private
     * @param{Object} conf      来自于请求的参数
     * @param{Object} api     api 的属性
     */
    _getApiError: function(conf, api) {
      var that = this;
      return function(originObject, errorConf) {
        // 派发给全局的错误接受器
        rc.pub('ERROR.REQUEST_API', {
          originObject: originObject,
          errorConf: errorConf
        });
        // 完成之后删除操作
        delete that._reqList[conf.reqKey];
        if (conf.isForceResponse) {
          conf.error && conf.error.call(conf.context || rc.request, errorConf, originObject);
          return;
        }
        conf.response = originObject;
        conf.errorConf = errorConf;
        conf.status = 'fail';
        rc.pub(that._getResponsePubKey(conf), conf);
      };
    },

    /**
     *  获得具体的呼起api 的方法操作
     * @private
     * @param{Object} conf      来自于请求的参数
     */
    _getApiMethod: function(conf) {
      var apiObject = this.getAPIParams(conf.api);
      if (!apiObject) {
        // 只能够从我们的既定api 列表里去做查询
        return;
      }
      // 内部api 调用
      var callback, params = conf.params || {}, i;
      if (apiObject.params !== undefined) {
        for (i in apiObject.params) {
          // 如果已经存在了数据，以后面的数据为主
          if (params[i] === undefined) {
            params[i] = apiObject.params[i];
          }
        }
      }
      if (apiObject.server === 'rc') {
        if (apiObject.dataType === 'jsonp') {
          this._reqList[conf.reqKey] = jsonpCall(params, apiObject.url, this._getApiSuccess(conf, apiObject), this._getApiError(conf, apiObject), apiObject.timeout || this._sysTimeout);
        } else {
          //ajax
          this._reqList[conf.reqKey] = ajaxCall(params, apiObject.url, apiObject.dataType, apiObject.method, this._getApiSuccess(conf, apiObject), this._getApiError(conf, apiObject), apiObject.headers || this._headers, apiObject.isSync, apiObject.timeout || this._sysTimeout, apiObject.withCredentials);
        }
      } else if (this._plugins[apiObject.server]){
        this._reqList[conf.reqKey] = this._plugins[apiObject.server](apiObject.cmd, params, apiObject.method, this._getApiSuccess(conf, apiObject), this._getApiError(conf, apiObject));
      }
    },

    /**
     * @private
     * @param{Object} conf        来自于请求的参数
     * @param conf.api api,       api 名字
     * @param conf.mdulName mdulName, 模块名字
     * @param conf.reqKey reqKey,   由模块名, api，与时间戳构成的一个临时唯一值
     * @param conf.act 'request',   请求动作
     * @param conf.params       发出的请求
     * @param conf.formDatabase     是否来自于本地的缓存
     */
    _requestAPI: function(conf) {
      var reqCall;
      switch(conf.act) {
        case 'request':
          // 检查是否需要从本地获取数据或者其他操作
          this._getApiMethod(conf);
          break;
        case 'abort':
          // 我们主动abort 掉了请求
          reqCall = this._reqList[conf.reqKey];
          if (reqCall) {
            reqCall.abort && reqCall.abort();
            delete this._reqList[conf.reqKey];
          }
          break;
      }
    },

    /**
     *  通过api 的名字去获得API 的基本的属性结构
     * @param{String} apiName   api 的名字
     */
    getAPIParams: function(apiName) {
      return this._apiList[apiName] || null;
    },

    /**
     *   直接发起某种请求
     * @private
     *
     * @param {Object} conf   请求的短传递
     * @param conf.method
     * @param conf.data
     * @param {String}          conf.dataType     jsonp, img, form, ajax, plugin
     * @param {String}          conf.requestAddr
     * @param {Function}        conf.callback     [jsonp, img, form 专有]
     * @param {String}          conf.success      [ajax, plugin 所有]
     * @param {Object}          conf.error        [ajax, plugin 所有]
     * @param {Number}          conf.timeout
     * @param {String}          conf.server       [plugin 所有]
     */
    _requestReq: function(conf) {
      switch(conf.dataType) {
        case 'jsonp':
          jsonpCall(conf.data, conf.requestAddr, conf.callback, conf.callback, conf.timeout);
          break;
        case 'img':
          httpGetByImg(conf.data, conf.requestAddr, conf.callback, conf.timeout);
          break;
        case 'form':
          formSend(conf.data, conf.requestAddr, conf.method, conf.callback, conf.timeout);
          break;
        case 'json':
          ajaxCall(conf.data, conf.requestAddr, conf.dataType, conf.method, conf.success || conf.callback, conf.error || conf.callback, conf.headers || this._headers, conf.isSync, conf.timeout || this._sysTimeout);
          break;
        case 'plugin':
          this._plugins && this._plugins[conf.server] && this._plugins[conf.server](conf.cmd, params, conf.method, conf.success || conf.callback, conf.error || conf.callback);
          break;
      }
    },

    /**
     *  框架加载完成之后的任务执行队列
     * @private
     * @param{Array} orders   执行队列
     */
    _afterInit: function(orders) {
      var i = 0, ni = orders.length, it;
      for (; i < ni; i++) {
        it = orders[i];
        if (it.key !== 'SERVER') {
          continue;
        }
        rc.pub(orders[i].act, orders[i].value || null);
      }
    },

    /**
     *
     *  强制直接呼起 api call
     * @param {Object} conf   传递的数据
     * @param {Object} context  传递的数据
     */
    forceAPICall: function(conf, success, fail, context) {
      var params = rc.util.deepClone(conf);
      params.success = success;
      params.error = fail;
      // 产生一个随机的参数
      params.reqKey = 'forceRequest::' + conf.api + '::' + (+new Date()) + '::' + Math.floor(Math.random() * 100);;
      params.act = 'request';
      params.context = context;
      params.isForceResponse = true;
      this._getApiMethod(params);
    },

    /**
     *
     *   不通过事件派发而直接发起某个请求
     * @param {Object}conf    请求的短传递
     * @param conf.method
     * @param conf.data
     * @param conf.dataType   jsonp, img, form, ajax, plugin
     * @param conf.requestAddr
     * @param conf.callback [jsonp, img, form 专有]
     * @param conf.callback.success [ajax, plugin 所有]
     * @param conf.callback.error [ajax, plugin 所有]
     * @param conf.timeout
     * @param conf.server [plugin 所有]
     */
    forceCall: function(conf, success, fail) {
      var params = rc.util.deepClone(conf);
      params.success = success;
      params.error = fail;
      params.callback = success;
      this._requestReq(params);
    },

    /**
     * @param{Object} conf      初始化serverCall 时的配置方法
     * @param     conf.plugins    {Object}
     * @param     conf.timeout    {Number}
     * @param     conf.apiList    {Object}
     * @param     conf.headers    {Object} 默认的头文件
     */
    init: function(conf) {
      // 后续所有的其他接口呼起方式，都通过plugin 来做调用
      var plugins = conf.plugins;
      if (plugins) {
        if (plugins.request) {
          this._plugins = plugins.request;
        }
        if (plugins.reqHeaders) {
          this._headers = plugins.reqHeaders;
        }
      }
      if (conf.timeout) {
        this._sysTimeout = conf.timeout;
      }
      this._apiList = conf.apiList || {};
      // 一次调用, 初始化
      rc.sub('TATAMI.FEATURESTART', this._afterInit, this, true);
      rc.sub('SERVER.REQUEST_SEND', this._requestAPI, this);
      rc.sub('SERVER.REQUEST_REQ', this._requestReq, this);
    }
  };

  rc.request = request;
})(window.Tatami, window.jQuery);


/**
 * @class
 * @author Jerrod
 */
(function(rc) {

  if (!rc) {
    window.Tatami = rc = {};
  }

  /**
   * @class modules.Module
   * @param {Object} config
   * @param {String} name          模块名称, 必须存在且唯一
   * @param {String} depend          [可选] 模块依赖的父模块, 如为空则表示他是祖模块
   * @param {String} type          [可选] 模块的类别, 暂时有 basic 可选. basic 表示该模块是整个业务的基本的模块, 一开始就存在并且不会被销毁
   *                     normal     普通类别，为空则为普通类别
   *                     sub      子类别，某个模块下的子模块
   *                     basic    静态模块
   * @param {String} viewName            [可选] view 件的名字
   * @param {Function} init            [可选] 初始化模块. 所有的模块在加载的时候就会被初始化. 特别对于basic 来说, 他是唯一会被启用的入口
   * @param {Function} activation      [可选] 第一次初始化时执行的相应的操作，（如果type＝＝basic，则其实他和init 方法类似，他会在init方法之后执行），否则，会在那个模块的第一次update之前执行
   * @param {Function} disabled        [可选] 模块被隐藏(未销毁)时出发的函数, (销毁时也会调用该函数先), 与之相对的是 update
   * @param {Function} update          [可选] 模块被触发时发出的函数(包括模块自身的更改)
   * @param {Function} destroy         [可选] 模块被销毁时调用的函数
   * @param {Object} events            [可选] 模块订阅的事件集合. 该订阅的事件, 会在模块销毁时解绑.
   * @param {Object} methodsMap        [可选] 所有的可操作方法集合都会放到这个里面来
   * @param {Object} dataMap           [可选] 所有的可获得的数据集合都会放到这个里面来
   * @param {Object} statusMap         [可选] 所有的可获得的状态集合都会放到这个里面来
   * @param {Object} ctrlsMap          [可选] 所有的放置组件模块的列表
   * @param {Boolean} hasDepence       [可选] 是否对于上一级有依赖
   *
   * ============= 以下为新增的部分
   * @param {Object} reqList         [暂忽略] [请求的api的列表, 由key 和 value ('api 名字') 来对应], 这样的用意是, 后续会限制模块对于不同api的调用权限.
   * 操作内容
   * @param {Function} isMdulActive      [可选] 替代 is_mdul_active 用的函数, 方法源一致, 但是会和新的init, ready 等区分使用, 状态识别更多.
   * @param {Function} isMdulInited      [可选] 该模块是否被初始化
   * @param {Function} isMdulActivate    [可选] 重要，区别 isMdulActive 和 init，该判断表示该模块第一次正式的被初始化（因为basic和normal模块的初始化进程是不一样的）
   * @param {Object} view              [可选] 与该模块绑定的view 的实例.
   * @param {Function} request       [可选] 通过  request 去调用api, 这个里面将会去做容错 和 是否需要判定模块是否激活等处理.
   * @param {Function} pages         [可选] 引入pages 的可选操作类别，减少用户去pages里查寻api以及api变化之后出现的问题
   * @param {Function} getMethods      [可选] 获得私有方法
   * @param {Function} getMdulData     [可选] 获得私有对象
   * @param {Function} setMdulData     [可选] 设置私有对象
   * @param {Function} getStatus       [可选] 获得私有状态
   * @param {Function} setStatus       [可选] 设置私有状态
   * @param {Function} getCtrl       [可选] 获得ctrl 组件
   *
   */
  function Module(config) {
    // 预留cofing 做备份
    this.config = config;

    this.name = config.name;
    this.depend = config.depend || '';
    this.type = config.type || '';
    this.hasDepence = !!config.hasDepence;

    // 视图模块正式成为可使用区域
    this.viewName = config.viewName || '';

    // view 下的模块
    this._vid = 'view.' + this.name;

    // 初始化时可执行的操作
    this._isInit = false;

    // 是否处于初始化启动状态
    this._isActivate = false;

    // 模块是否处于被激活状态
    this._isMdulActive = false;

    // 来自config 里的初始化函数
    this.init = config.init || function() {};
    // 来自config 的初始化之后的相应操作
    this.activation = config.activation || function() {};
    // 来自config 里的更新函数 (被激活并且被响应时)
    this.update = config.update || function() {};
    // 来自config 里的销毁函数
    this.destroy = config.destroy || function() {};
    // 来自config 里的被disabled 时触发的函数
    this.disabled = config.disabled || function() {};


    // methods 的列表
    this.methodsMap = config.methodsMap || {};
    // dataMap 的列表
    this.dataMap = config.dataMap || {};
    // 备份之前的data
    this._dataMap = {};
    // status 的列表
    this.statusMap = config.statusMap || {};
    // 备份到之前的status
    this._statusMap = {};
    // ctrls 的列表
    this.ctrlsMap = config.ctrlsMap || {};
    // 用于收集来自与 controls 的组件
    this._ctrlsMap = {};

    // 模块的事件集合
    this.events = config.events || {};

    // 单体view 的引用
    this.view = null;

    // 发送的请求列表
    this._requestList = {};
    this._requestIndex = 0;

    // 实例化logs
    this.logs = new rc.logs.Logs({
      name: this.name
    });
  }

  Module.prototype = {

    /**
     *  获得本地的缓存数据
     * @param{String}key    键值
     * @param{String}type   类别 session/storage，默认storage
     */
    getLocalData: function(key, type) {
      return rc.localcache.get(key, type);
    },

    /**
     *  设置本地的缓存数据
     * @param{String}key    键值
     * @param{Object}value    值
     * @param{String}type   类别 session/storage，默认storage
     */
    setLocalData: function(key, value, type) {
      return rc.localcache.set(key, value, type);
    },

    // 在页面初始化之前完成view的调用，如果有的情况下
    /**
     * @private
     * @param {Object} hashs 当前的解析自url的hash对象
     * 在展示业务承载页面之前先将页面渲染完成
     */
    _beforeActivation: function(hashs) {
      // 前提需要是提供view 的name，用于做传递
      var data = hashs || {};
      if (this.viewName) {
        data.mdulName = this.name;
        this.view = rc.views.get(this.viewName);
        this.view.render(data, this.viewName);
      }
    },

    /**
     * @private
     * @param {Object} hashs 当前的解析自url的hash对象
     * 在完成页面的承载之后执行的其他操作
     */
    _afterActivation: function(hashs) {
      rc.pub(this.name + '.MDUL_ACTIVED', true);
    },

    /**
     *  module 模块的第一初始化操作，他会在update， init里都得到响应
     *
     * @param {Object} hashs      当前的解析自url的hash对象
     */
    funcInit: function(hashs) {
      if (this._isActivate) {
        return;
      }
      // 针对 basic 的初始化情况，一次性会将所有的初始化操作都执行完成。
      if (this.type === 'basic') {
        this._isInit = true;
        this.init(hashs);
        this._beforeActivation(hashs);
        this._subEventsAct(true);
        this._ctrlsBindAct(true);
        this._restoreMdul(true);
        this._afterActivation(hashs);
        this._isActivate = true;
        this._isMdulActive = true;
        this.activation(hashs);
        return;
      }
      // 针对普通都情况，执行两步操作，第一步，完成init操作。
      if (!this._isInit) {
        this._isInit = true;
        this.init(hashs);
        this._subEventsAct(true);
        this._ctrlsBindAct(true);
        this._restoreMdul(true);
        return;
      }
      // 第二步，当他被update时，再次触发该操作
      if (!this._isActivate) {
        this._beforeActivation(hashs);
        this._afterActivation(hashs);
        this._isActivate = true;
        this.activation(hashs);
      }
    },

    /**
     *  我们会在destroy 的时候给重置之前所有的选项, 私有操作不理会
     * @private
     * @param {Boolean} isBind      是否重新计算需要处理的数据对象
     */
    _restoreMdul: function(isBind) {
      var i, reg = /^\P\:/;
      if (isBind) {
        for (i in this.dataMap) {
          if (!reg.test(i)) {
            this._dataMap[i] = rc.util.deepClone(this.dataMap[i]);
          }
        }
        for (i in this.statusMap) {
          if (!reg.test(i)) {
            this._statusMap[i] = !!this.statusMap[i];
          }
        }
        return;
      }
      // 如果是destroy，则还原非私有的所有对象
      for (i in this._dataMap) {
        this.dataMap[i] = rc.util.deepClone(this._dataMap[i]);
      }
      for (i in this._statusMap) {
        this.statusMap[i] = !!this._statusMap[i];
      }
    },

    /**
     *  监听/移除 本模块的sub 队列
     * @private
     * @param {Boolean} isBind      是否绑定全局监听事件
     */
    _subEventsAct: function(isBind) {
      var events = this.events, i;
      if (!events) {
        return;
      }
      var mdulName = this.name, key, act = isBind ? 'sub' : 'removeSub';
      for (i in events) {
        // >>xxxx 表示缩写，再绑定的时候会自动的将前面的内容替换成该模块名
        key = /^\>\>/.test(i) ? mdulName + i.replace(/^\>\>/, '.') : i;
        rc[act](key, events[i], this);
      }
      rc[act]('MODULES.RESPONSE_RECEIVER.' + this.name, this.response, this);
    },

    /**
     *  初始化组件, 对于非ctrl 的不做处理，因为不知道是否下次还会用得到
     * @private
     * @param {Boolean} isBind      是否绑定组件监听
     */
    _ctrlsBindAct: function(isBind) {
      var i, ctrls = this.ctrlsMap,
        _ctrls = this._ctrlsMap, rcc = rc.controls;
      if (isBind) {
        for (i in ctrls) {
          if (typeof ctrls[i] === 'string') {
            this._ctrlsMap[i] = rcc.get(ctrls[i], this.name);
          }
        }
      } else {
        for (i in _ctrls) {
          _ctrls[i].funcDestroy && _ctrls[i].funcDestroy();
          delete _ctrls[i];
        }
        this._ctrlsMap = {};
      }

    },


    // 模块是否被激活
    isMdulActive: function() {
      return this._isMdulActive;
    },

    // 该模块是否被初始化
    isMdulInited: function() {
      return this._isInit;
    },

    // 重要，区别 isMdulActive 和 init，该判断表示该模块第一次正式的被初始化（因为basic和normal模块的初始化进程是不一样的）
    isMdulActivate: function() {
      return this._isActivate;
    },


    /**
     * getMethod 方法的兄弟篇，修改了必须要组装成数组才能够传递的方式
     * @param {String} name  所要选择的返回参数名
     */
    getMethod: function(name) {
      var args = [].slice.call(arguments, 1);
      return this._getFuncFromMap('methodsMap', name, args);
    },

    /**
     *  获得mdul的数据对象里的值
     * @param {String} name  mdul对象里的类名
     */
    getMdulData: function(name) {
      return this._getMdulProp('dataMap', name);
    },

    /**
     *  设置mdul的数据对象里的值，并且返回
     * @param {String} name   mdul对象里的类名
     * @param {String} key    mdul对象里的key值
     * @param {Object} value  mdul对象里的值
     */
    setMdulData: function(name, key, value) {
      var args = arguments, oldData;
      if (args.length === 2) {
        return this._setMdulProp('dataMap', name, args[1]);
      } else if (args.length === 3) {
        oldData = this.getMdulData(name);
        if (typeof oldData === 'object' && oldData[key]) {
          oldData[key] = value;
          return this._setMdulProp('dataMap', name, oldData);
        }
        return false;
      }
      return false;
    },

    /**
     *  获得mdul的状态对象里的值
     * @param {String} name  mdul对象里的类名
     */
    getStatus: function(name) {
      return this._getMdulProp('statusMap', name);
    },

    /**
     *  设置mdul的状态对象里的值，并且返回
     * @param {String} name   mdul对象里的类名
     * @param {Object} value  mdul对象里的值
     */
    setStatus: function(name, value) {
      return this._setMdulProp('statusMap', name, value);
    },

    /**
     *  获得mdul 对象里相应的name 下的值.
     * @private
     * @param {String} type  所选择的类别
     * @param {String} name  所要选择的返回参数名
     */
    _getMdulProp: function(type, name) {
      if (!this[type] || this[type][name] === undefined) {
        return false;
      }
      return this[type][name];
    },

    /**
     *  mdul 对象里相应的name 下的值，并且返回
     * @private
     * @param {String} type  所选择的类别
     * @param {String} name  所要选择的返回参数名
     * @param {Object | Boolean} value    所需要设置的值
     */
    _setMdulProp: function(type, name, value) {
      if (value === undefined || !this[type] || this[type][name] === undefined || (type === 'statusMap' && typeof value !== 'boolean')) {
        return false;
      }
      return this[type][name] = value;
    },

    /**
     *  返回该ctrl 实例
     * @param {String} name  所要ctrl名
     *      [String] method 需要传递的control 的方法名
     *      [Arugments] args 会传递过去的参数
     */
    getCtrl: function(name, method, args) {
      var args2;
      if (arguments.length === 1) {
        return this._ctrlsMap[name] || this.ctrlsMap[name];
      } else if (arguments.length >= 2) {
        // this._ctrlsMap[name]
        if (this._ctrlsMap[name]) {
          args2 = [].slice.call(arguments, 1);
          return this._ctrlsMap[name].getMethod.apply(this._ctrlsMap[name], args2);
        }
        return this.ctrlsMap[name][method] ?
          this.ctrlsMap[name][method].apply(this.ctrlsMap[name], [].slice.call(arguments, 2)) : false;
      }
      return false;
    },

    /**
     *  传入一个 args, 然后返回一个值.
     * @private
     * @param {String} type  所选择的类别
     * @param {String} name  所要选择的返回参数名
     * @param {Array} args    所需要返回的args 的数组
     */
    _getFuncFromMap: function(type, name, args) {
      var map = this[type];
      if (!map) {
        return;
      }
      var fn = map[name];
      if (!fn) {
        return;
      }
      return fn.apply(this, args);
    },


    /**
     *
     *  当接收到模块状态发生改变时，触发该事件
     * @param {Object} hashs      当前的解析自url的hash对象
     * @param {Boolean} isUpdatedBySelf   当被激活之后的回调，是否是由于自己引起
     */
    funcUpdate: function(hashs, isUpdatedBySelf, next) {
      this.funcInit(hashs);
      this._isMdulActive = true;
      this.update(hashs, isUpdatedBySelf, next);
      this.type !== 'sub' && this.displayView(true);
      rc.pub(this.name + '.MDUL_ACTIVED', true);
    },

    /**
     * 引入pages 的暴露接口功能可以让用户减少对于外部的引用，返回一个方法集合, 具体的方法类别请查找pages.pagesInterface
     */
    pages: rc.pages.pagesInterface(),


    // 当模块被禁用时触发
    /**
     *  当有很多模块一起被禁止时，可以根据此确定是由于谁引起的禁止动作
     * @param{Boolean} isDisabledBySelf   是否是自己引起的禁止
     */
    funcDisabled: function(isDisabledBySelf) {
      this._isMdulActive = false;
      this.disabled(!!isDisabledBySelf);
      // sub 模块不会被做隐藏处理，因为他会跟进父级的隐藏
      this.type !== 'sub' && this.displayView(false);
      rc.pub(this.name + '.MDUL_ACTIVED', false);
    },

    // 当模块被销毁时触发
    /**
     *  当有很多模块一起被销毁时，可以根据此确定是由于谁引起的销毁动作
     * @param{Boolean} isDestroiedBySelf    是否是自己引起的销毁
     */
    funcDestroy: function(isDestroiedBySelf) {
      // 先执行 disabled 操作
      this.funcDisabled(!!isDestroiedBySelf);
      this.abortAllRequest();
      this.view && this.view.funcDestroy && this.view.funcDestroy();
      this.view = null;
      this._subEventsAct(false);
      this._ctrlsBindAct(false);
      this._restoreMdul(false);
      this._isInit = false;
      this._isActivate = false;
      this.destroy(!!isDestroiedBySelf);
    },

    /**
     * 更新视图的操作
     * 该操作的实参为可选值。
     *  module 将通过这个方法去更新视图
     */
    updateView: function(methodName, args) {
      if (!arguments.length || !this.view) {
        return;
      }
      this.view.update.apply(this.view, [].slice.call(arguments));
    },

    /**
     *
     *  控制所属该module的view 模块的显示隐藏
     * @param {Boolean} isShow      是否显示view 的父级
     */
    displayView: function(isShow) {
      if (!this.view || !this.view.show || !this.view.hide) {
        return;
      }
      this.view[isShow ? 'show' : 'hide']();
    },

    /**
     *
     * 成功/失败 后都回调都上下文，都将指向module 本身，方便里面的this 调用。
     * 通过module 发起一个请求。
     * @param {Object} options      需要请求的api的参数
     * @param {String} options.api              api 的名字
     * @param options.params              [可选] api 的属性
     * @param {String} options.loadingText            [可选] 如果存在, 则也会显示loading tip 并且带有内容
     * @param {String} options.successText            [可选] 如果存在, 则也会显示success tip 并且带有内容
     * @param {String} options.errorText              [可选] 如果存在, 则也会显示error tip 并且带有内容
     * @param {Boolean} options.isHideLoading         [可选] 是否显示loading tip，默认 false
     * @param {Boolean} options.isHideSuccess         [可选] 是否显示success tip，默认 false
     * @param {Boolean} options.isHideError         [可选] 是否显示error tip，默认 false
     * @param {Boolean} options.isWholeTime         [可选] 是否必须在module active状态执行，默认 false
     * @param {Boolean} options.isKeepAlone         [可选] 是否选的api name唯一性（即类似page切换，同api会自动的abort掉上一次掉请求，而只关注本次），默认false
     *
     * @param {Function} success    请求成功后的回调
     * @param {Function} fail     请求失败后的回调
     *
     */
    request: function(options, success, fail) {
      if (!this._isInit) {return;}
      // 每次发起请求，都会以时间戳＋apiname＋modulname 构成一个唯一值。
      var i, reqList = this._requestList,
        mdulName = this.name,
        api = options.api;

      var reqAPI = reqList[api], reqKey = mdulName + '::' + api + '::' + (+new Date()) + '::' + (this._requestIndex ++);

      // 请求队列是接收到，就会删除的。
      if (!reqAPI) {
        reqAPI = reqList[api] = {
          isKeepAlone: !!options.isKeepAlone,
          isWholeTime: !!options.isWholeTime,
          reqList: {} // 该api 下访问的所有请求都会在这里体现
        };

        reqAPI.reqList[reqKey] = {
          isHideLoading: options.isHideLoading,
          isHideSuccess: options.isHideSuccess,
          isHideError: options.isHideError,
          loadingText: options.loadingText,
          successText: options.successText,
          errorText: options.errorText,
          success: success,
          fail: fail
        };
        // 如果该api请求是独占的，则我们预留一个接口字段用于获取该api的引用
        if (reqAPI.isKeepAlone) {
          reqAPI.aloneAPI = reqKey;
        }
      } else {
        // 如果该api是独占的，第一件事情就是需要将上一次的请求abort掉, 并且修改特性
        if (reqAPI.aloneAPI) {
          // 发送请求干掉上一次的
          rc.pub('MODULES.REQUEST_SEND', {
            api: api,
            mdulName: mdulName,
            reqKey: reqAPI.aloneAPI,
            act: 'abort'
          });
          // 更新 reqKey
          reqAPI.aloneAPI = reqKey;
          reqAPI.reqList = {};
        }
        reqAPI.reqList[reqKey] = {
          isHideLoading: options.isHideLoading,
          isHideSuccess: options.isHideSuccess,
          isHideError: options.isHideError,
          loadingText: options.loadingText,
          successText: options.successText,
          errorText: options.errorText,
          success: success,
          fail: fail
        };
      }
      // 弹出遮罩层
      if (!reqAPI.reqList[reqKey].isHideLoading || reqAPI.reqList[reqKey].loadingText) {
        rc.pub('NOTI.SHOWLOADING', reqAPI.reqList[reqKey].loadingText || '');
      }
      rc.pub('MODULES.REQUEST_SEND', {
        api: api,
        mdulName: mdulName,
        reqKey: reqKey,
        act: 'request',
        params: options.params
      });
    },


    // 当我们destroy 该模块的时候，应该将所有该模块还在发起当请求也给abort 掉。
    abortAllRequest: function() {
      var i, reqList = this._requestList, j, it,
        mdulName = this.name;
      for (i in reqList) {
        // 如果是全占的, 不删除
        if (reqList[i].isWholeTime) {
          continue;
        }
        for (j in reqList[i].reqList) {
          rc.pub('MODULES.REQUEST_SEND', {
            api: i,
            mdulName: mdulName,
            reqKey: j,
            act: 'abort'
          });
          delete reqList[i].reqList[j];
        }
        delete reqList[i];
      }
    },

    /**
     *  通过module 管理器直接操作的
     * @param {Object} params     返回响应的操作
     * @param params.api          请求的api 的名字
     * @param params.reqKey       由模块名, api，与时间戳构成的一个临时唯一值
     * @param params.mdulName     模块名
     * @param params.status       状态，有success, fail
     * @param params.response     返回的结果
     */
    response: function(params) {
      // 阻止掉下面不会被触发的事件
      if (!this._requestList[params.api]) {
        return false;
      }
      var reqList = this._requestList,
        reqApi = reqList[params.api],
        reqOne = reqApi.reqList[params.reqKey],
        isWholeTime = reqApi.isWholeTime,
        that = this, i, ni = 0,
        funcComplete = isWholeTime ? function(func) {
          func && func.apply(that, [].slice.call(arguments, 1));
        } : function(func) {
          if (that.isMdulActive()) {
            func && func.apply(that, [].slice.call(arguments, 1));
          }
        };
      switch(params.status) {
        case 'success':
          if(!reqOne.isHideLoading){
            rc.pub('NOTI.CLEARSHOW');
          }
          if (!reqOne.isHideSuccess || reqOne.successText) {
            rc.pub('NOTI.SHOWSUCCESS', reqOne.successText || '');
          }
          funcComplete(reqOne.success, params.response);
          break;
        case 'fail':
          if(!reqOne.isHideLoading){
            rc.pub('NOTI.CLEARSHOW');
          }
          if (!reqOne.isHideError || reqOne.errorText) {
            rc.pub('NOTI.SHOWFAIL', reqOne.errorText || params);
          }
          funcComplete(reqOne.fail, params.response, params);
          break;
      }
      // 得到请求回馈后，删除之前的请求链
      delete reqApi.reqList[params.reqKey];
      for (i in reqApi.reqList) {
        ni++;
      }
      if (!ni) {
        // 如果整条都空了，则删除整条api的请求
        delete reqList[params.api];
      }
    },
  };

  /**
   *
   * @class modules
   */
  rc.modules = {

    // 模块本地存储的区域
    _mdulList: {},
    // 异步加载模块 Map表
    _asyncMdulMap:{},
    // 来自于module模块发出的请求
    _requestList: {},

    /**
     *
     *  定义模块，并且返回一个模块。
     * @param {Object} conf   模块的配置
     */
    define: function(conf) {
      if (this._mdulList[conf.name]) {
        return false;
      }
      return this._mdulList[conf.name] = new Module(conf);
    },

    /**
     *
     *  加载一个模块
     *  注：当加载的是父模块/祖模块时，他所属的下面的子模块也会被加载
     * @param {Object} params     通过事件派发过来的属性集合
     */
    loadMdul: function(params) {
      params = params || {};
      return this._loadMdul(params.mdulName, params.hashs, params.callback);
    },

    /**
     *
     *  加载一个模块
     *  注：当加载的是父模块/祖模块时，他所属的下面的子模块也会被加载
     * @private
     * @param {String} mdulName     模块名
     * @param {Object} hashs      当前路径解析成的hash对象
     * @param {Function} callback   加载完成后执行的回调
     * @param {Boolean} isSingleLoad  是否单体加载
     */
    _loadMdul: function(mdulName, hashs, callback, isSingleLoad) {
      // 没有则立马执行回调
      if (!mdulName) {
        // 201 模块加载失败
        rc.pub('ERROR.MODULES', {result: 201});
        return;
      }
      var i, mlist = this._mdulList, o, arr = [];

      // 如果是单个模块单独加载
      if (isSingleLoad) {
        for (i in mlist) {
          o = mlist[i];
          if (o.name === mdulName) {
            o.funcInit(hashs);
            callback && callback();
            return o;
          }
        }
        // 201 模块加载失败
        rc.pub('ERROR.MODULES', {result: 201});
        return false;
      }
      this._getMdulOrderByDown(mdulName, function(mdul) {
        arr.push(mdul);
      }, true);
      var ni = arr.length;
      if (!ni) {
        // 201 模块加载失败
        rc.pub('ERROR.MODULES', {result: 201});
        return;
      }
      for (i = 0; i < ni; i++) {
        o = arr[i];
        o.funcInit(hashs);
      }
      callback && callback();
    },

    /**
     *
     *  获得某个模块
     * @param {String} mdulName       模块名
     */
    getMdul: function(mdulName) {
      return this._mdulList[mdulName] || false;
    },



    /**
     *  正向的去查询自我起，往下查模块，并且返回操作
     *  我－》子模块－》孙子模块－》重孙模块 。。。
     * @private
     * @param {String} mdulName       模块名
     * @param {Function} callback     找到后执行的回调
     *          回调里有两个实参
     *            mdul        传递该模块
     *            isSelf        是否最初传入的模块
     * @param {Boolean} isFristLoop     是否第一次执行
     *
     */
    _getMdulOrderByDown: function(mdulName, callback, isFristLoop) {
      var i, mdulList = this._mdulList,
        curMdul = this.getMdul(mdulName);
      if (!curMdul) {
        return false;
      }
      // 第一时间执行自己的回调，然后再往下递归
      isFristLoop && callback && callback(curMdul, true);

      for (i in mdulList) {
        mdul = mdulList[i];
        if (!mdul || mdul === curMdul) {
          continue;
        }

        if (mdul.depend === mdulName) {
          callback && callback(mdul);
          this._getMdulOrderByDown(mdul.name, callback);
        }
      }
    },

    /**
     *  反向的去查询自我起，往上查模块，并且返回操作
     *  我－》父模块－》爷模块－》祖模块 。。。
     * @private
     * @param {String} mdulName       模块名
     * @param {Function} callback     找到后执行的回调
     *          回调里有两个实参
     *            mdul        传递该模块
     *            isSelf        是否最初传入的模块
     *
     */
    _getMdulOrderByUp: function(mdulName, callback) {
      var curMdul = this.getMdul(mdulName);
      if (!curMdul) {
        return false;
      }
      // 无依赖则到此结束
      if (!curMdul.depend) {
        callback && callback(curMdul, true);
        return false;
      }
      var updateList = [curMdul];
      // 向上回溯依赖
      while (curMdul.depend !== '' && curMdul) {
        curMdul = this.getMdul(curMdul.depend);
        if (!curMdul) {
          break;
        }
        updateList.push(curMdul);
        //callback && callback(curMdul);
      }
      // update 应该是从父级往当前递归
      var i = updateList.length - 1, ni = 0;
      for (; i >= ni; i--) {
        callback && callback(updateList[i], i === ni);
      }
    },

    /**
     *
     * 读取一个root 的mdul，并且切换它下面active module
     * @param {Object} params     通过订阅事件获得的参数处理
     * @param {String} params.prevRoot  上一个需要销毁的模块名(root)
     * @param {String} params.curRoot   本次需要加载的模块名(root)
     * @param {String} params.curMdul 本地需要更新的模块名(mdul)
     * @param {String} params.prevMdul  上次需要隐藏的模块名(mdul)
     * @param {String} params.url       当前的url地址
     * @param {Object} params.hashs       当前的hashs对象
     */
    rootMdulLoad: function(params) {
      var that = this, hashs = params.hashs, url = params.url,
        funcAct = function() {
          that.loadMdul({mdulName: params.curRoot, hashs: hashs});
          that.updateMdul({mdulName: params.curMdul, hashs: hashs, prevMdul: params.prevMdul, url: url}, function() {
            that.destroyMdul({mdulName: params.prevRoot, hashs: hashs});
          });
        }, root_url;
      // 如果暂时还没在目前得list 里，则需要加载
      if (!this.getMdul(params.curMdul)) {
        // 先去请求获得资源，然后再去处理destroy等操作
        // FIXME 暂时还没处理，待合并
        root_url = this._asyncMdulMap[params.curRoot];

        if(!root_url){
          // 200 模块不存在
          rc.pub('ERROR.MODULES', {result: 200});
          rc.pub('PAGES.GOBACK', -1);
          return;
        }

        rc.load.require(root_url, function() {
          funcAct();
        });
        return;
      }
      // 已经在list 里了，则需要处理些其他
      funcAct();
    },

    /**
     *
     * 同一个root下的mdul做切换时需要
     * @param {Object} params     通过订阅事件获得的参数处理
     * @param {String} params.curMdul 本地需要更新的模块名(mdul)
     * @param {String} params.prevMdul  上次需要隐藏的模块名(mdul)
     * @param {String} params.url       当前的url地址
     * @param {Object} params.hashs       当前的hashs对象
     */
    switchMdul: function(params) {
      var that = this, hashs = params.hashs;
      this.updateMdul({
        mdulName: params.curMdul,
        hashs: hashs
      }, function() {
        // false 说明不需要做切换
        params.nPrevKey && that.disabledMdul({
          mdulName: params.nPrevKey,
          hashs: hashs
        });
      });
    },


    /**
     *  激活该模块，并且递归激活该模块的父级／祖父等模块（依照depend关系）
     *
     * @param {Object} params       通过订阅事件得到的参数处理
     * @param {String} params.mdulName      模块名
     * @param {Object} params.hashs       当前解析对应的hash对象
     * @param {Function} callback     一个执行回调
     */
    updateMdul: function(params, callback) {
      var mdulName = params.mdulName,
        hashs = params.hashs;
      if (!this.getMdul(mdulName)) {
        // 200 模块不存在
        rc.pub('ERROR.MODULES', {result: 200});
        rc.pub('PAGES.GOBACK', -1);
        return;
      }
      var arr = [], hasDepence, next, it, ni, isDepenceRoot, that = this, prevMdulObj;
      // 这里在循环一次是为了看当前的mdul的变化是否会有需要依赖的关系在
      this._getMdulOrderByUp(mdulName, function(mdul, isSelf) {
        if (mdul.hasDepence) {
          hasDepence = true;
          if (prevMdulObj) {
            prevMdulObj.beDepence = true;
          }
        }
        arr.push(prevMdulObj = {
          mdulName: mdul.name,
          isSelf: isSelf
        });
        //mdul.funcUpdate(hashs, isSelf);
      });
      if (hasDepence) {
        next = function() {
          if (!arr.length) {
            callback && callback();
            return;
          }
          it = arr.shift();
          if (it.beDepence) {
            that.getMdul(it.mdulName).funcUpdate(hashs, it.isSelf, next);
          } else {
            that.getMdul(it.mdulName).funcUpdate(hashs, it.isSelf);
            next();
          }
        };
        next();
      } else {
        callback && callback();
        rc.util.map(arr, function(it, idx) {
          // 直接放mdul 的话，会引起上下文的改变，实例改变
          this.getMdul(it.mdulName).funcUpdate(hashs, it.isSelf);
        }, this);
      }
    },

    /**
     *  禁止该模块，并且递归禁止该模块的子级／孙子级等模块（依照depend关系）
     *
     * @param {Object} params       通过订阅事件得到的参数处理
     * @param {String} params.mdulName      模块名
     * @param {Object} params.hashs       当前解析对应的hash对象
     */
    disabledMdul: function(params) {
      var mdulName = params.mdulName,
        hashs = params.hashs,
        arr = [];
      this._getMdulOrderByDown(mdulName, function(mdul, isSelf) {
        arr.push(mdul);
      }, true);
      var i = arr.length, mdul;
      for (; i >= 0; i--) {
        mdul = arr[i];
        mdul && mdul.funcDisabled && mdul.funcDisabled(hashs, !i);
      }
    },

    /**
     *  销毁该模块，并且递归销毁该模块的子级／孙子级等模块（依照depend关系）
     *
     * @param {Object} params       通过订阅事件得到的参数处理
     * @param {String} params.mdulName      模块名
     * @param {Object} params.hashs       当前解析对应的hash对象
     */
    destroyMdul: function(params) {
      var mdulName = params.mdulName,
        hashs = params.hashs,
        arr = [];
      this._getMdulOrderByDown(mdulName, function(mdul, isSelf) {
        arr.push(mdul);
      }, true);
      var i = arr.length, mdul;
      for (; i >= 0; i--) {
        mdul = arr[i];
        mdul && mdul.funcDestroy && mdul.funcDestroy(hashs, !i);
      }
    },

    /**
     *  由模块内部发起的api请求或者其他请求
     *
     * @param {Object} params           通过订阅事件得到的参数处理
     * @param {String} params.api: api,         api 名字
     * @param {String} params.mdulName: mdulName,     模块名字
     * @param {String} params.reqKey: reqKey,       由模块名, api，与时间戳构成的一个临时唯一值
     * @param {String} params.act: 'request',       请求动作
     */
    request: function(params) {
      // 模块管理器不需要去考虑太多特别因素（如请求队列），只需要执行这一队列即可
      params.comefrom = 'MODULES';
      switch(params.act) {
        case 'request':
          this._requestList[params.reqKey] = params;
          rc.pub('SERVER.REQUEST_SEND', params);
          break;
        case 'abort':
          rc.pub('SERVER.REQUEST_SEND', params);
          delete this._requestList[params.reqKey];
          break;
      }
    },

    /**
     *  管理器接收到到来自请求目的地的结束请求
     *
     * @param {Object} params 通过订阅事件得到的参数处理
     * @param params.api    请求的api 的名字
     * @param params.reqKey   由模块名, api，与时间戳构成的一个临时唯一值
     * @param params.mdulName 模块名
     * @param params.status   状态，有success, fail
     * @param params.response 返回的结果
     */
    response: function(params) {
      if (!params || !params.mdulName) {
        return;
      }
      rc.pub('MODULES.RESPONSE_RECEIVER.' + params.mdulName, params);
      delete this._requestList[params.reqKey];
    },


    /**
     *  初始化所有已经define的模块
     *
     * @private
     * @param {Object} params       初始化模块功能块的基本参数
     */
    _initModules: function(params) {
      var i, ml = this._mdulList, mdul;
      // 可空置
      params = params || {};
      for (i in ml) {
        mdul = ml[i];
        // 无依赖的 basic 模块在一开始就被初始化
        if (mdul.type === 'basic' && !mdul.depend) {
          mdul.funcInit(params.hashs);
        }
      }
    },

    /**
     * @private
     * @param{Object} order   执行操作
     */
    _afterInit: function(order) {
      this[order.act] && this[order.act](order.value);
    },


    /**
     *
     *  初始化模块管理器
     * @param {Object} conf       初始化模块功能块的基本参数
     */
    init: function(conf) {
      rc.sub('MODULES.LOAD', this.loadMdul, this);
      rc.sub('MODULES.UPDATE', this.updateMdul, this);
      rc.sub('MODULES.DISABLED', this.disabledMdul, this);
      rc.sub('MODULES.DESTROY', this.destroyMdul, this);
      rc.sub('MODULES.REQUEST_SEND', this.request, this);
      rc.sub('MODULES.ROOTLOAD', this.rootMdulLoad, this);
      rc.sub('MODULES.SWITCHMDUL', this.switchMdul, this);
      rc.sub('SERVER.REQUEST_RESPONSE.MODULES', this.response, this);
      rc.sub('TATAMI.FEATURESTART.MODULES', this._afterInit, this, true);
      rc.pub('TATAMI.FEATUREREADY', {key: 'MODULES', act: '_initModules', value: conf});
      // 缓存route里边url
      if(!conf.route || !conf.route.cp_list) return;
      var name, item;
      for(name in conf.route.cp_list){
        item = conf.route.cp_list[name];
        if(item.url){
          this._asyncMdulMap[name] = item.url;
        }
      }
    }
  };

})(window.Tatami);


/**
 *  depend on events, util
 * @class
 * @author Jerrod
 */
(function(rc) {
  if (!rc) {
    window.Tatami = rc = {};
  }
  if (!rc.controls) {
    rc.controls = {};
  }

  /**
   *
   * @param {Object} conf
   * @param {Function} conf.methodsMap       暴露的对外的方法
   * @param {Function} conf.privateMethods     私有的方法
   * @param conf.dataMap                         数据mapping
   * @param conf.statusMap                       状态mapping
   * @param conf.ctrlsMap                        [可选] 内部可以继续提供ctrls 的相应操作
   * @param {String} conf.name                   该control 的名称
   * @param {Function} conf.init                 初始化方法
   * @param {Function} conf.destroy              销毁方法
   * @param {Event} conf.events                  需要绑定的事件，因为事件可能来自于view
   * @param {String} conf.viewName               [可选] view 件的名字 如果存在view 的话，则初始化view
   * @param {Boolean} conf.isGlobal              [可选] 是否全局的组件，默认为true
   * @param {Function} conf.getMethod            外部调用的获得某方法的方法（内部也可以用)
   * @param {Function} conf.getPrivMethod        调用内部私有方法的方法
   * @param {Object} conf.getCtrlData            [可选] 获得私有对象
   * @param {Object} conf.setCtrlData            [可选] 设置私有对象
   * @param conf.getStatus                       [可选] 获得私有状态
   * @param conf.setStatus                       [可选] 设置私有状态
   * @param conf.getCtrl                         [可选] 获得其他的ctrl
   * @param conf.request                         [可选] 请求服务
   * @param conf.getLocalData                    获得本地缓存
   * @param conf.setLocalData                    设置本地缓存
   *
   *
   */
  function Ctrl(conf) {
    this.name = conf.name;
    // 初始化函数
    this._isInit = false;
    this._isViewInit = false;
    this.init = conf.init || function() {};
    this.isGlobal = conf.isGlobal !== false;
    this.destroy = conf.destroy || function() {};

    this.methodsMap = conf.methodsMap || {};
    this.privateMethods = conf.privateMethods || {};
    this.dataMap = conf.dataMap || {};
    this.statusMap = conf.statusMap || {};

    // 模块的事件集合
    this.events = conf.events || {};

    // 视图模块正式成为可使用区域
    this.viewName = conf.viewName || '';
    // 单体view 的引用
    this.view = null;
    // 当该ctrl是被外层view引用，并且本身存在view 的情况下的父层view的节点
    this._viewContainer = null;

    // ctrls 的列表
    this.ctrlsMap = conf.ctrlsMap || {};
    // 用于收集来自与 controls 的组件
    this._ctrlsMap = {};

    // 发送的请求列表
    this._requestList = {};
    this._requestIndex = 0;

    // 当前的唯一id
    this._oneId = null;

    // 当前的业务承载模块
    this._mdulName = null;
    // 业务承载模块的激活状态
    this._isMdulActive = false;

    // 实例化logs
    this.logs = new rc.logs.Logs({
      name: this.name
    });

  }

  Ctrl.prototype = {

    /**
     *  获得本地的缓存数据
     * @param{String}key    键值
     * @param{String}type   类别 session/storage，默认storage
     */
    getLocalData: function(key, type) {
      return rc.localcache.get(key, type);
    },

    /**
     *  设置本地的缓存数据
     * @param{String}key    键值
     * @param{Object}value    值
     * @param{String}type   类别 session/storage，默认storage
     */
    setLocalData: function(key, value, type) {
      return rc.localcache.set(key, value, type);
    },

    /**
     *  初始化组件, ctrl 和 mdul 的不一致表现在，我们也会对非ctrl 的内容做处理
     * @private
     * @param {Boolean} isBind      是否绑定组件监听
     */
    _ctrlsBindAct: function(isBind) {
      var i, ctrls = this.ctrlsMap,
        _ctrls = this._ctrlsMap, rcc = rc.controls;
      if (isBind) {
        for (i in ctrls) {
          if (typeof ctrls[i] === 'string') {
            this._ctrlsMap[i] = rcc.get(ctrls[i], this._mdulName, true);
          }
        }
      } else {
        for (i in ctrls) {
          // 调用我们自己组件的方法
          if (_ctrls[i]) {
            ctrls[i].funcDestroy && ctrls[i].funcDestroy();
            delete _ctrls[i];
          } else {
            // 如果不是我们的组件，自带有destroy 的，则自己destroy掉
            ctrls[i] && ctrls[i].destroy && ctrls[i].destroy();
          }
          delete ctrls[i];
        }
      }

    },

    /**
     *  监听/移除 本模块的sub 队列
     * @private
     * @param {Boolean} isBind      是否绑定全局监听事件
     */
    _subEventsAct: function(isBind) {
      var events = this.events, i;
      if (!events) {
        return;
      }
      var ctrlName = this._oneId, key, act = isBind ? 'sub' : 'removeSub';
      for (i in events) {
        // >>xxxx 表示缩写，再绑定的时候会自动的将前面的内容替换成该模块名
        key = /^\>\>/.test(i) ? ctrlName + i.replace(/^\>\>/, '.') : i;
        rc[act](key, events[i], this);
      }
      if (this._mdulName) {
        rc[act](this._mdulName + '.MDUL_ACTIVED', this._getBsMdulStatus, this);
      }
      rc[act]('CONTROLS.RESPONSE_RECEIVER.' + this._oneId, this.response, this);
      rc[act]('CONTROLS.PUBPROPS.UPDATE.' + this.name, this._updatePubProps, this);
    },

    /**
     *  监听业务承载模块是否处于被激活状态
     * @private
     * @param {Boolean} isActived   业务承载模块是否被激活
     */
    _getBsMdulStatus: function(isActived) {
      this._isMdulActive = !!isActived;
      this._viewInit(this._isMdulActive);
    },

    /**
     *
     * 创建view的部分
     */
    _viewInit: function(isActive) {
      if (!this._isViewInit && isActive && this.viewName && this._mdulName) {
        this._isViewInit = true;
        this.view = rc.views.get(this.viewName);
        this.view.render({mdulDepend: this.ctrlId, mdulName: this._mdulName, viewContainer: this._viewContainer});
      }
    },

    // 业务承载模块是否被激活
    isMdulActive: function() {
      return this._isMdulActive;
    },

    /**
     *  getMethod 方法的兄弟篇，
     * @param {String} name  所要选择的返回参数名
     */
    getMethod: function(name) {
      var args = [].slice.call(arguments, 1);
      return this._getFuncFromMap('methodsMap', name, args);
    },

    /**
     *  getPrivMethod 方法的兄弟篇，私有的方法都放在这个里面
     * @param {String} name  所要选择的返回参数名
     */
    getPrivMethod: function(name) {
      var args = [].slice.call(arguments, 1);
      return this._getFuncFromMap('privateMethods', name, args);
    },

    /**
     *
     * 获得ctrl 的数据对象里的值
     * @param {String} name  ctrl对象里的类名
     */
    getCtrlData: function(name) {
      return this._getCtrlProp('dataMap', name);
    },

    /**
     *  设置ctrl 的数据对象里的值，并且返回
     * @param {String} name   ctrl对象里的类名
     * @param {String} key    ctrl对象里的key值
     * @param {Object} value  ctrl对象里的值
     */
    setCtrlData: function(name, key, value) {
      var args = arguments, oldData;
      if (args.length === 2) {
        return this._setCtrlProp('dataMap', name, args[1]);
      } else if (args.length === 3) {
        oldData = this.getCtrlData(name);
        if (typeof oldData === 'object' && oldData[key]) {
          oldData[key] = value;
          return this._setCtrlProp('dataMap', name, oldData);
        }
        return false;
      }
      return false;
    },

    /**
     *  获得ctrl 的状态对象里的值
     * @param {String} name  ctrl对象里的类名
     */
    getStatus: function(name) {
      return this._getCtrlProp('statusMap', name);
    },

    /**
     *  设置ctrl 的状态对象里的值，并且返回
     * @param {String} name   ctrl对象里的类名
     * @param {Object} value  ctrl对象里的值
     */
    setStatus: function(name, value) {
      return this._setCtrlProp('statusMap', name, value);
    },

    /**
     *  获得ctrl 对象里相应的name 下的值.
     * @private
     * @param {String} type  所选择的类别
     * @param {String} name  所要选择的返回参数名
     */
    _getCtrlProp: function(type, name) {
      if (!this[type] || this[type][name] === undefined) {
        return false;
      }
      return this[type][name];
    },

    /**
     *  ctrl 对象里相应的name 下的值，并且返回
     * @private
     * @param {String} type  所选择的类别
     * @param {String} name  所要选择的返回参数名
     * @param {Object|Boolean} value    所需要设置的值
     */
    _setCtrlProp: function(type, name, value) {
      if (value === undefined || !this[type] || this[type][name] === undefined || (type === 'statusMap' && typeof value !== 'boolean')) {
        return false;
      }
      // 如果是pub的内容，我们应该修改他的原本的指向内容
      if (/^Pub\:/.test(name)) {
        this['__' + type][name] = value;
        // 使用ctrlId 而不是 _oneId 是因为里面被占用了，原因在调查
        rc.pub('CONTROLS.PUBPROPS.UPDATE.' + this.name, {type: type, key: name, value: value, ctrlId: this.ctrlId});
      }
      return this[type][name] = value;
    },

    /**
     * 更新来自其他ctrl 里相应的pub数据
     * @private
     * @params {Object} params        需要传递的对象
     * @params {String} params.type     类别
     * @params {String} params.key      字段
     * @params {Object} params.value    内容
     * @params {String} params.ctrlId   原来的ctrl id
     */
    _updatePubProps: function(params) {
      if (this.ctrlId === params.ctrlId || this[params.type] === undefined || this[params.type][params.key] === undefined) {return;}
      this['__' + params.type][params.key] = this[params.type][params.key] = params.value;
    },

    /**
     * 更新视图的操作
     * 该操作的实参为可选值。
     * module 将通过这个方法去更新视图
     */
    updateView: function(methodName, args) {
      if (!arguments.length || !this.view) {
        return;
      }
      this.view.update.apply(this.view, [].slice.call(arguments));
    },

    /**
     *  返回该ctrl 实例
     * @param {String} name  所要ctrl名
     *      [String] method 需要传递的control 的方法名
     *      [Arugments] args 会传递过去的参数
     */
    getCtrl: function(name, method, args) {
      var args2;
      if (arguments.length === 1) {
        return this._ctrlsMap[name] || this.ctrlsMap[name];
      } else if (arguments.length >= 2) {
        // this._ctrlsMap[name]
        if (this._ctrlsMap[name]) {
          args2 = [].slice.call(arguments, 1);
          return this._ctrlsMap[name].getMethod.apply(this._ctrlsMap[name], args2);
        }
        return this.ctrlsMap[name][method] ?
          this.ctrlsMap[name][method].apply(this.ctrlsMap[name], [].slice.call(arguments, 2)) : false;
      }
      return false;

    },

    /**
     *  传入一个 args, 然后返回一个值.
     * @private
     * @param {String} type  所选择的类别
     * @param {String} name  所要选择的返回参数名
     * @param {Array} args    所需要返回的args 的数组
     */
    _getFuncFromMap: function(type, name, args) {
      var map = this[type];
      if (!map) {
        return;
      }
      var fn = map[name];
      if (!fn) {
        return;
      }
      return fn.apply(this, args);
    },

    /**
     *
     * 继承来自配置项目里的内容
     * @private
     * @param {String} type     类别，只有 dataMap,statusMap
     * @param {Object} data     内容，来自于配置主体
     */
    _inheritPubProperties: function(type, data) {
      if (!this[type] || !data) {return;}
      var i, reg = /^Pub\:/;
      for (i in data) {
        if (reg.test(i)) {
          this[type][i] = data[i];
        }
      }
      // 存一个引用
      this['__' + type] = data;
    },

    // 函数初始化
    /**
     *  初始化 control 部分
     * @param {Object} conf     初始化配置表
     * @param conf.oneId
     */
    funcInit: function(conf) {
      if (this._isInit) {
        return;
      }
      this._isInit = true;
      this._oneId = this.ctrlId = conf.oneId;
      if (conf.mdulName) {
        this._mdulName = conf.mdulName;
      }
      if (conf.isMdulActive) {
        //true
        this._isMdulActive = conf.isMdulActive;
        this._viewContainer = conf.viewContainer;
        this._viewInit(conf.isMdulActive);
      }
      this._inheritPubProperties('dataMap', conf.dataMap);
      this._inheritPubProperties('statusMap', conf.statusMap);
      this._subEventsAct(true);
      this._ctrlsBindAct(true);

      this.init();
    },

    // 函数销毁
    funcDestroy: function() {
      var oneId = this._oneId;
      this._isInit = false;
      this.view && this.view.funcDestroy && this.view.funcDestroy();
      this.view = null;
      this.abortAllRequest();
      this._subEventsAct(false);
      this._ctrlsBindAct(false);
      this.destroy();
      rc.pub('CONTROLS.DESTROY_CTRL', oneId);
    },

    /**
     * 引入pages 的暴露接口功能可以让用户减少对于外部的引用，返回一个方法集合, 具体的方法类别请查找pages.pagesInterface
     */
    pages: rc.pages.pagesInterface(),

    /**
     *
     * 成功/失败 后都回调都上下文，都将指向module 本身，方便里面的this 调用。
     * 通过module 发起一个请求。
     * @param {Object} options      需要请求的api的参数
     * @param   options.api:              api 的名字
     * @param   options.params:             [可选] api 的属性
     * @param   options.loadingText:            [可选] 如果存在, 则也会显示loading tip 并且带有内容
     * @param   options.successText:            [可选] 如果存在, 则也会显示success tip 并且带有内容
     * @param   options.errorText:              [可选] 如果存在, 则也会显示error tip 并且带有内容
     * @param   options.isHideLoading:          [可选] 是否显示loading tip，默认 false
     * @param   options.isHideSuccess:          [可选] 是否显示success tip，默认 false
     * @param   options.isHideError:          [可选] 是否显示error tip，默认 false
     * @param   options.isWholeTime:          [可选] 是否必须在module active状态执行，默认 false
     * @param   options.isKeepAlone:          [可选] 是否选的api name唯一性（即类似page切换，同api会自动的abort掉上一次掉请求，而只关注本次），默认false
     *
     * @param {Function} success    请求成功后的回调
     * @param {Function} fail     请求失败后的回调
     *
     */
    request: function(options, success, fail) {
      // 每次发起请求，都会以时间戳＋apiname＋modulname 构成一个唯一值。
      if (!this._isInit) {return;}
      var i, reqList = this._requestList,
        ctrlName = this.name,
        api = options.api;

      var reqAPI = reqList[api], reqKey = ctrlName + '::' + api + '::' + (+new Date()) + '::' + (this._requestIndex++);

      // 请求队列是接收到，就会删除的。
      if (!reqAPI) {
        reqAPI = reqList[api] = {
          isKeepAlone: !!options.isKeepAlone,
          isWholeTime: !!options.isWholeTime,
          reqList: {} // 该api 下访问的所有请求都会在这里体现
        };

        reqAPI.reqList[reqKey] = {
          isHideLoading: options.isHideLoading,
          isHideSuccess: options.isHideSuccess,
          isHideError: options.isHideError,
          loadingText: options.loadingText,
          successText: options.successText,
          errorText: options.errorText,
          success: success,
          fail: fail
        };
        // 如果该api请求是独占的，则我们预留一个接口字段用于获取该api的引用
        if (reqAPI.isKeepAlone) {
          reqAPI.aloneAPI = reqKey;
        }
      } else {
        // 如果该api是独占的，第一件事情就是需要将上一次的请求abort掉, 并且修改特性
        if (reqAPI.aloneAPI) {
          // 发送请求干掉上一次的
          rc.pub('CONTROLS.REQUEST_SEND', {
            api: api,
            ctrlName: ctrlName,
            reqKey: reqAPI.aloneAPI,
            act: 'abort'
          });
          // 更新 reqKey
          reqAPI.aloneAPI = reqKey;
          reqAPI.reqList = {};
        }
        reqAPI.reqList[reqKey] = {
          isHideLoading: options.isHideLoading,
          isHideSuccess: options.isHideSuccess,
          isHideError: options.isHideError,
          loadingText: options.loadingText,
          successText: options.successText,
          errorText: options.errorText,
          success: success,
          fail: fail
        };
      }
      // 弹出遮罩层
      if (!reqAPI.reqList[reqKey].isHideLoading || reqAPI.reqList[reqKey].loadingText) {
        rc.pub('NOTI.SHOWLOADING', reqAPI.reqList[reqKey].loadingText || '');
      }
      rc.pub('CONTROLS.REQUEST_SEND', {
        api: api,
        ctrlName: ctrlName,
        reqKey: reqKey,
        act: 'request',
        params: options.params,
        oneId: this._oneId
      });
    },

    /**
     *  通过module 管理器直接操作的
     * @param {Object} params     返回响应的操作
     * @param params.api          请求的api 的名字
     * @param params.reqKey       由模块名, api，与时间戳构成的一个临时唯一值
     * @param params.ctrlName     模块名
     * @param params.status       状态，有success, fail
     * @param params.response     返回的结果
     */
    response: function(params) {
      // 阻止掉下面不会被触发的事件
      if (!this._requestList[params.api]) {
        return false;
      }
      var reqList = this._requestList,
        reqApi = reqList[params.api],
        reqOne = reqApi.reqList[params.reqKey],
        isWholeTime = reqApi.isWholeTime,
        that = this, i, ni = 0,
        funcComplete = isWholeTime ? function(func) {
          func && func.apply(that, [].slice.call(arguments, 1));
        } : function(func) {
          if (that.isMdulActive()) {
            func && func.apply(that, [].slice.call(arguments, 1));
          }
        };
      switch(params.status) {
        case 'success':
          if(!reqOne.isHideLoading){
            rc.pub('NOTI.CLEARSHOW');
          }
          if (!reqOne.isHideSuccess || reqOne.successText) {
            rc.pub('NOTI.SHOWSUCCESS', reqOne.successText || '');
          }
          funcComplete(reqOne.success, params.response);
          break;
        case 'fail':
          if(!reqOne.isHideLoading){
            rc.pub('NOTI.CLEARSHOW');
          }
          if (!reqOne.isHideError || reqOne.errorText) {
            rc.pub('NOTI.SHOWFAIL', reqOne.errorText || params);
          }
          funcComplete(reqOne.fail, params.response, params);
          break;
      }
      // 得到请求回馈后，删除之前的请求链
      delete reqApi.reqList[params.reqKey];
      for (i in reqApi.reqList) {
        ni++;
      }
      if (!ni) {
        // 如果整条都空了，则删除整条api的请求
        delete reqList[params.api];
      }
    },

    // 当我们destroy 该模块的时候，应该将所有该模块还在发起当请求也给abort 掉。
    abortAllRequest: function() {
      var i, reqList = this._requestList, j, it,
        ctrlName = this.name,
        oneId = this._oneId;
      for (i in reqList) {
        // 如果是全占的, 不删除
        if (reqList[i].isWholeTime) {
          continue;
        }
        for (j in reqList[i].reqList) {
          rc.pub('CONTROLS.REQUEST_SEND', {
            api: i,
            ctrlName: ctrlName,
            reqKey: j,
            act: 'abort',
            oneId: oneId
          });
          delete reqList[i].reqList[j];
        }
        delete reqList[i];
      }
    },
  };

  /**
   * ctrls mgr
   * @class controls
   * controls  是指的框架里的可以的公有部分
   * control 类似module，但是他不主管主体业务，只处理自身的业务
   */
  rc.controls = {

    // 放置所有ctrls 的配置
    _ctrlsList: {},

    // 放置ctrl 的实例
    _ctrlsIns: {},

    // 来自于module模块发出的请求
    _requestList: {},

    /**
     *
     *  由模块内部发起的api请求或者其他请求
     * @param {Object} params       通过订阅事件得到的参数处理
     * @param params.api: api,        api 名字
     * @param params.ctrlName: ctrlName,  模块名字
     * @param params.reqKey: reqKey,    由模块名, api，与时间戳构成的一个临时唯一值
     * @param params.act: 'request',    请求动作
     * @param params.params:        发出的请求
     */
    request: function(params) {
      // 模块管理器不需要去考虑太多特别因素（如请求队列），只需要执行这一队列即可
      params.comefrom = 'CONTROLS';
      switch(params.act) {
        case 'request':
          this._requestList[params.reqKey] = params;
          rc.pub('SERVER.REQUEST_SEND', params);
          break;
        case 'abort':
          rc.pub('SERVER.REQUEST_SEND', params);
          delete this._requestList[params.reqKey];
          break;
      }
    },

    /**
     *
     *  管理器接收到到来自请求目的地的结束请求
     * @param {Object} params       通过订阅事件得到的参数处理
     * @param params.api          请求的api 的名字
     * @param params.reqKey       由模块名, api，与时间戳构成的一个临时唯一值
     * @param params.ctrlName     模块名
     * @param params.status       状态，有success, fail
     * @param params.response     返回的结果
     */
    response: function(params) {
      if (!params || !params.ctrlName) {
        return;
      }
      rc.pub('CONTROLS.RESPONSE_RECEIVER.' + params.oneId, params);
      delete this._requestList[params.reqKey];
    },

    /**
     *
     *  初始化组件管理器
     * @param {Object} conf       初始化组件功能块的基本参数
     */
    init: function(conf) {
      rc.sub('CONTROLS.REQUEST_SEND', this.request, this);
      rc.sub('CONTROLS.DESTROY_CTRL', this.destroyCtrlIns, this);
      rc.sub('SERVER.REQUEST_RESPONSE.CONTROLS', this.response, this);
    },

    /**
     *
     *  定义模块，并且返回一个模块。
     * @param {Object} config   模块的配置
     */
    define: function(conf) {
      if (this._ctrlsList[conf.name]) {
        return;
      }
      this._ctrlsList[conf.name] = conf;
    },

    /**
     *  获得一个ctrl 的实例
     * @param {String} name     组件名字
     * @param {String} mdulName   当前业务的承载模块的名字
     * @param {Boolean} isMdulActive 业务模块是否处于被激活状态
     * @param {htmlElement} viewContainer 来自于当前view的根节点
     */
    get: function(name, mdulName, isMdulActive, viewContainer) {
      var oneId, ctrl, conf;
      if (this._ctrlsList[name]) {
        oneId = name + '.' + (+ new Date()) + '.' + Math.floor(Math.random() * 1000);
        conf = this._ctrlsList[name];
        ctrl = new Ctrl(rc.util.deepClone(conf));
        ctrl.funcInit({
          oneId: oneId,
          mdulName: mdulName,
          isMdulActive: isMdulActive,
          dataMap: conf.dataMap,
          statusMap: conf.statusMap,
          viewContainer: viewContainer
        });
        return this._ctrlsIns[oneId] = ctrl;
      }
      return false;
    },

    /**
     *
     * 根据 oneId 从 instance list 里去获取唯一的那个ctrl
     * @param {Object} ctrlOneId
     */
    getCtrl: function(ctrlOneId) {
      if (this._ctrlsIns[ctrlOneId]) {
        return this._ctrlsIns[ctrlOneId];
      }
    },

    /**
     *
     * 根据 oneId 从 instance list 里去销毁唯一的那个ctrl
     * @param {Object} ctrlOneId
     */
    destroyCtrlIns: function(ctrlOneId) {
      if (this._ctrlsIns[ctrlOneId]) {
        delete this._ctrlsIns[ctrlOneId];
      }
    }
  };
})(window.Tatami);


/**
 * @class
 *  depend on events, util
 */
;(function(rc) {

  /**
   * =========================================
   * view 功能块是依赖于module功能块的存在. 主要的作用是用于承接
   *  在视图里的任何dom操作.
   *  他是无依赖的. 内部有一个私有的简单选择器模(也支持querySelectAll 这样浏览器带有的) 块用于对于dom 元素的
   * 事件绑定.
   *      他只可与他相关的module 通信而不可与其他模块/视图通信.
   *      他只可接受来自于module 的消息.
   *      他只可被他相关的module 创建/销毁.
   *  所有的关于视图的操作都只能够在他的里面进行
   * =========================================
   */

  rc = rc || {};

  var rce = rc.events;
  // views 毕竟还是得和 template 有所结合的

  // Easily-parseable/retrievable ID or TAG or CLASS selectors
  var rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,
    attrExpr = /\[\s*((?:[\w\u00c0-\uFFFF\-]|\\.)+)\s*(?:(\S?=)\s*(?:(['"])(.*?)\3|(#?(?:[\w\u00c0-\uFFFF\-]|\\.)*)|)|)\s*\]/,
    classCache = {};

  /**
   sizzle的简单版，不支持伪类、属性选择器
   selector createBy 张谱

   */
  function SimpleSizzle(selector, context, results) {
    context = context || document;
    //预留接口
    results = results || [];
    if ( typeof selector != "string") {
      console.error("传入的参数只能是字符串");
      return typeof selector === 'object' ? selector : document.body;
    }
    var s = selector.split(/\s+/), len = s.length, i = len - 1;
    for (; i >= 0; i--) {
      if (i == len - 1) {
        results = getLastSelectorResult(s[i], context);
      } else {
        results = filterResult(s[i], results);
      }
    }
    return results;
  }

  function getLastSelectorResult(selector, context) {
    var m, match, elem, attribute, results = [], els, i, len, SPACE, el, t;

    var _value, type, value, ieAttrFix, condition;
    if ( match = rquickExpr.exec(selector)) {
      if (( m = match[1])) {
        if (( elem = context.getElementById(m))) {
          if (elem.id === m) {
            results.push(elem);
            return results;
          }
        } else {
          return results;
        }
      } else if (match[2]) {
        els = context.getElementsByTagName(selector);
        i = 0;
        len = els.length;
        for (; i < len; i++) {
          results.push(els[i]);
        }
        return results;
      } else if ( m = match[3]) {
        //目前暂不支持tag.cls这种形式
        els = context.getElementsByTagName("*");
        SPACE = ' ';
        i = 0;
        len = els.length;
        cls = SPACE + m + SPACE;
        for (; i < len; ++i) {
          el = els[i];
          t = el.className;
          if (t && (SPACE + t + SPACE).indexOf(cls) > -1) {
            results.push(el);
          }
        }
        return results;
      }
    } else if ( match = attrExpr.exec(selector)) {
      //context = document.body; //
      if ( attribute = match[1]) {
        els = context.getElementsByTagName("*");
        i = 0;
        len = els.length;
        type = match[2];
        value = match[4];
        ieAttrFix = {
          "class" : "className",
          "for" : "htmlFor"
        };

        if (!+"\v1") {
          attribute = ieAttrFix[attribute] ? ieAttrFix[attribute] : attribute;
        }
        for (; i < len; ++i) {
          el = els[i];
          _value = !+"\v1" ? el[attribute] : el.getAttribute(attribute);

          if ( typeof _value === "string" && _value.length > 0) {
            if (!!value) {
              condition = type === "=" ? //完全等于
              _value === value : type === "!=" ? //不等于
              _value != value : type === "*=" ? //包含
              _value.indexOf(value) >= 0 : type === "~=" ? //匹配当中的某个单词，如<span class="red bold">警告</span>
              (" " + _value + " ").indexOf(value) >= 0 : type === "^=" ? //以XX开头
              _value.indexOf(value) === 0 : type === "$=" ? //以XX结尾
              _value.slice(-value.length) === value : type === "|=" ? //匹配属性值为XX或以XX-打头的元素
              _value === value || _value.substring(0, value.length + 1) === value + "-" : false;
              condition && results.push(el);
            } else {
              results.push(el);
            }
          }
        }
        return results;
      }
    }
  }

  function filterResult(selector, results) {
    var m, match, newResults = [], i, len, parent, flag;
    if ( match = rquickExpr.exec(selector)) {
      if (( m = match[1])) {
        i = 0;
        len = results.length;
        for (; i < len; i++) {
          parent = results[i].parentNode;
          while (parent) {
            if (parent.id == m) {
              newResults.push(results[i]);
              break;
            }
            parent = parent.parentNode;
          }
        }
      } else if (match[2]) {
        i = 0;
        len = results.length;
        for (; i < len; i++) {
          parent = results[i].parentNode;
          while (parent) {
            if (parent.tagName.toLowerCase() == selector.toLowerCase()) {
              newResults.push(results[i]);
              break;
            }
            parent = parent.parentNode;
          }
        }
      } else if ( m = match[3]) {
        i = 0;
        len = results.length;
        for (; i < len; i++) {
          parent = results[i].parentNode;
          while (parent) {
            flag = classRE(m).test(parent.className);
            if (flag) {
              newResults.push(results[i]);
              break;
            }
            parent = parent.parentNode;
          }
        }
      }
    }
    return newResults;
  }

  function classRE(name) {
    return name in classCache ? classCache[name] : (classCache[name] = new RegExp('(^|\\s)' + name + '(\\s|$)'));
  }



  /**
   *
   *  view 的构造器. 用于构造一个管理view 视图的管理器.
   * @param {Object} config
   * @param config.name {String} *      视图的名称
   * @param config.tempName {String} *      [可选] 视图的引用的模板函数名
   * @param config.updateMap {HashMaping} *       用于更新视图
   * @param config.getResultMap {HashMapping} *       返回一个可以操作视图的函数
   * @param config.renderFn {Function} *      初始化视图操作
   * @param config.destroyFn {Function} *       销毁视图
   * @param config.events {HashMaping} *      视图绑定 dom 元素
   * @param config.triggers {HashMapping} *       视图sub的事件，被触发
   * @param config.mdulType {String} *      视图的所属的类别，为空表示为module，否则会加上mdulType 为前缀用于事件绑定
   *
   *
   */

  function View(config) {
    this.config = config;
    this.name = config.name;
    this.tempName = config.tempName;
    this.container = config.container || document.body;
    this.rootNode = null;
    this._hasRender = false;
    this._uid = (config.mdulType ? config.mdulType + '.' : '') + this.name.replace(/^view\./, '');

    // update不同的名称对应的function map
    this.updateMap = config.updateMap || {};

    // ctrls 的一个列表
    this.ctrlsMap = config.ctrlsMap || {};
    // 用于收集来自与 controls 的组件
    this._ctrlsMap = {};

    // methods 的列表
    this.methodsMap = config.methodsMap || {};

    // 需要获得内容的操作列表.
    this.getResultMap = config.getResultMap || {};

    // 初始化的接口，通常是对rootNode元素进行赋值
    this.renderFn = config.renderFn || function() {};
    this._hasRenderFn = !! config.renderFn;

    // 提供一个给用户使用的init 接口，不必要占用renderFn 里的操作
    this.init = config.init || function() {};

    // destroy 的时候的方法
    this.destroy = config.destroy || function() {};

    // 用户给绑定的事件集合
    this.events = config.events || {};

    // 用户需要views监听的事件
    this.triggers = config.triggers || {};

    // dom 的绑定事件，解绑时使用
    this._domEvts = {};

    // 用于事件之间的绑定等
    this._mdulName = null;

    // 实例化logs
    this.logs = new rc.logs.Logs({
      name: this.name
    });

  }


  View.prototype = {

    /**
     *  获得本地的缓存数据
     * @param{String}key    键值
     * @param{String}type   类别 session/storage，默认storage
     */
    getLocalData: function(key, type) {
      return rc.localcache.get(key, type);
    },

    /**
     *  设置本地的缓存数据
     * @param{String}key    键值
     * @param{Object}value    值
     * @param{String}type   类别 session/storage，默认storage
     */
    setLocalData: function(key, value, type) {
      return rc.localcache.set(key, value, type);
    },

    /**
     *  没有renderFn 的情况下，我们自己加入一套
     * @param {Object} data 传递进来的更新内容
     * @param {String} hashs 对应的当前的hash值
     */
    _noRenderFn: function(data, hashs) {
      // 存在tempName, 并且我们默认 template 里有 main 方法
      var html, div = document.createElement('div');
      if (this.tempName && rc.template) {
        this.ctrlsMap['temp'] = rc.template.getTempFuncs(this.tempName);
        html = this.getCtrl('temp').getMain(data, hashs);
        div.innerHTML = html;
        this.rootNode = div.children[0];
      } else {
        this.rootNode = div;
      }
      this.container.appendChild(this.rootNode);
      return this.rootNode;
    },

    /**
     *  默认如果有template 存在，我们需要和template 对接起来
     *  初始化渲染
     * @param {Object} data 传递进来的更新内容
     * @param {String} hashs 对应的当前的hash值
     */
    render : function(data, hashs) {
      // ctrlsMap 需要事先放入引入的文件
      if (!this._hasRender) {
        // 如果会传入父节点容器, 我们从父节点里去寻找内容
        if (data.viewContainer) {
          this.container = (this._qSelector(this.container, data.viewContainer))[0];
        } else if (typeof this.container === 'string') {
          // 选择获得的是数组，我们取第一个
          this.container = (this._qSelector(this.container))[0];
        }
        // 我们不在需要用户构建 renderFn了，我们将在此实现该部分
        if (!this._hasRenderFn) {
          this.rootNode = this._noRenderFn(data, hashs);
        } else {
          this.rootNode = this.renderFn(data, hashs);
        }

        if (data) {
          // 当我们传输进去的module 有依赖的时候，我们应该修改他的 pub 的指定
          if (data.mdulDepend) {
            this._uid = data.mdulDepend;
          }

          // 传递过来的业务载体模块的名字
          if (data.mdulName) {
            this._mdulName = data.mdulName;
          }
        }
        //dom事件绑定
        this._eventBind();
        this.init(data, hashs);
      }
      this._hasRender = true;
    },

    /**
     * 获得当前的节点对象
     */
    getContainer: function() {
      return this.rootNode;
    },

    /**
     *
     * 显示该view 层.
     */
    show: function() {
      return this._funcDisplay(true);
    },

    /**
     * 隐藏该view 层.
     */
    hide: function() {
      return this._funcDisplay(false);
    },

    /**
     *  控制 view 层的显示隐藏
     * @param {Boolean} isShow 是否显示
     */
    _funcDisplay: function(isShow) {
      if (this.rootNode) {
        this.rootNode.style.display = isShow ? '' : 'none';
      }
    },

    _qSelector: document.querySelectorAll ? function(selector, context) {
      return (context || this.rootNode || document.body)['querySelectorAll'](selector);
    } : function(selector, context) {
      return this.__querySelectorAll(selector, context || this.rootNode || document.body);
    },

    /**
     *  判断target 的元素是否在我们的选择器数组里
     * @private
     * @param {String} selector 选择器内容
     * @param {Function} func 执行的回调
     */
    _funcSelectorCheck: function(selector, func) {
      var that = this;
      return function(e) {
        var sels = that._qSelector(selector);
        var target = e.target || e.srcElement;
        var i = 0, ni = sels.length, elm, finder, args = [];
        for (; i < ni; i++) {
          elm = sels[i];
          if (that.__funcCheckParentElm(target, elm)) {
            args.push(elm);
            finder = elm;
            break;
          }
        }
        if (!finder) {
          return;
        }
        // FIXME, 由于我们需要用到this 指向我们的view, 所以, 我们改造了arguments, 将arguments的第一个实参改成了这个element (但是不一定是target)
        func.apply(that, args.concat([].slice.call(arguments)));
      };
    },

    /**
     *  判断是否该指针对象等于该节点对象或者在这个节点对象内
     * @param {Object} target 当前的指针对象
     * @param {Object} elm 需要对比的节点对象(htmlElment)
     */
    __funcCheckParentElm: function(target, elm) {
      if (target === elm) {
        return true;
      }
      var _target = target;
      while (_target !== this.rootNode && _target !== elm && _target !== null) {
        _target = _target.parentNode;
        if (_target === elm) {
          return true;
        }
      }
      return false;
    },


    /**
     *
     * FIXME 简单选择器 未完成
     * @param {String} selector       选择的内容
     *
     */
    __querySelectorAll: function(selector) {
      return SimpleSizzle(selector, parent || document.body);
    },


    /**
     * @private
     * 给dom 和被触发的事件 绑定事件
     */
    _eventBind: function() {
      if (!this.rootNode) {
        return;
      }
      var events = this.events,
        p, event, type,
        selector, he, fn;
      // 绑定 dom 事件
      for (p in events) {
        event = p.split(/ \:\: /);
        type = event[0];
        selector = event[1];
        fn = events[p];
        he = this._domEvts[p] = {
          type: type,
          func: this._funcSelectorCheck(selector, fn)
        };
        rce.domEvtBind(this.rootNode, type, he.func);
      }

      // 绑定需要订阅到事件
      var triggers = this.triggers;
      for (p in triggers) {
        this.sub(p, triggers[p], this);
      }

      // 提供对于controls 的简便操作方式
      var rcc = rc.controls,
        ctrls = this.ctrlsMap;
      if (rc.controls) {
        for (p in ctrls) {
          // 只要是 string 的说明都是我们会需要引入的control 对象
          if (typeof ctrls[p] === 'string') {
            // 来自view 的启动通常表示该module 肯定处于被激活状态
            this.ctrlsMap[p] = rcc.get(ctrls[p], this._mdulName, true, this.rootNode);
            this._ctrlsMap[p] = true;
          }
        }
      }
    },


    /**
     * 给dom 和被触发的事件 解绑事件
     */
    _eventUnbind: function() {
      if (!this.rootNode) {
        return;
      }
      var p, domEvts = this._domEvts, it, triggers = this.triggers;
      for (p in domEvts) {
        it = domEvts[p];
        rce.domEvtUnbind(this.rootNode, it.type, it.func);
      }
      this._domEvts = {};
      for (p in triggers) {
        this.removeSub(p, triggers[p]);
      }
      this.triggers = {};

      // 销毁对于controls 的引用
      var rcc = rc.controls,
        ctrls = this.ctrlsMap,
        _ctrls = this._ctrlsMap;
      if (rc.controls) {
        for (p in ctrls) {
          // 调用我们自己组件的方法
          if (_ctrls[p]) {
            ctrls[p].funcDestroy && ctrls[p].funcDestroy();
            delete _ctrls[p];
          } else {
            // 如果不是我们的组件，自带有destroy 的，则自己destroy掉
            ctrls[p] && ctrls[p].destroy && ctrls[p].destroy();
          }
          delete ctrls[p];
        }
      }
    },


    /**
     *
     *  当module层得到数据时，对dom进行操作，根据区域（模块）进行划分，不同的name
     * @param {String} name
     * @param {Object} data
     * @param {Object} hashs
     */
    update : function(name, data, hashs) {
      var fn = this.updateMap[name];
      if (!fn || !this.rootNode) {
        throw Error('update method ' + name + ' do not defined.');
        return;
      }
      fn.apply(this, [].slice.call(arguments, 1));
    },

    /**
     *  传入一个 args, 然后返回一个值.
     * @private
     * @param {String} type  所选择的类别
     * @param {String} name  所要选择的返回参数名
     * @param {Array} args    所需要返回的args 的数组
     */
    _getFuncFromMap: function(type, name, args) {
      var map = this[type];
      if (!map) {
        return;
      }
      var fn = map[name];
      if (!this.rootNode || !fn) {
        return;
      }
      return fn.apply(this, args);
    },


    /**
     *  是getResult 方法的兄弟篇，修改了必须要组装成数组才能够传递的方式
     * @param {String} name  所要选择的返回参数名
     */
    getResult: function(name) {
      var args = [].slice.call(arguments, 1);
      return this._getFuncFromMap('getResultMap', name, args);
    },


    /**
     *  getMethod 方法的兄弟篇，修改了必须要组装成数组才能够传递的方式
     * @param {String} name  所要选择的返回参数名
     */
    getMethod: function(name) {
      var args = [].slice.call(arguments, 1);
      return this._getFuncFromMap('methodsMap', name, args);
    },

    /**
     *  返回该ctrl 实例
     * @param {String} name  所要ctrl名
     * @param {String} method 需要传递的control 的方法名
     * @param {Array} args 会传递过去的参数
     */
    getCtrl: function(name, method, args) {
      var args2, ctrl = this.ctrlsMap[name];
      if (!ctrl) {
        return false;
      }
      if (arguments.length === 1) {
        return ctrl;
      } else if (arguments.length >= 2) {
        args2 = [].slice.call(arguments, 1);
        if (this._ctrlsMap[name]) {
          // 对于我们的组件里的操作，可以允许通过多个实参直接呼起
          return ctrl.getMethod.apply(ctrl, args2);
        }
        return ctrl[method] ?
          ctrl[method].apply(ctrl, [].slice.call(arguments, 2)) : false;
      }
      return false;

    },

    /**
     * 引入pages 的暴露接口功能可以让用户减少对于外部的引用，返回一个方法集合, 具体的方法类别请查找pages.pagesInterface
     */
    pages: rc.pages.pagesInterface(),

    /**
     *
     * 将挂在el元素下面的事件以及el对象销毁，并开放destroyFn方法，供其他的销毁事件处理
     */
    funcDestroy: function() {
      this.hide();
      // 执行用户需要的destroy 操作
      this.destroy && this.destroy();
      this._hasRender = false;
      if (this.rootNode) {
        this._eventUnbind();
        this.rootNode.parentNode && this.rootNode.parentNode.removeChild(this.rootNode);
        this.rootNode = null;
      }
    },

    /**
     * 以当前view的名义注册事件
     * @param {String} name       事件名称
     * @param {Function} callback   回调
     * @param {Object} context      上下文
     */
    sub : function(name, callback, context) {
      name = this.name + '.' + name;
      return rc.sub(name, callback, context);
    },

    /**
     *  在该view下发布相应事件
     *
     * @param {String} name
     * @param {Object} params
     */
    pub : function(name, params) {
      name = this._uid + '.' + name;
      var args = [name];
      if (arguments.length > 1) {
        args = args.concat([].slice.call(arguments, 1));
      }
      return rce.pub.apply(rce, args);
    },

    /**
     *
     *  移除事件
     * @param {String} name
     * @param {Function} callback
     */
    removeSub : function(name, callback) {
      name = this.name + '.' + name;
      return rc.removeSub(name, callback);
    }
  };


  rc.views = {
    // views 的集合
    _views: {},

    /**
     *
     *  定义一个view, 支持单个实参的传递
     * @param {Object} config
     */
    define: function(config) {
      if (this._views[config.name]) {
        return;
      }
      this._views[config.name] = config;
    },

    /**
     *  获得一个view
     * @param {String} name
     */
    get: function(name) {
      var view = this._views[name];
      if (!view) {
        return false;
      }
      return new View(rc.util.deepClone(view));
    },

    /**
     *
     *  销毁一个view
     * @param {String} name
     */
    destroy: function(name) {
      var view = this.get(name);
      if (!view) {
        return false;
      }
      view.funcDestroy && view.funcDestroy();
      delete _views[name];
    },

    init: function() {
      rc.sub('VIEWS.GETVIEW', this.get, this);
      rc.sub('VIEWS.DESTROYVIEW', this.destroy, this);
    }
  };
})(window.Tatami);


﻿/**
 * @class template
 */
;(function(rc) {
  if (!rc) {
    window.Tatami = rc = {};
  }
  if (!rc.template) {
    rc.template = {};
  }
  var template = {
    // 临时方案， 将模板解析对象放到里面去
    _tempObjList: {},

    /**
     * 添加模板函数集合
     * @param{String} name    方法集名称
     * @param{Object} funcObj 方法集合
     */
    addTempFuncs: function(name, funcObj) {
      if (!this._tempObjList[name]) {
        this._tempObjList[name] = funcObj;
      }
    },

    /**
     * 获得模板函数集合
     * @param{String} name    方法集名称
     */
    getTempFuncs: function(name) {
      return this._tempObjList[name] || false;
    },

  };
  rc.template = template;
})(window.Tatami);


/**
 * @by flyover
 */
;
(function(rc) {
  if (!rc) {
    rc = window.Tatami = {};
  }

  function Log(config) {
    this.config = config;


    // 设置实例log的name
    this.name = config.name;


    // 配置输出哪些log
    this.isShowDebug = true;
    this.isShowError = true;
    //线上默认 false;
    this.isShowLog = true;
  }

  Log.prototype = {
    log: function() {
      if (this.isShowLog) {
        console.log.apply(console, arguments);
        rc.pub('LOGS.LOG', this._stringify(arguments), 'log', this.name);
      }
    },

    error: function() {
      if (this.isShowError) {
        console.error.apply(console, arguments);
        rc.pub('LOGS.ERROR', this._stringify(arguments), 'error', this.name);
      }
    },

    debug: function() {
      if (this.isShowDebug) {
        console.info.apply(console, arguments);
        rc.pub('LOGS.DEBUG', this._stringify(arguments), 'debug', this.name);
      }
    },

    _stringify: function(args) {
      var __stringify = function() {
        var index;
        var result = [], strContent, it;
        for (index = 0; index < args.length; index++) {
          it = args[index];
          if (it instanceof Error) {
            result.push(it.stack);
          } else {
            strContent = rc.util.jsonString ? rc.util.jsonString(it) : '';
            if (!strContent) {
              strContent = JSON.stringify(it);
            }
            result.push(strContent);
          }
        }
        return result.join(' ');
      };

      try {
        return __stringify();
      } catch (e) {
        console.log(e);
        return;
      }
    }

  };

  /**
   * @descript 我们会上报所有可能的错误日志，包括http 请求，js logs 等
   */
  rc.logs = {

    // 用户module/view/controls中实例化的构造函数
    Logs: Log,

    _limit: 1000,

    _logList: [],

    _wsReady: false,

    //  push到本地队列 标记
    _stopPush: false,

    /**
     * 加入到发送日志日志队列
     *
     * @param {Object} info
     */
    _push: function(info) {
      // 如果ws可以用了
      // 直接放入ws队列
      // 否则放入本地队列
      if (this._wsReady) {
        // 直接调用ws方法
        rc.ws && rc.ws.sendLog(info);
      } else {
        // 限制本地队列大小
        if (!this._stopPush && this._logList.length < this._limit) {
          this._logList.push(info);
        }
      }
    },

    /**
     * 构建标准的日志格式
     *
     * @param {String} type error/log/debug
     * @param {String} content
     */
    _buildInfo: function(content, type, from) {
      return {
        type: type,
        content: content,
        from: from,
        time: +new Date()
      };
    },

    /**
     * 收集log日志
     *
     * @param {String} content 日志
     * @param {String} type log/error/debug
     */
    _collectLog: function(content, type, from) {
      var info = this._buildInfo(content, type, from);
      // 放入发送队列
      this._push(info);
    },

    /**
     * 启动ws
     *
     */
    _enabledWs: function() {
      // 设置启动ws
      this._wsReady = true;

      // 设置停止往本地队列塞数据
      this._stopPush = true;

      var count = this._limit;
      // 处理缓存的数据
      while (this._logList.length && count--) {
        this._push(this._logList.shift());
      }
    },

    /**
     * 关闭ws
     *
     */
    _disabledWs: function() {
      // 设置关闭ws
      this._wsReady = false;

      // 设置停止往本地队列塞数据
      this._stopPush = true;

      // 既然不启动ws
      // 直接清空本地数据队列
      this._logList.length = 0;
    },

    _extend: function(obj) {
      var key;
      for (key in obj) {
        if (this[key] === void 0) this[key] = obj[key];
      }
    },

    init: function(conf) {
      rc.sub('LOGS.LOG', this._collectLog, this);
      rc.sub('LOGS.ERROR', this._collectLog, this);
      rc.sub('LOGS.DEBUG', this._collectLog, this);

      // 自定义事件监听
      conf && rc.util.map(conf.logs, function(fun, eventName) {
        rc.sub(eventName, fun, this);
      }, this);

      // 监听ws事件
      rc.sub('PLUGINS.WS.ENABLED', this._enabledWs, this);
      rc.sub('PLUGINS.WS.DISABLED', this._disabledWs, this);

      // 实例Log
      // 给本身增加log/debug/error方法
      this._extend(new Log({
        name: 'globel'
      }));
    }
  };

})(window.Tatami);


// @koala-prepend 'Tatami.js',
// @koala-prepend 'Tatami.events.js',
// @koala-prepend 'Tatami.localcache.js',
// @koala-prepend 'Tatami.util.js',
// @koala-prepend 'Tatami.error.js',
// @koala-prepend 'Tatami.pages.js',
// @koala-prepend 'Tatami.request.js',
// @koala-prepend 'Tatami.modules.js',
// @koala-prepend 'Tatami.controls.js',
// @koala-prepend 'Tatami.views.js',
// @koala-prepend 'Tatami.template.js',
// @koala-prepend 'Tatami.logs.js',
