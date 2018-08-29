'use strict';

const dynamodb = require('serverless-dynamodb-client');
const docClient = dynamodb.doc; // return an instance of new AWS.DynamoDB.DocumentClient()

const commonDb = require('../common/common-db');

const ul = require('./lib-user');
const UserLib = ul.UserLib();

exports.handler = (event, context, callback) => {
    const responseHelper = responseHelperLib.build(event, context, callback);
    const tableName = commonDb.getTableName(UserLib.tableName, context.invokedFunctionArn);

    docClient.scan({ TableName: tableName }, (err, data) => {
        if (err) {
            console.log('Error during user get operation: ' + err);
            responseHelper.fail(err);

        } else {
            console.log('Found users: ' + JSON.stringify(data));
            responseHelper.success(data);
        }
    });
};