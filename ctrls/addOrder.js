/**
 * Created by qianyongjun on 16/5/23.
 */
;(function (rc) {
  var tempName = 'tpl.template.ctrl.addOrder';

  rc.controls.define({
    name: 'ctrl.addOrder',
    dataMap: {
      price: null
    },
    privateMethods: {
      queryMyLocationList: function () {
        this.request({
          api: 'getLocationList',
          params: {}
        }, function (json) {
          this.getPrivMethod('renderMyLocationList', json.data);
          this.getPrivMethod('renderCheckInfo');
        }, function (error) {
          $.toast({
            ctx: error.message
          })
        })
      },
      renderMyLocationList: function (data) {
        var html = '';

        if (data.length > 0) {
          data.forEach(function (value, index) {
            if (index === 0) {
              value.checked = 'checked';
            }
            value.phone = value.mobilePhone || value.telephone;
            value.location = value.province + ' ' + value.city + ' ' + value.district + ' ' + value.detail + ' (' + value.receiverName + ' 收) ' + value.phone;

            html += rc.template.getTempFuncs(tempName)['location'](value)
          });

          $(document.body).find('#orderModal #my-location').html(html);
        }
      },
      renderCheckInfo: function (txt) {
        var modal = $(document.body).find('#orderModal'),
          info = txt || modal.find('#my-location label.checked .address').text(),
          number = +modal.find('input[name=number]').val(),
          list = info.split(' '),
          len = list.length,
          location = '',
          value;

        list.forEach(function (value, index) {
          if (index < len - 3) {
            location += (value + ' ')
          }
        });

        value = {
          cost: +this.getCtrlData('price') * number,
          receiver: list[len - 3].slice(1) + ' ' + list[len - 1],
          location: location
        };

        location = rc.template.getTempFuncs(tempName)['detail'](value);

        $(document.body).find('#orderModal #checkInfo').html(location);
      },
      showAddList: function () {
        var wrap = $(event.target).parent('#add-list'),
          html = rc.template.getTempFuncs(tempName)['addList']();

        wrap.html(html);
        //插件初始化
        $.city('province', 'city', 'area');
      },
      hideAddList: function (el) {
        var el = el || $(event.target),
          wrap = el.parents('#add-list'),
          button = '<span class="add-location-button">添加地址</span>';

        wrap.html(button);
      },
      addLocation: function () {
        var el = $(event.target),
          list = el.parents('.add-location'),
          province = list.find('#province').val(),
          city = list.find('#city').val(),
          area = list.find('#area').val(),
          detail = list.find('input[name=detail]').val(),
          receiver = list.find('input[name=receiver]').val(),
          mphone = list.find('input[name=mobile]').val(),
          tphone = list.find('input[name=tel]').val(),
          params;

        if (province === '--请选择省份--' && (province != '台湾' || province != '澳门' || province != '香港')) {
          return list.find('.tip[data-type=location]').show();
        } else {
          list.find('.tip[data-type=location]').hide();
        }

        if (!detail) {
          return list.find('.tip[data-type=detail]').show();
        } else {
          list.find('.tip[data-type=detail]').hide();
        }

        if (!receiver) {
          return list.find('.tip[data-type=receiver]').show();
        } else {
          list.find('.tip[data-type=receiver]').hide();
        }

        if (!mphone && !tphone) {
          return list.find('.tip[data-type=phone]').show();
        } else {
          list.find('.tip[data-type=phone]').hide();
        }

        if (mphone && !/^1[0-9]{10}/.test(+mphone)) {
          return $.toast({
            ctx: '请检查手机号码输入是否有误!'
          })
        }

        if (tphone && !/^((0\d{2,3})-)(\d{7,8})(-(\d{3,}))?$/.test(+tphone)) {
          return $.toast({
            ctx: '请检查固定号码输入是否有误!'
          })
        }

        params = {
          province: province,
          city: city,
          district: area,
          detail: detail,
          receiverName: receiver,
          mobilePhone: mphone,
          telephone: tphone
        };

        this.request({
          api: 'addLocation',
          params: params
        }, function (json) {
          $.toast({
            ctx: '地址新增成功!'
          });

          this.getPrivMethod('queryMyLocationList');
          this.getPrivMethod('hideAddList', el);
        }, function (error) {
          $.toast({
            ctx: error
          })
        })

      },
      //地址删除
      deleteLocation: function () {
        var self = this,
          el = $(event.target),
          id = el.parents('li[data-id]').data('id');

        $.alert({
          body: '确认删除吗?',
          okHide: function () {
            self.request({
              api: 'deleteLocation',
              params: {
                id: id
              }
            }, function (json) {
              rc.toast('删除成功!');
              self.getPrivMethod('queryMyLocationList');
            }, function (error) {
              $.toast({
                ctx: error.message
              })
            })
          }
        })
      },
      operateBuyNum: function (modal) {
        var el = $(event.target),
          type = el.attr('class'),
          input = modal.find('input[name=number]'),
          value = input.val(),
          price = +this.getCtrlData('price'),
          _value;

        if (type === 'minus') {
          if (value == 0) return false;

          _value = +value - 1;
          input.val(_value);
        } else if (type === 'plus') {
          _value = +value + 1;
          input.val(_value);
        }

        modal.find('td.cost').text(_value * price);
        this.getPrivMethod('renderCheckInfo');
      },
      //修改购买数量
      changeBuyNum: function (modal) {
        var el = $(event.target),
          value = el.val(),
          price = +this.getCtrlData('price');

        if (isNaN(+value)) {
          el.val(value.slice(0, value.length - 1));
          return rc.toast('请输入数字!')
        }

        if (!value && +value != 0) {
          el.val(0);
        }

        if (value.charAt(0) === '0') {
          el.val(value.slice(1));
        }

        modal.find('td.cost').text(+value * price);
        this.getPrivMethod('renderCheckInfo');
      },
      //订单新增
      saveOrder: function (modal) {
        var locationText = modal.find('#my-location label.checked .address').text(),
          leaveMessage = modal.find('input[name=leaveMessage]').val(),
          cost = +modal.find('table td.cost').text(),
          quantity = +modal.find('table input[name=number]').val(),
          model = modal.find('table .pic img').data('model'),
          params = {
            model: model,
            quantity: quantity,
            cost: cost,
            leaveMessage: leaveMessage,
            locationText: locationText
          };

        this.request({
          api: 'addOrder',
          params: params
        }, function (json) {
          modal.modal('hide');
          $.alert({
            body: '<a href="' + json.data + '" target="_blank">去购买链接</a>'
          })
        }, function (error) {
          $.toast({
            ctx: error.message
          })
        });
      }
    },
    methodsMap: {
      showModal: function (data) {
        var self = this,
          body = rc.template.getTempFuncs(tempName)['modal'](data),
          modal = $.alert({
            title: '订单信息',
            body: body,
            width: 950,
            closeBtn: true,
            hasfoot: false,
            needTop: true,
            show: function () {
              self.setCtrlData('price', data.price);
              self.getPrivMethod('queryMyLocationList');
            },
            shown: function () {
              //价格加减
              $(this).on('click', 'span[data-op]', function () {
                self.getPrivMethod('operateBuyNum', modal);
              });
              //价格修改
              $(this).on('input', 'input[name=number]', function () {
                self.getPrivMethod('changeBuyNum', modal);
              });
              //显示新增地址列表
              $(this).on('click', '.add-location-button', function () {
                self.getPrivMethod('showAddList')
              });
              //隐藏地址列表
              $(this).on('click', '#cancel', function () {
                self.getPrivMethod('hideAddList')
              });
              //选择地址
              $(this).on('click', 'label.radio-pretty', function () {
                var txt = $(event.target).parents('li[data-id]').find('.address').text();
                self.getPrivMethod('renderCheckInfo', txt);
              });
              //删除地址
              $(this).on('click', '.del', function () {
                self.getPrivMethod('deleteLocation');
              });
              //新增地址
              $(this).on('click', '#save', function () {
                self.getPrivMethod('addLocation');
              });
              //新增订单
              $(this).on('click', '#saveOrder', function () {
                self.getPrivMethod('saveOrder', modal);
              })
            }
          })
      }
    }
  });
}(window.Tatami));