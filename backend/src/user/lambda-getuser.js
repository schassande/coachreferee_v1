'use strict';

const dynamodb = require('serverless-dynamodb-client');
const docClient = dynamodb.doc; // return an instance of new AWS.DynamoDB.DocumentClient()

const responseHelperLib = require('../common/response-helper');
const commonDb = require('../common/common-db');

const ul = require('./lib-user');
const UserLib = ul.UserLib();

exports.handler = (event, context, callback) => {
    const responseHelper = responseHelperLib.build(event, context, callback);
    const tableName = commonDb.getTableName(UserLib.tableName, context.invokedFunctionArn);

    const email = event.pathParameters['email'];
    if (!email) {
        responseHelper.fail('Missing email field');
        return;
    }
    console.log("email=" + email);

    docClient.get({ TableName: tableName, Key: { email: email } }, (err, data) => {
        const existingItem = data.Item && data.Item.email ? data.Item : null;
        if (err) {
            console.log('Error during user get operation: ' + err);
            responseHelper.fail(err);

        } else if (existingItem.Item) {
            console.log('User found: ' + existingItem);
            responseHelper.success(existingItem);

        } else {
            console.log('User does not exist: ' + email);
            responseHelper.failStatus('Resource does not exist.', '404');
        }
    });
};