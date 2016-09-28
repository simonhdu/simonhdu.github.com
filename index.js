var http = require('http'),
    util = require('util'),
    open = require('open'),
    port = 8099,
    nstatic = require('node-static'),
    file = new (nstatic.Server)('./', {
        cache: 7200
    }),
    data_local_cookie = [],
    child_process = require('child_process'),
    time_out = 20000,
    server = http.createServer(function(request, response){
        var url = request.url,
            is_get = request.method === 'GET',
            trunk = '';
        console.log(url);
        request.addListener('data', function(d) {trunk += d;});
        request.addListener('end', function() {
            if (/^\/forward.jsp/.test(url)) {
                response.writeHead(302, {
                    'Location': 'http://st2.superboss.cc/index.html' + url.replace(/^\/forward.jsp/, '')
                });
                response.end(); 
                return;
            }
            //我们专门针对mock请求来做数据的派发
            if (/^\/(mock_ajax|post_data)/.test(url)) {
                try {
                    var params = get_params(url, trunk),
                        api_name = url.split('/')[2],
                        is_mock_ajax = /^\/mock_ajax/.test(url),
                        fork = child_process.fork('./' + (is_mock_ajax ? 'index_fork' : 'index_receive_data') + '.js'),
                        timeout_handler;
                    fork.on('message', function(data) {
                        //console.dir(data);
                        clearTimeout(timeout_handler);
                        fork.kill();
                        switch(data.act_type) {
                            case 'ended':
                                response.writeHead(200);
                                response.end();
                                break;
                            case 'loaded':
                                response.writeHead(200);
                                response.write(data.act_value || '');
                                response.end();
                                break;
                            case 'error':
                                func_error(response, 'error', params);
                        }
                    });
                    timeout_handler = setTimeout(function() {
                        func_error(response, 'timeout', params);
                        fork.kill();
                    }, time_out);
                    fork.send({
                        type:'ajax',
                        api_name: api_name,
                        params: params
                    });
                } catch(e) {
                    func_error(response, 'error', params, '未知错误');
                }
            }else if(/^\/(mock_java)/.test(url)) {
                getCookie(function(cookie,proxy_host){
                    var path = url.replace(/(\/mock_java)/,"");
                    var optionMethod = path.indexOf("?") > 0 ? "GET" : "POST";
                    var option = getOption(optionMethod,proxy_host,path,cookie,trunk)
                    http_request(optionMethod, option, function(req, res, data) {
                        response.writeHead(200);
                        response.write(data || '');
                        response.end();
                    }, trunk);
                });
            } else {
                //静态文件
                if (/(_v[^.]*)\.js$/.test(url)) {
                    var rp = RegExp.$1;
                    url = url.replace(rp, '');
                    if (/^\/bootstrap/.test(url)) {
                        url = url.replace('bootstrap', 'bootstrap_v1');
                    }
                    request.url = url;
                }
                file.serve(request, response, function(err, res){
                    if (err) {
                        //util.error("> Error serving " + request.url + " - " + err.message);
                        response.writeHead(err.status, err.headers);
                        response.end();
                    } else {}
                });
            }
        });
    }),
    fs = require('fs');


function get_params(url, trunk) {
    var params = {}, i;
    if (/\?/.test(url)) {
        var s_get = url.slice(url.lastIndexOf('?') + 1, url.length),
            p_get = get_split_param(s_get);
        for (i in p_get) {
            params[i] = p_get[i];
        }
    }
    if (trunk !== '') {
        var p_post = get_split_param(trunk);
        for (i in p_post) {
            params[i] = p_post[i];
        }
    }
    return params;
}

