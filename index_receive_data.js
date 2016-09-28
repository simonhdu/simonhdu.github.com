var fs = require('fs');
process.on('message', function(data) {
    if (!data) {
        process.send({act_type: 'error'});
        return;
    }
    try {
        fs.writeFile('./data_test/' + data.api_name + '.txt', JSON.stringify(data.params), function() {
            process.send({act_type: 'ended'});
        });
    } catch(e) {
        process.send({act_type: 'error'});
    }
});