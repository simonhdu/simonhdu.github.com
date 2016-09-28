;
(function(rc) {
  var funcs = {
    getMain: function anonymous(data, filename) {
      'use strict';
      var _utils = window.tplUtils,
        helpers = window.tplHelp,
        _out = [];
      _out.push(' <div class="contact-wrap"> <div class="contact-banner"> <img src="resources/images/contact.jpeg" alt=""> </div> <div class="contact-content"> <div class="wrap"> <div class="menu-cols"> <div class="title"> 联系我们</div> <div class="title-en "> Contact Us</div> </div> </div> <div class="contact-item"> <p class="title">深圳市东恒盛投资集团</p> <p>地址：深圳市罗湖区松园路88号</p> <p>电话：0755-25887224/25887217</p> <p>传真：0755-25887144</p> </div> <div class="contact-item"> <p class="title">广东东荣正明投资有限公司</p> <p>地址：广州市广州大道中918号8楼</p> <p>电话：020-38864668</p> <p>传真：020-38864668</p> </div> <div class="contact-item"> <p class="title">广州市景园商务酒店</p> <p>地址：广州市广州大道中918号</p> <p>电话：020-38864668</p> <p>传真：020-38864668</p> </div> <div class="contact-item"> <p class="title">深圳市东恒盛投资集团</p> <p>地址：深圳市罗湖区松园路88号</p> <p>电话：0755-25887224/25887217</p> <p>传真：0755-25887144</p> </div> <div class="contact-item"> <p class="title">广东东荣正明投资有限公司</p> <p>地址：广州市广州大道中918号8楼</p> <p>电话：020-38864668</p> <p>传真：020-38864668</p> </div> <div class="contact-item"> <p class="title">广州市景园商务酒店</p> <p>地址：广州市广州大道中918号</p> <p>电话：020-38864668</p> <p>传真：020-38864668</p> </div> </div> </div> ');
      return _out.join('');
    }
  };
  rc.template.addTempFuncs('tpl.template.contact', funcs);
})(window.Tatami);