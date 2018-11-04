const headers = require('../common/headers');

exports.build = (event, context, callback) => {
    console.log('Event:', JSON.stringify(event, null, 2));
    console.log('Context:', JSON.stringify(context, null, 2));

    let obj = {};
    obj.event = event;
    obj.context = context;
    obj.callback = callback;

    const fail = function(err) {
        return this.failStatus(err, '400');
    };
    obj.fail = fail;

    const failStatus = function(err, status) {
        return this.callback(null, {
            statusCode: status,
            headers: headers.httpHeaders,
            body: err ? err.message : JSON.stringify(err) // body response must be stringified due to the Proxy mode of the Lambda
        });
    };
    obj.failStatus = failStatus;

    const success = function(body) {
        return this.callback(null, {
            statusCode: '200',
            headers: headers.httpHeaders,
            body: JSON.stringify(body) // body response must be stringified due to the Proxy mode of the Lambda
        });
    };
    obj.success = success;

    const getCaller = function() {
        return this.event.requestContext.authorizer;
    };
    obj.getCaller = getCaller;

    const getCallerEmail = function() {
        return this.event.requestContext.authorizer.email;
    };
    obj.getCallerEmail = getCallerEmail;

    const getCallerId = function() {
        return this.event.requestContext.authorizer.id;
    };
    obj.getCallerId = getCallerId;

    const isAdminCaller = function() {
        return false;
    };
    obj.isAdminCaller = isAdminCaller;

    return obj;
}