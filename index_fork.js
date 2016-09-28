process.on('message', function(data) {
    if (!data || !data.api_name) {
        process.send({act_type: 'error'});
        return;
    }
    var mdul = require('./mock_ajax/' + data.api_name + '.js');
    try {
        var tdata = mdul(data.params);
        process.send({act_type: 'loaded', act_value: data.type == 'ajax' ? JSON.stringify(tdata) : tdata});
    } catch(e) {
        process.send({act_type: 'error'});
    }
});