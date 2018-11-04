'use strict';

const dynamodb = require('serverless-dynamodb-client');
const docClient = dynamodb.doc; // return an instance of new AWS.DynamoDB.DocumentClient()

const commonDb = require('../common/common-db');
const responseHelperLib = require('../common/response-helper');

const ul = require('./lib-user');
const UserLib = ul.UserLib();

exports.handler = (event, context, callback) => {
    const responseHelper = responseHelperLib.build(event, context, callback);
    const tableName = commonDb.getTableName(UserLib.tableName, context.invokedFunctionArn);
    let body = JSON.parse(event.body);

    //check parameters
    if (!body.email) {
        fail('ERROR: Missing email field in body');
        return;
    }
    console.log("body.email=" + body.email);

    // check the current user is the saved user or an admin
    let allowToUodate = body.email == responseHelper.getCallerEmail();

    docClient.get({ TableName: tableName, Key: { email: body.email } }, (err, data) => {
        const existingUser = data.Item && data.Item.email ? data.Item : null;
        console.log("Existing user=" + JSON.stringify(existingUser, null, 2));

        if (existingUser) { //update situation


            //Check authorization
            if (!allowToUodate) {
                console.log('ERROR: Authentification required to modify an existing user');
                responseHelper.failStatus('Authentification required to modify an existing user', '403');
                return;
            }

            //force to keep the same technical identifier
            body.id = existingUser.id;

            //Manage password update
            if (body.password) {
                //replace the password => hash it
                body.password = UserLib.hash(body.password);
            } else {
                // reuse the same password
                body.password = existingUser.password;
            }

            //ensure to have a profile
            if (!body.profile) {
                body.profile = 'user';
            }
        } else { //Create situation

            //ensure to have an id
            if (!body.id) {
                body.id = new Date().getTime();
            }

            //replace the password => hash it
            body.password = UserLib.hash(body.password);

            //create only normal user
            body.profile = 'user';
        }
        body.dataStatus = 'CLEAN';
        console.log("Store user=" + JSON.stringify(body, null, 2));
        docClient.put({ TableName: tableName, Item: body }, (err, res) => {
            if (err) {
                console.log('ERROR: Error during user creation operation: ' + err);
                responseHelper.fail(err);
            } else {
                console.log('User ' + (existingUser ? 'updated' : 'created'));
                //hide the password in the response
                body.password = null;
                responseHelper.success({ data: body, error: null });
            }
        });
    });

};