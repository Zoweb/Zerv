/**
 * A location in the source code
 * @type {module.SourceLocation}
 */
module.exports = class SourceLocation {
    /**
     * @param {Position} start
     * @param {Position} end
     */
    constructor(start, end) {
        this.start = start;
        this.end = end;

        this.filename = null;
        this.identifierName = null;
    }
};