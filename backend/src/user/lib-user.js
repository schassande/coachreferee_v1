'use strict';
exports.UserLib = function() {
    /**
     * Fonction de hash d'une string.
     */
    var hash = function(str) {
        var hash = 0,
            i, chr, len;
        if (str.length === 0) return hash;
        for (i = 0, len = str.length; i < len; i++) {
            chr = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    }
    this.hash = hash;
    return this;
}
exports.tableName = 'user';