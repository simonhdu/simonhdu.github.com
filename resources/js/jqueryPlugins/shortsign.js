var $short_sign_dialog;
var signSuc = false;

function showShortSign(closeCallback){
	checkShortSign(closeCallback);
}

function __showShortSign(closeCallback) {
	if($short_sign_dialog){
		closeShortSign();
	}
	//var short_sign_url = "https://oauth.taobao.com/authorize?client_id=12011554&response_type=code&redirect_uri=http%3A%2F%2Ff.superboss.cc%2Findex.jsp&state=short_sign:105&view=web";
	var short_sign_url = "https://oauth.taobao.com/authorize?client_id=12011554&response_type=code&redirect_uri=http%3A%2F%2Ff.superboss.cc%2Findex.jsp&state=short_sign:1122&view=web";
	var content_html = '<div style="overflow:hidden;position:relative;width:700px;height:490px;">'
		+'<iframe id="shortSignFrame" class="iframe_win" name="info_box" frameBorder=0 scrolling="no" src="'+short_sign_url+'" style="position:absolute;top:-5px;" height="490" width="710"></iframe>'
		+'</div>';
	$short_sign_dialog = $.confirm({
		//backdrop: true,
		// keyboard: false,
		title:'活动工具-用户授权',
		body: content_html, //必填
		hasfoot: false,
		height:490,
		width:730,
		okHidden: function(){
			if(!closeCallback)
				return ;
			if( !signSuc)
				return ;
			closeCallback();
		}
	})
	// short_sign_dialog = $.dialog({
	// 	id: 'short_sign_dialog',
	// 	title:'活动工具-用户授权',
	// 	left:'52%',
	// 	fixed:false,
	// 	content: content_html,
	// 	close : function(){
	// 		if(!closeCallback)
	// 			return ;
	// 		if( !signSuc)
	// 			return ;
	// 		closeCallback();
	// 	}
	// 	});	
	

}


function closeShortSign(){
	//short_sign_dialog.close();
	$short_sign_dialog.modal('hide');
	$short_sign_dialog.remove();
}

/**
 * 检查一下是否需要短授权
 */
function checkShortSign(closeCallback){
	ajaxRequest({
		type : 'post',
		cache : 'false',
		dataType : 'json',
		url : '/s/check.rjson'
	}, function(data){
		//表示需要短授权
		if(data.needShortSign){
			__showShortSign(closeCallback);
			return ;
		}else{
			closeCallback();
		}
	});
}

