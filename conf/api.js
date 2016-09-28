;(function () {
  var api = {
    //获取店长顶部信息
    getSBNavList: {
      server: 'rc',
      url: SERVER_Path.getSBNavList,
      method: 'post'
    },
    //内购后台
    //获取地址
    getLocationList: {
      server: 'rc',
      url: SERVER_Path.getLocationList,
      method: 'post'
    },
    //新增地址
    addLocation: {
      server: 'rc',
      url: SERVER_Path.addLocation,
      method: 'post'
    },
    //删除地址
    deleteLocation: {
      server: 'rc',
      url: SERVER_Path.deleteLocation,
      method: 'post'
    },
    //查询订单
    queryOrderList: {
      server: 'rc',
      url: SERVER_Path.queryOrderList,
      method: 'post'
    },
    //修改价格
    changeOrderCost: {
      server: 'rc',
      url: SERVER_Path.changeOrderCost,
      method: 'post'
    },
    //新增订单
    addOrder: {
      server: 'rc',
      url: SERVER_Path.addOrder,
      method: 'post'
    },
    //管理后台
    //地址查询
    queryOrderListByAdmin: {
      server: 'rc',
      url: SERVER_Path.queryOrderListByAdmin,
      method: 'post'
    },
    //获取售后信息
    getInfoAfterSell: {
      server: 'rc',
      url: SERVER_Path.getInfoAfterSell,
      method: 'post'
    },
    //更新售后信息
    updateInfoAfterSell: {
      server: 'rc',
      url: SERVER_Path.updateInfoAfterSell,
      method: 'post'
    },
    //删除订单
    deleteOrder: {
      server: 'rc',
      url: SERVER_Path.deleteOrder,
      method: 'post'
    },
    //订单还原
    getBackOrder: {
      server: 'rc',
      url: SERVER_Path.getBackOrder,
      method: 'post'
    },
    //导出订单
    exportOrder: {
      server: 'rc',
      url: SERVER_Path.exportOrder,
      method: 'post'
    },
    //导出卡纸订单
    exportOrder_card: {
      server: 'rc',
      url: SERVER_Path.exportOrder_card,
      method: 'post'
    },
    //订单发货
    sendOrder: {
      server: 'rc',
      url: SERVER_Path.sendOrder,
      method: 'post'
    },
    //订单发货通过excel
    sendOrderByExcel: {
      server: 'rc',
      url: SERVER_Path.sendOrderByExcel,
      method: 'post'
    },
    //获取指定用户的地址列表
    getAddressList: {
      server: 'rc',
      url: SERVER_Path.getAddressList,
      method: 'post'
    },
    //修改订单的收货信息
    changeAddress: {
      server: 'rc',
      url: SERVER_Path.changeAddress,
      method: 'post'
    },
    //修改子订单sku
    changeOrderTradeSku:{
      server: 'rc',
      url: SERVER_Path.changeOrderTradeSku,
      method: 'post'
    },
    //修改订单状态
    changeOrderStatus:{
      server: 'rc',
      url: SERVER_Path.changeOrderStatus,
      method: 'post'
    },
    //拒绝订单重新发起确认请求
    confirmApplyAgain: {
      server: 'rc',
      url: SERVER_Path.confirmApplyAgain,
      method: 'post'
    },
    //登录
    login: {
      server: 'rc',
      url: SERVER_Path.login,
      method: 'post'
    },
    //更新确认发货状态
    check: {
      server: 'rc',
      url: SERVER_Path.check,
      method: 'post'
    },
    //商品信息
    getItem: {
      server: 'rc',
      url: SERVER_Path.getItem,
      dataType: 'json',
      method: 'post',
      headers: {
        'content-type': 'application/x-www-form-urlencoded;charset=utf-8'
      }
    },
    addItem: {
      server: 'rc',
      url: SERVER_Path.addItem,
      dataType: 'json',
      method: 'post',
      headers: {
        'content-type': 'application/x-www-form-urlencoded;charset=utf-8'
      }
    },
    //删除商品
    delItem: {
      server: 'rc',
      url: SERVER_Path.delItem,
      dataType: 'json',
      method: 'post',
      headers: {
        'content-type': 'application/x-www-form-urlencoded;charset=utf-8'
      }
    },
    //编辑商品
    updateItem: {
      server: 'rc',
      url: SERVER_Path.updateItem,
      dataType: 'json',
      method: 'post',
      headers: {
        'content-type': 'application/x-www-form-urlencoded;charset=utf-8'
      }
    },
    //删除sku
    delSkuItem: {
      server: 'rc',
      url: SERVER_Path.delSkuItem,
      dataType: 'json',
      method: 'post',
      headers: {
        'content-type': 'application/x-www-form-urlencoded;charset=utf-8'
      }
    },
    //更新sku
    updateSkuItem: {
      server: 'rc',
      url: SERVER_Path.updateSkuItem,
      dataType: 'json',
      method: 'post',
      headers: {
        'content-type': 'application/x-www-form-urlencoded;charset=utf-8'
      }
    },
    //新增sku
    addSkuItem: {
      server: 'rc',
      url: SERVER_Path.addSkuItem,
      dataType: 'json',
      method: 'post',
      headers: {
        'content-type': 'application/x-www-form-urlencoded;charset=utf-8'
      }
    },
    //新增批次码
    addBatchCode: {
      server: 'rc',
      url: SERVER_Path.addBatchCode,
      method: 'post',
      params: {
        api_name:'batchCode_add'
      },
      headers: {
        'content-type': 'application/x-www-form-urlencoded;charset=utf-8'
      },
      withCredentials: true
    },
    //获取批次码列表
    listBatchCode: {
      server: 'rc',
      url: SERVER_Path.listBatchCode,
      method: 'post',
      params: {
        api_name:'batchCode_getList'
      },
      headers: {
        'content-type': 'application/x-www-form-urlencoded;charset=utf-8'
      },
      withCredentials: true
    },
    //获取批次码列表
    updateStatus: {
      server: 'rc',
      url: SERVER_Path.updateStatus,
      method: 'post',
      params: {
        api_name:'batchCode_updateStatus'
      },
      headers: {
        'content-type': 'application/x-www-form-urlencoded;charset=utf-8'
      },
      withCredentials: true
    },
    bindCode:{
      server: 'rc',
      url: SERVER_Path.bindCode,
      method: 'post',
      params: {
        api_name:'bind_code'
      },
      headers: {
        'content-type': 'application/x-www-form-urlencoded;charset=utf-8'
      },
      withCredentials: true
    }

  };
  window.API = api;
})();
