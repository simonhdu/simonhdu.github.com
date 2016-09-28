/**
 * @author Jerrod
 */
;(function () {
  /**
   * route 配置表
   * 所有的配置都在此区间内进行(即, 可允许用户进行的相关操作)
   */
  var route_conf = {
    default_index: 'index',
    cp_list: {
      index: {
        title: '深圳东恒盛投资集团--首页'
      },
      about: {
        title: '深圳东恒盛投资集团--公司简介'
      },
      news: {
        title: '深圳东恒盛投资集团--新闻动态'
      },
      project: {
        title: '深圳东恒盛投资集团--公司项目'
      },
      order: {
        title: '深圳东恒盛投资集团--订房'
      },
      contact:{
        title: '深圳东恒盛投资集团--联系我们'
      },
      messages:{
        title: '深圳东恒盛投资集团--网上留言'
      }
    }
  };
  window.ROUTE = route_conf;
})();
