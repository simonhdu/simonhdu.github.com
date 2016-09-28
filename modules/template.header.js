;
(function(rc) {
  var funcs = {
    getMain: function anonymous(data, filename) {
      'use strict';
      var _utils = window.tplUtils,
        helpers = window.tplHelp,
        _out = [];
      _out.push(' <div class="main_wrap"> <div id="J_header"></div> <div id="J_container"></div> <div id="J_footer"></div> </div> ');
      return _out.join('');
    },
    getFooter: function anonymous(data, filename) {
      'use strict';
      var _utils = window.tplUtils,
        helpers = window.tplHelp,
        _out = [];
      _out.push(' <div class="footer_wrap"> <div class="left"> <p>广东东荣正明房地产开发有限公司 版权所有 <span>法律声明</span></p> <p>粤ICP备10055119号-1 <span>网站支持</span></p> </div> <div class="right"> <img src="resources/images/gswj.jpg" alt=""> </div> </div> ');
      return _out.join('');
    },
    getHeader: function anonymous(data, filename) {
      'use strict';
      var _utils = window.tplUtils,
        helpers = window.tplHelp,
        _out = [];
      _out.push(' <div class="head_logo"> <a href="javascript:void(0);" class="logo"></a> </div> <div class="head_operate"> <a href="javascript:void(0);" class="icon-search"></a> <a href="javascript:void(0);" class="icon-menu"></a> </div> <div class="head_nav"> <ul> <li data-type=""><a href="#/index/">首页</a></li> <li data-type="about"><a href="javascript:void(0);">公司简介</a></li> <li data-type="news"><a href="javascript:void(0);">新闻动态</a></li> <li data-type=""><a href="javascript:void(0);">订房</a></li> <li data-type="project"><a href="javascript:void(0);">公司项目</a></li> <li data-type=""><a href="#/contact/">联系我们</a></li> <li data-type=""><a href="javascript:void(0);">网上留言</a></li> </ul> </div> <div class="sub_nav"> <ul class="about"> <li><a href="javascript:void(0);">集团公司</a></li> <li><a href="javascript:void(0);">企业文化</a></li> <li><a href="javascript:void(0);">下属公司</a></li> </ul> <ul class="news"> <li><a href="javascript:void(0);">企业新闻</a></li> <li><a href="javascript:void(0);">行业新闻</a></li> </ul> <ul class="project"> <li><a href="javascript:void(0);">房地产开发</a></li> <li><a href="javascript:void(0);">酒店经营</a></li> <li><a href="javascript:void(0);">矿业</a></li> </ul> </div> ');
      return _out.join('');
    }
  };
  rc.template.addTempFuncs('tpl.template.header', funcs);
})(window.Tatami);