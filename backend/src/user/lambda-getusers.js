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

    docClient.scan({ TableName: tableName }, (err, data) => {
        if (err) {
            console.log('Error during user get operation: ' + err);
            responseHelper.fail({ data: null, error: err });

        } else {
            let users = data.Items;
            if (users) {
                users = users.map(function(user) {
                    return {
                        id: user.id,
                        email: user.email,
                        shortName: user.shortName,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        profile: user.profile,
                        photo: user.photo
                    };
                });
            }
            console.log('Found users: ' + JSON.stringify(users));
            responseHelper.success({ data: users });
        }
    });
};