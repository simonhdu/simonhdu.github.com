;(function () {
  var SERVER_Path = {
    'queryOrderListByAdmin': '/mock_ajax/queryOrderListByAdmin',//地址查询
    'deleteOrder': '/mock_ajax/deleteOrder',//删除订单
    'exportOrder': '/mock_ajax/exportOrder',//订单导出
    'exportOrder_card': '/mock_ajax/exportOrder_card',//卡纸订单导出
    'sendOrder' : '/mock_ajax/sendOrder',//订单发货(手动修改订单的物流名称+物流号)
    'sendOrderByExcel': '/mock_ajax/sendOrderByExcel',//订单发货(通过excel导入修改)
    'login': '/mock_ajax/login',//提交登录
    'check': '/mock_ajax/check',//更新确认发货状态,
    'changeOrderCost': '/mock_ajax/changeOrderCost',//修改订单价格
    'getAddressList': '/mock_ajax/getAddressList',    //获取指定用户的地址列表
    'changeAddress':'/mock_ajax/changeAddress', //修改订单的收货信息
    'confirmApplyAgain': '/mock_ajax/confirmApplyAgain', //拒绝订单重新发起确认请求
    'changeOrderTradeSku': '/mock_ajax/changeOrderTradeSku', //修改子订单sku
    'changeOrderStatus': '/mock_ajax/changeOrderStatus', //修改订单状态
    'bindCode': '/mock_ajax/bindCode', //绑定批次码

    'getItem': '/mock_ajax/getItem',
    'addItem': '/mock_ajax/addItem',
    'delItem': '/mock_ajax/delItem',
    'updateItem': '/mock_ajax/updateItem',
    'getSkuItem': '/admin/itemsku/list.rjson',
    'addSkuItem': '/admin/itemsku/add.rjson',
    'delSkuItem': '/mock_ajax/delSkuItem',
    'updateSkuItem': '/mock_ajax/updateSkuItem',

    // 批次码
    'addBatchCode': '/mock_ajax/addBatchCode',
    'listBatchCode': '/mock_ajax/listBatchCode',
    'updateStatus': '/mock_ajax/updateStatus'
  };
  window.SERVER_Path = SERVER_Path;
})();
