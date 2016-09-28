;
(function(rc) {
  var funcs = {
    getMain: function anonymous(data, filename) {
      'use strict';
      var _utils = window.tplUtils,
        helpers = window.tplHelp,
        _out = [];
      _out.push(' <div class="wrap"></div> ');
      return _out.join('');
    },
    getContent: function anonymous(data, filename) {
      'use strict';
      var _utils = window.tplUtils,
        helpers = window.tplHelp,
        _out = [];
      _out.push(' <div class="banner"> <ul class="pics"> <li> <a href="javascript:void(0);"><img src="resources/images/banner/1.jpg" alt="" width="1200px" height="675px"></a> </li> <li> <a href="javascript:void(0);"><img src="resources/images/banner/2.jpg" alt="" width="1200px" height="675px"></a> </li> <li> <a href="javascript:void(0);"><img src="resources/images/banner/3.jpg" alt="" width="1200px" height="675px"></a> </li> <li> <a href="javascript:void(0);"><img src="resources/images/banner/2.jpg" alt="" width="1200px" height="675px"></a> </li> </ul> <a href="javascript:void(0);" class="slider-arrow prev"><img class="arrow" id="al" src="resources/images/banner/prev.png" alt="prev" width="50" height="50"></a> <a href="javascript:void(0);" class="slider-arrow next"><img class="arrow" id="ar" src="resources/images/banner/next.png" alt="next" width="50" height="50"></a> </div> <div class="news_wrap"> <div class="news"> <h3>NEWS</h3> <div class="news_nav"> <ul> <li class="current">新闻</li> <li>公告</li> </ul> </div> <div class="news_content"> <ul> <li> <h3><a href="javascript:void(0);">新政突袭 广州楼市或增三成“免税房”</a></h3> <p>新政明确，自2015年3月31日起，个人将购买不足2年的住房对外销售的，全额征收营业税；个人将购买2年以上(含2年)的非普通住房对外销售的，按照其销售收入减去购买房屋的价款后的差额征收营业税；个人将购买2年以上(含2年)的普通住房对外销售的...</p> </li> </ul> </div> </div> <div class="news_more"> <ul> <li></li> <li class="current"></li> <li></li> <li></li> </ul> </div> <div class="project"> <div class="left"> <div class="name"> <h3>海门东恒盛国际大酒店</h3> <p>酒店</p> <p>地址:江苏省海门市解放中路888号</p> </div> </div> <div class="right"> <span>项目布局</span> </div> </div> </div> ');
      return _out.join('');
    }
  };
  rc.template.addTempFuncs('tpl.template.index', funcs);
})(window.Tatami);