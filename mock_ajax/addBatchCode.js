/**
 * @author Wangyang
 */
module.exports = function(params) {
	return {
		"api_name": params.api_name,
        "result": 100,
        "message": "批次码 "+ params.batchCode +" 新增成功!null",
        "data": params.batchCode
    }
}
