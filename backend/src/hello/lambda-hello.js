'use strict';
const AWS = require('aws-sdk');
const commonDb = require('../common/common-db');
const responseHelperLib = require('../common/response-helper');

const dynamodb = require('serverless-dynamodb-client');
const ul = require('../user/lib-user');
const UserLib = ul.UserLib();
const docClient = dynamodb.doc; // return an instance of new AWS.DynamoDB.DocumentClient()

exports.hello = (event, context, callback) => {
    const responseHelper = responseHelperLib.build(event, context, callback);
    const tableName = commonDb.getTableName(UserLib.tableName, context.invokedFunctionArn);

    //const userProfile = event.requestContext.authorizer.profile; //fetch by the authorizer from the JWT token
    const body = (event.body ? JSON.parse(event.body) : event);

    if (!body.email) {
        responseHelper.fail("Wrong body: missing email");
        return;
    }
    docClient.query({
            TableName: tableName,
            KeyConditionExpression: 'email = :email',
            ExpressionAttributeValues: { ':email': body.email }
        },
        function(err, res) {
            if (err) {
                console.log("hello: Error during user lookup operation: " + err);
                responseHelper.fail(err);

            } else if (!res || !res.Items || res.Items.length === 0) {
                responseHelper.fail(new Error("User unknown: " + body.email));

            } else {
                console.log("hello: Hellllooooooo");
                responseHelper.success({ message: 'Hello', email: body.email /*, profile: userProfile*/ });
            }
        });
};