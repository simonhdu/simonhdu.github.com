/**
 * Created by liujianhui on 16/9/27.
 */
(function (rc) {
    var rcud = rc.util.date;
    rc.views.define({
        name: 'view.header',
        tempName: 'tpl.template.header',
        container: '#J_page',
        ctrlsMap: {},
        updateMap: {
        },
        methodsMap: {
            init_page: function () {
                var html_head = this.getCtrl('temp', 'getHeader');
                var html_foot = this.getCtrl('temp', 'getFooter');
                $('#J_header').html(html_head);
                $('#J_footer').html(html_foot);

                this.getMethod('init_plugin');
            },
            init_plugin: function () {
                //导航
                $('.head_nav ul li').hover(function (el) {
                    var aUl = $('.sub_nav ul');
                    var target = $(el.target).data('type');
                    for (var i = 0; i < aUl.length; i++) {
                        $(aUl[i]).removeClass('showing');
                    }
                    if (target) {
                        $('.sub_nav').addClass('showing');
                        $('.sub_nav .' + target).addClass('showing');
                    } else {
                        $('.sub_nav').removeClass('showing');
                    }
                })
                $('.sub_nav').hover(function(){
                    $('.sub_nav').addClass('showing');
                }, function(){
                    $('.sub_nav').removeClass('showing');
                });
            }
        },
        init: function () {
            this.$el = $(this.rootNode);
            this.getMethod('init_page');
        }
    });
})(window.Tatami);