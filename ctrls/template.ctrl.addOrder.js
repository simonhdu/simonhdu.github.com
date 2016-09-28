;
(function(rc) {
  var funcs = {
    modal: function anonymous(data, filename) {
      'use strict';
      var _utils = window.tplUtils,
        helpers = window.tplHelp,
        escape = _utils.escape,
        _out = [];
      _out.push(' <div id="orderModal"> <div class="location-wrap"> <label>收货地址:</label> <ul id="my-location"></ul> </div> <div id="add-list"> <span class="add-location-button">添加地址</span> </div> <table> <thead> <tr> <th width="15%"></th> <th width="45%">型号</th> <th width="12%">单价</th> <th width="16%">数量</th> <th width="12%">合计</th> </tr> </thead> <tbody> <tr> <td> <div class="middle-wrap pic"> <img src="');
      _out.push(escape(data.picUrl));
      _out.push('" alt="" class="img" data-model="');
      _out.push(escape(data.model));
      _out.push('"> </div> </td> <td>');
      _out.push(escape(data.title));
      _out.push('</td> <td>');
      _out.push(escape(data.price));
      _out.push('</td> <td> <span class="minus" data-op="change">—</span> <input class="input" type="text" name="number" value="1"> <span class="plus" data-op="change">+</span> </td> <td class="cost">');
      _out.push(escape(data.price));
      _out.push('</td> </tr> </tbody> </table> <div class="message"> <label>给快卖打印机留言:</label> <input type="text" name="leaveMessage"> </div> <div class="txr"> <div id="checkInfo" class="txr"></div> <a id="saveOrder" class="message-btn">提交订单</a> </div> </div> ');
      return _out.join('');
    },
    location: function anonymous(data, filename) {
      'use strict';
      var _utils = window.tplUtils,
        helpers = window.tplHelp,
        escape = _utils.escape,
        _out = [];
      _out.push(' <li data-id="');
      _out.push(escape(data.id));
      _out.push('"> <label class="radio-pretty inline ');
      _out.push(escape(data.checked));
      _out.push('"> <input type="radio" name="radio"> <span class="address">');
      _out.push(escape(data.location));
      _out.push('</span> </label> ');
      if (data.id) {
        _out.push(' <span class="del">删除</span> ');
      }
      _out.push(' </li> ');
      return _out.join('');
    },
    detail: function anonymous(data, filename) {
      'use strict';
      var _utils = window.tplUtils,
        helpers = window.tplHelp,
        escape = _utils.escape,
        _out = [];
      _out.push(' <ul class="infoList"> <li>寄送至: ');
      _out.push(escape(data.location));
      _out.push('</li> <li>实付款: <span class="real-cost">');
      _out.push(escape(data.cost));
      _out.push('</span></li> <li>收货人: ');
      _out.push(escape(data.receiver));
      _out.push('</li> </ul> ');
      return _out.join('');
    },
    addList: function anonymous(data, filename) {
      'use strict';
      var _utils = window.tplUtils,
        helpers = window.tplHelp,
        _out = [];
      _out.push(' <div class="add-location"> <p class="tip-message">新增收货地址 </p> <ul> <li> <label> <i class="red">*</i>所在地区:&nbsp; </label> <span> <select id="province"></select> <select id="city"></select> <select id="area"></select> </span> <span class="tip hides" data-type="location">所在地区必须填写哦！</span> </li> <li> <label> <i class="red">*</i>详细地址:&nbsp; </label> <input type="text" name="detail"> <span class="tip hides" data-type="detail">详细地址必须填写哦！</span> </li> <li> <label> <i class="red">*</i>收货人姓名:&nbsp; </label> <input type="text" name="receiver"> <span class="tip hides" data-type="receiver">收货人必须填写哦！</span> </li> <li> <label> <i class="blue">*</i>手机号码:&nbsp; </label> <input type="text" name="mobile"> <span class="tip hides" data-type="phone">手机号码与固定电话至少填写一个哦！</span> </li> <li> <label> <i class="blue">*</i>固定电话:&nbsp; </label> <input type="text" name="tel"> </li> <li> <i class="red">*</i>为必填项，<i class="blue">*</i>其中手机和固定电话至少填写一个 </li> </ul> <div class="address-btn"> <button id="save" class="save-btn">保存</button> <button id="cancel" class="quit-btn">取消</button> </div> </div> ');
      return _out.join('');
    }
  };
  rc.template.addTempFuncs('tpl.template.ctrl.addOrder', funcs);
})(window.Tatami);