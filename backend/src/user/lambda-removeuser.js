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
    if (email != responseHelper.getCallerId()) {
        responseHelper.failStatus('Not authhorized to remove this user', '403');
        return;
    }

    docClient.get({ TableName: tableName, Key: { email: email } }, (err, data) => {
        const existingUser = data.Item && data.Item.email ? data.Item : null;
        console.log("Existing user=" + JSON.stringify(existingUser, null, 2));
        if (existingUser) {
            //remove the existing user
            docClient.delete({ TableName: tableName, Key: { email: email } }, (err, res) => {
                if (err) {
                    console.log('Error during user deletion operation: ' + err);
                    responseHelper.fail(err);
                } else {
                    console.log('User removed');
                    responseHelper.success(existingUser);
                }
            });
        } else {
            //user does not exist => OK
            responseHelper.success({});
        }
    });
};