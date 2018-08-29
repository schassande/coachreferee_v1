'use strict';
/**
 * Lambda function to support JWT.
 * Used for authenticating API requests for API Gateway
 * as a custom authorizer:
 *
 * @see https://jwt.io/introduction/
 * @see http://docs.aws.amazon.com/apigateway/latest/developerguide/use-custom-authorizer.html
 */


const jwt = require('jsonwebtoken');
const fs = require('fs');
const secretKey = fs.readFileSync('conf/key.pem');

/**
 * Handle requests from API Gateway
 * "event" is an object with an "authorizationToken"
 */
exports.handler = (event, context, callback) => {
    console.log('Event:', JSON.stringify(event, null, 2));
    console.log('Context:', JSON.stringify(context, null, 2));

    if (event.authorizationToken && isJwtToken(event.authorizationToken)) {
        // Authorizer by token (google or Bearer)
        let token = event.authorizationToken.split(' ');
        if (token[0] === 'Bearer') {
            const options = {
                algorithm: 'HS256',
                ignoreExpiration: true
            };
            jwt.verify(token[1], secretKey, options, (err, tokenPayload) => {
                if (err) {
                    console.log('Verification Failure: ', JSON.stringify(err, null, 2));
                    callback('Unauthorized');
                } else if (tokenPayload) {
                    console.log('Token data: ', JSON.stringify(tokenPayload, null, 2));
                    let authResponse = generatePolicy(tokenPayload.email, 'Allow', event.methodArn);
                    authResponse.context = {
                        "email": tokenPayload.email,
                        "user": tokenPayload
                    };
                    callback(null, authResponse);
                } else {
                    console.log('Invalid payload: ', JSON.stringify(tokenPayload, null, 2));
                    callback('Unauthorized');
                }
            });
        } else {
            console.log('Wrong token type :', JSON.stringify(token[0], null, 2));
            callback('Wrong token type');
        }
    } else {
        console.log('Token is missing');
        callback('Token is missing');
    }
};

let isJwtToken = (authorizationToken) => {
    if (!authorizationToken) {
        return false;
    }
    let token = authorizationToken.split(' ');
    return token.length > 0 && token[0] === 'Bearer';
};

let generatePolicy = (principalId, effect, resource) => {
    let authResponse = {};
    authResponse.principalId = principalId;
    if (effect && resource) {
        let policyDocument = {};
        policyDocument.Version = '2012-10-17'; // default version
        policyDocument.Statement = [];
        let statementOne = {};
        statementOne.Action = 'execute-api:Invoke'; // default action
        statementOne.Effect = effect;
        statementOne.Resource = resource;
        policyDocument.Statement[0] = statementOne;
        authResponse.policyDocument = policyDocument;
    }
    return authResponse;
};