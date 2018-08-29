const tablePrefix = 'refcoach';
getTableSuffix = function(invokedFunctionArn) {
    let suffix = invokedFunctionArn.split(':')[7];
    if (!suffix) suffix = 'dev';
    return suffix;
};

exports.getTableName = function(tableName, invokedFunctionArn) {
    return tablePrefix + '_' + tableName + '_' + getTableSuffix(invokedFunctionArn);
};