function get_split_param(url) {
    var i = 0, urls = url.split('&'), ni = urls.length, rd = {}, it;
    if (ni === 0) {
        return rd;
    }
    for (; i < ni; i++) {
        it = urls[i].split('=');
        rd[it[0]] = decodeURIComponent(it[1]);
    }
    return rd;
}
function func_error(res, tp, params, message) {
    var json = {};
    if (params.api_name) {
        json.api_name = params.api_name;
        json.message = message || '';
        json.result = 200;
        json.data = {};
        //来自rc 的需求
    } else {
        //模拟数据需求
        if (tp === 'timeout') {
            json = 'timeout';
        } else {
            tp.error_response = 'error';
        }
    }
    res.writeHead(200);
    res.write(typeof json === 'object' ? JSON.stringify(json) :  json);
    res.end();
}
server.listen(port); 
console.log('sys running ' + port);


function http_request(method, option, callback, data) {
    var cb = function(req, res) {
        var trunk = [];
        req.addListener('data', function(d) {
            trunk.push(d);
        });
        req.addListener('end', function() {
            callback && callback(req, res, trunk.join(''));
        });
        req.on('error', function() {
            console.log(arguments);
        });
    },myreq;
    if(method == "GET") {
        try {
            http.get(option, cb);
        } catch(e) {
            throw (e);
        }
        
    }else if(method == "POST") {
        myreq = http.request(option, cb);
        myreq.write(data);
    }
};

function getOption(method,host,path,cookie,queryString){
    var json = {
        hostname: host,
        path: path,
        method: method,
        headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Encoding': 'UTF-8',
            'Accept-Language': 'zh-CN,zh;q=0.8,en;q=0.6',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Cache-Control': 'max-age=0',
            'Connection': 'keep-alive',
            'Cookie': cookie || "",
            'Host': host,
            'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.120 Safari/537.36'
        }
    }
    if(queryString) {
        json.headers["Content-Length"] = queryString.length;
    }
    return json;
}

function getCookie(callback){
    if(data_local_cookie.length > 0){
        getHost(function(cookie_host,cookie_path,proxy_host){
            callback && callback(data_local_cookie,proxy_host);
        });
    }else{
        getHost(function(cookie_host,cookie_path,proxy_host){
            var option = getOption("GET", cookie_host, cookie_path);
            http_request("GET", option, function(res, rsp){
                data_local_cookie = res.headers["set-cookie"];
                callback && callback(data_local_cookie,proxy_host);
            })
        });
    }
}

function getHost(callback){
    //读取文件
    fs.readFile('proxy.json','utf8',function(err,data){
        if(err){
            return console.log(err);
        }
        var json = JSON.parse(data);
        var cookieUrl = json.cookieUrl,
            proxyUrl = json.proxyUrl;
        var cookie_arr = cookieUrl.replace(/^(http:\/\/)||(https:\/\/)/,"").split(/\//),
            cookie_host = cookie_arr[0],
            cookie_path = "/"+cookie_arr[1];
        var proxy_host = proxyUrl ? proxyUrl.replace(/^(http:\/\/)||(https:\/\/)/,"").split(/\//)[0] : cookie_host;
        callback && callback(cookie_host,cookie_path,proxy_host);
        
    });

}

//getCookie();





var os = require('os');
/**
 *  
 * @param {String} default_ip                   默认ip
 * @param {Boolean} is_local_first              是否本地优先
 */
function get_local_ip(default_ip, is_local_first) {
    var ifaces = os.networkInterfaces();
    var i, j, nj, it;
    //FIXME, 我们以本地连接为第一优先级, 但是可以配置
    if ('本地连接' in ifaces && is_local_first) {
        it = ifaces['本地连接'];
        for (j = 0, nj = it.length; j < nj; j++) {
            if (it[j].family === 'IPv4') {
                return it[j].address;
            }
        }
    }
    for (i in ifaces) {
        it = ifaces[i];
        if (/本地/.test(i)) {
            for (j = 0, nj = it.length; j < nj; j++) {
                if (it[j].family === 'IPv4') {
                    return it[j].address;
                }
            }
        }
        if (/无线/.test(i)) {
            for (j = 0, nj = it.length; j < nj; j++) {
                if (it[j].family === 'IPv4') {
                    return it[j].address;
                }
            }
        }
    }
    return default_ip || '127.0.0.1';
}

open('http://localhost:'+port+'/index_fe_dev.html',"chrome");
