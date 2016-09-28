/**
 * Created by qianyongjun on 16/5/19.
 */
;(function (rc) {
    rc.views.define({
        name: 'view.index',
        tempName: 'tpl.template.index',
        container: '#J_container',
        updateMap: {},
        methodsMap: {
            init_page: function () {
                var html_content = this.getCtrl('temp', 'getContent');
                $('.wrap').html(html_content);

                this.getMethod('init_plugin');
            },
            init_plugin: function () {
                //图片轮播插件
                var slider = $('.banner').unslider({
                        dots: true,
                        delay: 3000,
                        speed: 500,
                    }),
                    data = slider.data('unslider');

                $('.slider-arrow').click(function () {
                    var fn = this.className.split(' ')[1];
                    data[fn]();
                });
            }
        },
        init: function () {
            this.$el = $(this.rootNode);
            this.getMethod('init_page');
        },
        events: {}
    })
}(window.Tatami));