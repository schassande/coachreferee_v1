'use strict';
const crud = require('common/crud');
const baseTableName = 'skillprofile';

/**
 * Filter an item
 * @param {*} item a persistent item
 * @param {*} responseHelper the helper to manager response
 * @return the item to return after filtering
 */
const filter = function(item, responseHelper) {
    // return the item only if the current user is admin or owner of the item
    return item;
};

/**
 * Checks if the receive item can be stored
 * @param {*} item the item received by POST method as body
 * @param {*} responseHelper the helper to manager response
 * @return a boolean indicating if the received item is valid
 */
const checkItem = function(item, responseHelper) {
    return true; //no validation required
};

/**
 * Adjust the item to store during a save operation
 * @param {*} itemToStore is the item to store on save operation
 * @param {*} responseHelper the helper to manager response
 * @return the item to store, eventually adjusted
 */
const adjustStoredItem = function(itemToStore, existingItem, responseHelper) {
    itemToStore.dataStatus = 'CLEAN';
    return itemToStore; // no modification before storing the item
};

/**
 * Adjust the item to return as body response after the save operation
 * @param {*} itemToReturn is the item to return after save operation
 * @param {*} responseHelper the helper to manager response
 * @return the item to return, eventually adjusted
 */
const adjustReturnedItem = function(itemToReturn, responseHelper) {
    return itemToReturn; // no modification before returning the item
};

/**
 * Verifies if the current user is allowed to remove an item.
 * @param {*} item is the item to remove
 * @param {*} responseHelper the helper to manager response
 * @return a boolean indicating if the current user is allowed to remove an item.
 */
const isAllowedToRemove = function(item, responseHelper) {
    return responseHelper.isAdminCaller();
};

exports.getItem = (event, context, callback) => {
    crud.getItem(event, context, callback, baseTableName, filter);
};
exports.getItems = (event, context, callback) => {
    crud.getItems(event, context, callback, baseTableName, filter);
};
exports.saveItem = (event, context, callback) => {
    crud.saveItem(event, context, callback, baseTableName, checkItem, null, adjustStoredItem, adjustReturnedItem);
};
exports.removeItem = (event, context, callback) => {
    crud.saveItem(event, context, callback, baseTableName, isAllowedToRemove);
};