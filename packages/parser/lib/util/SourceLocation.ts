/**
 * A location in the source code
 */
export default class SourceLocation {
    start: Position;
    end: Position;

    filename: string;
    identifierName?: string;

    /**
     * @param start
     * @param end
     */
    constructor(start: Position, end?: Position) {
        this.start = start;
        this.end = end;
    }
}