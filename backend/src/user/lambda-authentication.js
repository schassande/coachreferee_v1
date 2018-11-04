'use strict';

const dynamodb = require('serverless-dynamodb-client');
const docClient = dynamodb.doc; // return an instance of new AWS.DynamoDB.DocumentClient()

const jwt = require('jsonwebtoken');
const fs = require('fs');
const secretKey = fs.readFileSync('conf/key.pem');

const headers = require('../common/headers');
const commonDb = require('../common/common-db');

const ul = require('./lib-user');
const UserLib = ul.UserLib();

exports.handler = (event, context, callback) => {
    console.log('Event:', JSON.stringify(event, null, 2));
    console.log('Context:', JSON.stringify(context, null, 2));

    const done = (err, res) => callback(null, {
        statusCode: err ? '400' : '200',
        headers: headers.httpHeaders,
        body: err ? err.message : JSON.stringify(res)
    });

    const tableName = commonDb.getTableName(UserLib.tableName, context.invokedFunctionArn);

    // Use case for authentification with email and password
    let body = JSON.parse(event.body);

    if (body && body.email) {
        docClient.query({
            TableName: tableName,
            KeyConditionExpression: 'email = :email',
            ExpressionAttributeValues: { ':email': body.email }
        }, (err, res) => {
            if (err) {
                console.log('Error during query: ' + err);
                done(err);
            } else if (!res || !res.Items || res.Items.length === 0) {
                console.log('User unknown:' + body.email);
                done(new Error('User unknown: ' + body.email));
            } else if (res.Items.length > 1) {
                console.log('Technical problem : several users found with the same email:' + body.email);
                done(new Error('Technical problem : several users found with the same email:' + body.email));
            } else {
                var user = res.Items[0];
                console.log('Check the user password.');
                let hashedPassword = UserLib.hash(body.password);
                console.log('Hashed password of user ' + body.email + ' is ' + hashedPassword);
                if (user.password != hashedPassword) {
                    console.log('User not authorized');
                    done(new Error('User not authorized'));
                } else {
                    console.log('Generate token for user: ' + user.email);
                    let token = generateToken(user);
                    user.password = '';
                    user.token = token;
                    user.authorizationToken = token;
                    done(null, { data: user });
                }
            }
        });
    } else {
        console.log('User is missing');
        done(null, { statusCode: '400', body: 'User is missing' });
    }
};

let generateToken = (payload) => {
    let options = {
        algorithm: 'HS256',
        //expiresIn: '24h',
        encoding: 'utf8'
    };
    let token = 'Bearer ' + jwt.sign(payload, secretKey, options);
    console.log('Token:', JSON.stringify(token, null, 2));
    return token;
};