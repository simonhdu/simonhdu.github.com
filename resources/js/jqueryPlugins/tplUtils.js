var escapeMap = {
    '<': '&#60;',
    '>': '&#62;',
    '\"': '&#34;',
    '\'': '&#39;',
    '&': '&#38;'
};


var escapeFn = function (s) {
    return escapeMap[s];
};


var toString = function (value, type) {

    if (typeof value !== 'string') {

        type = typeof value;
        if (type === 'number') {
            value += '';
        } else if (type === 'function') {
            value = toString(value.call(value));
        } else {
            value = '';
        }
    }

    return value;

};

var escapeHTML = function (content) {
    return toString(content)
    .replace(/&(?![\w#]+;)|[<>"']/g, escapeFn);
};

var isArray = Array.isArray || function (obj) {
    return ({}).toString.call(obj) === '[object Array]';
};

if(!window.tplUtils){
	window.tplUtils = {};
}
if(!window.tplHelp){
	window.tplHelp = {};
}
var tplUtils = window.tplUtils;
var tplHelp = window.tplHelp;

tplUtils.each = function (data, callback) {
    var i, len;        
    if (isArray(data)) {
        for (i = 0, len = data.length; i < len; i++) {
            callback.call(data, data[i], i, data);
        }
    } else {
        for (i in data) {
            callback.call(data, data[i], i);
        }
    }
};

tplUtils.include = function () {
    var funcName  = arguments.shift();
    return this[funcName](arguments);
};

tplUtils.escape = escapeHTML;
tplUtils.helpers = {};
tplUtils.$string = toString;

tplHelp.getRefundStatus = function(refund_status, notSimplified){
    var short = {
        'WAIT_SELLER_AGREE' :'新申请',
        'WAIT_BUYER_RETURN_GOODS' :'待退货',
        'WAIT_SELLER_CONFIRM_GOODS' :'待确认', //待收货
        'SELLER_REFUSE_BUYER' :'拒绝退款',
        'CLOSED' :'退款关闭',
        'SUCCESS' :'退款成功'
    },
    long = {
        'WAIT_SELLER_AGREE': '买家已经申请退款，等待卖家同意',
        'WAIT_BUYER_RETURN_GOODS': '卖家已经同意退款，等待买家退货',
        'WAIT_SELLER_CONFIRM_GOODS': '买家已经退货，等待卖家确认收货',
        'SELLER_REFUSE_BUYER': '卖家拒绝退款',
        'SUCCESS': '退款成功',
        'CLOSED': '退款关闭'
    };

    return notSimplified ? (long[refund_status] || '') : (short[refund_status] || '');
};
tplHelp.getRefundType = function(refund_status){
    var goods_status_list = {
        'BUYER_NOT_RECEIVED':'买家未收到货',
        'BUYER_RECEIVED':'买家已收到货',
        'BUYER_RETURNED_GOODS':'买家已退货'
    };

    return goods_status_list[refund_status] || '--';
};
tplHelp.getCurrentStatus = function(status){
    var map  = {
        //trade status
        'TRADE_NO_CREATE_PAY': '没有创建支付宝交易',
        'WAIT_BUYER_PAY': '待付款',
        'WAIT_SELLER_SEND_GOODS': '待发货',
        'SELLER_CONSIGNED_PART': '部分发货',
        'WAIT_BUYER_CONFIRM_GOODS': '已发货',
        'TRADE_BUYER_SIGNED': '已签收',
        'TRADE_FINISHED': '交易完成',
        'TRADE_CLOSED': '交易关闭',
        'TRADE_CLOSED_BY_TAOBAO': '淘宝关闭',
        'ALL_WAIT_PAY': '货到付款',
        'ALL_CLOSED': '交易关闭',
        'WAIT_PRE_AUTH_CONFIRM': '余额宝0元购合约中',
        //order 退款status
        'WAIT_SELLER_AGREE': '申请退款', //买家已经申请退款，等待卖家同意
        'WAIT_BUYER_RETURN_GOODS': '等待买家退货', //卖家已经同意退款，等待买家退货
        'WAIT_SELLER_CONFIRM_GOODS': '已退货待确认', //买家已经退货，等待卖家确认收货
        'SELLER_REFUSE_BUYER': '拒绝退款', //卖家拒绝退款
        'CLOSED': '退款关闭', //退款关闭
        'SUCCESS': '退款成功' //(退款成功)
    };
    return map[status];
};

tplHelp.deadtime = function(date,template) {
  template = template || 'dd天hh小时mm分ss秒';
  var day,hour,minute,second;
  var cut = new Date(date).getTime() - new Date().getTime(); 
  day = Math.floor(cut / (24 * 3600 * 1000));
  var left = cut % (24 * 3600 * 1000);
  hour = Math.floor(left / (3600 * 1000));
  left = left % (3600 * 1000);
  minute = Math.floor(left/(60 * 1000));
  left = left % (60 * 1000);
  second = Math.floor(left / 1000);
  return template.replace('dd',day)
    .replace('hh',hour)
    .replace('mm',minute)
    .replace('ss',second);
};

tplHelp.getButtonPath = function(data, lists) {
  return lists[data].picturePath;
};


