/**
 * Created by kobestyle on 15/11/22.
 */
;
(function ($) {
    // 定义 Dialog 类
    function tipDialog(options) {
        options = $.extend({}, $.fn.tipDialog.defaults, options);

        this.options = options;
        this.hasInit = false;

        this.init();
    };

    tipDialog.prototype = {

        constructor: tipDialog,

        init: function () {
            // 创建弹出层
            this.dialog = $(this.options.template);
            // 内容填充
            this.render();
            $('body').append(this.dialog);
            // 关闭按钮事件绑定
            this.dialog.find('.close-icon').on('click', $.proxy(this.hide, this));

            // 其它按钮事件绑定
            this.dialog.find('[data-role=confirm]').on('click', $.proxy(this.confirm, this));
            this.dialog.find('[data-role=cancel]').on('click', $.proxy(this.hide, this));

            // 初始化完成标志
            this.hasInit = true;
        },

        show: function () {
            //暴露beforeshow方法，可在options中设置
            if (this.options.beforeShow) {
                this.options.beforeShow.apply(this);
            }

            this.dialog.show();

            //暴露aftershow方法，可在options中设置
            if (this.options.afterShow) {
                this.options.afterShow.apply(this);
            }
        },

        hide: function () {
            if (this.options.beforeHide) {
                this.options.beforeHide.apply(this);
            }

            this.dialog.hide();

            if (this.options.afterHide) {
                this.options.afterHide.apply(this);
            }

            if (this.options.needDestroy) {
                this.destroy();
            }
        },

        render: function () {
            var $header = this.dialog.find('header');
            var $body = this.dialog.find('.content');
            var $footer = this.dialog.find('footer');
            var html;

            if (this.options.hasTitle) {
                $header.html(this.options.title)
            }

            html = this.options.content;
            $body.append(html);

            if (this.options.hasBtn) {
                var btnCls,footer="";
                for (var i = 0; i < this.options.btnText.length; i++) {
                    if (this.options.btnRole[i] === 'cancel') {
                        btnCls = 'ui-btn btn-large';
                    } else {
                        btnCls = 'ui-btn btn-primary btn-large';
                    }
                    footer += '<button data-role="' + this.options.btnRole[i] + '" class="' + btnCls +'" >' + this.options.btnText[i] + '</button>'
                }
            }
            $footer.append(footer);
        },

        closeDelay: function (time) {
            setTimeout($.proxy(this.hide, this), time);
        },

        destroy: function () {
            this.dialog.remove();
        },

        confirm: function () {
            this.options.confirm.apply(this);
        }
    };

// 注册插件
    $.fn.tipDialog = function (options) {
        return this.each(function () {
            new tipDialog(options);
        });
    };

// 默认设置
    $.fn.tipDialog.defaults = {
        dialogClass: 'custom-alert',
        template: '<div class="custom-alert"><div class="black-background"></div><section><header class="header">提示</header><div class="content"></div><footer></footer></section></div>',
        zIndex: 999,
        hasTitle: false,
        content: '<i class="icon_warning"></i><p>确认要删除这一条奖项吗？</p>',
        hasBtn: true,
        btnText: ['确定', '取消'],
        btnRole: ['confirm', 'cancel'],
        needDestroy: true
    };

    $.fn.tipDialog.Constructor = tipDialog;
})(jQuery)