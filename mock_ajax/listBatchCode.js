/**
 * @author Wangyang
 */

var codeType = ['activity','zhuanpan','video'];
var status = ['valid','published'];

module.exports = function(params) {
	var obj = {
		"api_name": params.api_name,
        "result": 100,
        "message": "批次码 "+ params.batchCode +" 新增成功!null",
        "data": {
	        "items": [],
	        "pageNo": params.pageNo,
	        "pageSize": params.pageSize,
	        "total": 100
        }
    };
    for (var i = 0; i < params.pageSize; i++) {
    	var batchCode = Math.floor(Math.random()*1000000);
    	obj.data.items.push({
	 
			"batchCode": batchCode, //批次码
			 
			"codeType": codeType[Math.floor(Math.random()*codeType.length)],  //批次码类型
			 
			"codeUrl": "http://cjyx.ews.m.jaeapp.com/superboss/hpyl/index.html?type=code&batchCode="+batchCode,  //批次码链接
			 
			"created": Math.floor(Math.random()*1000000),  //批次码创建时间
			 
			"printCount": Math.floor(Math.random()*1000000),  //批次码印刷数量
			 
			"status": status[Math.floor(Math.random()*status.length)]  //批次码状态 valid 未发行 published 已发行
				 
    	})
    }
    return obj;
}
