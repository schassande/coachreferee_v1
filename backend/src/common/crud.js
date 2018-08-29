'use strict';
const AWS = require('aws-sdk');
const commonDb = require('../common/common-db');
const responseHelperLib = require('../common/response-helper');

const dynamodb = require('serverless-dynamodb-client');
const docClient = dynamodb.doc; // return an instance of new AWS.DynamoDB.DocumentClient()

exports.getItem = (event, context, callback, baseTableName, filterItem) => {
    const responseHelper = responseHelperLib.build(event, context, callback);
    const tableName = commonDb.getTableName(baseTableName, context.invokedFunctionArn);

    const id = event.pathParameters['id'];
    if (!id) {
        responseHelper.fail("GET ${baseTableName} ${id}: Missing id field");
        return;
    }
    console.log("GET ${baseTableName} ${id}");

    docClient.get({ TableName: tableName, Key: { id: id } }, (err, data) => {
        const existingItem = data.Item && data.Item.id ? data.Item : null;
        if (err) {
            console.log("GET ${baseTableName} ${id}: Error during execution: " + err);
            responseHelper.fail(err);

        } else if (existingItem) {
            console.log("GET ${baseTableName} ${id}: found item=" + JSON.stringify(existingItem, null, 2));
            let item = filterItem ? filterItem(existingItem, responseHelper) : existingItem;
            if (item) {
                console.log("GET ${baseTableName} ${id}: authorized");
                responseHelper.success(existingItem);
            } else {
                console.log("GET ${baseTableName} ${id}: NOT authorized");
                responseHelper.failStatus('Not authorized to access to this resource.', '403');
            }

        } else {
            console.log("GET ${baseTableName} ${id}: resource does not exist");
            responseHelper.failStatus('Resource does not exist.', '404');
        }
    });
};

exports.getItems = (event, context, callback, baseTableName, filterItem) => {
    const responseHelper = responseHelperLib.build(event, context, callback);
    const tableName = commonDb.getTableName(baseTableName, context.invokedFunctionArn);

    docClient.scan({ TableName: tableName }, (err, data) => {
        if (err) {
            console.log("GET ${baseTableName}: Error during operation: " + err);
            responseHelper.fail(err);

        } else {
            console.log("GET ${baseTableName}: " + JSON.stringify(data));
            if (filterItem) {
                let filteredItems = data.Items.map((item) => {
                    return filterItem(item, responseHelper);
                });
                console.log("GET ${baseTableName}: ${filteredItems.length} items found after filtering.");
                responseHelper.success(filteredItems);
            } else {
                responseHelper.success(data);
            }
        }
    });
};

exports.saveItem = (event, context, callback, baseTableName, checkItem, getItemOwner, adjustStoredItem, adjustReturnedItem) => {
    const responseHelper = responseHelperLib.build(event, context, callback);
    const tableName = commonDb.getTableName(baseTableName, context.invokedFunctionArn);
    let body = JSON.parse(event.body);
    let id = body.id;

    //check parameters
    console.log("POST ${baseTableName} ${id}: body=" + JSON.stringify(body, null, 2));
    if (!id) {
        responseHelper.fail('ERROR: Missing id field in body');
        return;
    }
    if (checkItem && !checkItem(body, responseHelper)) {
        responseHelper.failStatus('Invalid parameter');
        return;
    }

    let itemToStore = body;

    docClient.get({ TableName: tableName, Key: { id: id } }, (err, data) => {
        const existingItem = data.Item && data.Item.id ? data.Item : null;
        console.log("POST ${baseTableName} ${id}: Existing item=" + JSON.stringify(existingItem, null, 2));
        if (existingItem) { //update situation

            //Check authorization
            let allowToUodate = !getItemOwner || (getItemOwner(body, responseHelper) == responseHelper.getCallerId());
            if (!allowToUodate) {
                console.log("POST ${baseTableName} ${id}: ERROR: Not authorized to update the resource");
                responseHelper.failStatus("POST ${baseTableName} ${id}: Not authorized to update the resource", '403');
                return;
            }

            //force to keep the same technical identifier
            itemToStore.id = existingItem.id;

        } else { //Create situation

            //ensure to have an id
            if (!itemToStore.id) {
                itemToStore.id = new Date().getTime();
            }
        }
        if (adjustStoredItem) {
            itemToStore = adjustStoredItem(itemToStore, existingItem, responseHelper);
        }
        console.log("Store user=" + JSON.stringify(itemToStore, null, 2));
        docClient.put({ TableName: tableName, Item: itemToStore }, (err, res) => {
            if (err) {
                console.log("POST ${baseTableName} ${id}: ERROR: Error during operation: " + err);
                responseHelper.fail(err);
            } else {
                console.log("POST ${baseTableName} ${id}: item " + (existingUser ? 'updated' : 'created'));
                let itemToReturn = itemToStore;
                if (adjustReturnedItem) {
                    itemToReturn = adjustReturnedItem(itemToReturn, responseHelper);
                }
                responseHelper.success(itemToReturn);
            }
        });
    });
};

exports.removeItem = (event, context, callback, baseTableName, isAllowedToRemove) => {
    const responseHelper = responseHelperLib.build(event, context, callback);
    const tableName = commonDb.getTableName(baseTableName, context.invokedFunctionArn);

    const id = event.pathParameters['id'];
    if (!id) {
        responseHelper.fail('Missing id field');
        return;
    }
    console.log("id=" + id);

    docClient.get({ TableName: tableName, Key: { id: id } }, (err, data) => {
        const existingItem = data.Item && data.Item.id ? data.Item : null;
        console.log("DEL ${baseTableName} ${id}: existing item=" + JSON.stringify(existingItem, null, 2));
        if (existingItem) {
            if (isAllowedToRemove(existingItem, responseHelper)) {
                //remove the existing user
                docClient.delete({ TableName: tableName, Key: { id: id } }, (err, res) => {
                    if (err) {
                        console.log("DEL ${baseTableName} ${id}: Error  operation: " + err);
                        responseHelper.fail(err);
                    } else {
                        console.log("DEL ${baseTableName} ${id}: removed");
                        responseHelper.success(existingUser);
                    }
                });
            } else {
                console.log("DEL ${baseTableName} ${id}: not authorized to delete resource");
                responseHelper.failStatus("DEL ${baseTableName} ${id}: not authorized to delete resource", '403');
            }
        } else {
            //Item does not exist => OK
            responseHelper.success({});
        }
    });
};