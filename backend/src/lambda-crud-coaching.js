'use strict';
const crud = require('common/crud');
const baseTableName = 'coaching';


/**
 * Returns the owner of the item
 * @param {*} item a persistent item
 * @param {*} responseHelper the helper to manager response
 * @return the owner of the item
 */
const getItemOwner = function(item, responseHelper) {
    return item.coachId;
};

/**
 * Indicates if the user calling the function is the owner of the item
 * @param {*} item a persistent item
 * @param {*} responseHelper the helper to manager response
 * @return a boolean indicating if the user calling the function is the owner of the item
 */
const isOwner = function(item, responseHelper) {
    return getItemOwner(item, responseHelper) == responseHelper.getCallerId();
};

/**
 * Indicates if the user calling the function is the owner of the item or an application admin
 * @param {*} item a persistent item
 * @param {*} responseHelper the helper to manager response
 * @return a boolean indicating if the user calling the function is the owner of the item or an application admin
 */
const isOwnerOrAdmin = function(item, responseHelper) {
    return isOwner(item, responseHelper) || responseHelper.isAdminCaller();
};

/**
 * Filter an item
 * @param {*} item a persistent item
 * @param {*} responseHelper the helper to manager response
 * @return the item to return after filtering
 */
const filter = function(item, responseHelper) {
    // return the item only if the current user is admin or owner of the item
    return isOwnerOrAdmin(item, responseHelper) ? item : null;
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
    return isOwnerOrAdmin(item, responseHelper);
};

exports.getItem = (event, context, callback) => {
    crud.getItem(event, context, callback, baseTableName, filter);
};
exports.getItems = (event, context, callback) => {
    crud.getItems(event, context, callback, baseTableName, filter);
};
exports.saveItem = (event, context, callback) => {
    crud.saveItem(event, context, callback, baseTableName, checkItem, getItemOwner, adjustStoredItem, adjustReturnedItem);
};
exports.removeItem = (event, context, callback) => {
    crud.saveItem(event, context, callback, baseTableName, isAllowedToRemove);
};