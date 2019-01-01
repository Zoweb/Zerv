/**
 * Line and column-based position
 * @type {module.Position}
 */
module.exports = class Position {
    /**
     * Gets a position from text and an offset
     * @param {string} input - Input source
     * @param {int} offset - Offset of the position
     */
    fromFileInfo(input, offset) {
        let line = 1;
        let lineStart = 0;
        let match;
    }

    /**
     * @param {int} line
     * @param {int} column
     */
    constructor(line, column) {
        this.line = line;
        this.column = column;
    }
};