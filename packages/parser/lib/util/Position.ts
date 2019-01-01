/**
 * Line and column-based position
 */
import {lineBreakG} from "./whitespace";

export default class Position {
    /**
     * Gets a position from text and an offset
     * @param input - Input source
     * @param offset - Offset of the position
     */
    static fromFileInfo(input, offset) {
        let line = 1;
        let lineStart = 0;
        let match;

        lineBreakG.lastIndex = 0;
        while ((match = lineBreakG.exec(input)) && match.index < offset) {
            line++;
            lineStart = lineBreakG.lastIndex;
        }

        return new Position(line, offset - lineStart);
    }

    line: number;
    column: number;

    /**
     * @param line
     * @param column
     */
    constructor(line, column) {
        this.line = line;
        this.column = column;
    }
}