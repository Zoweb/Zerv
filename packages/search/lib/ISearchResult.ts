export default interface ISearchResult {
    type: SearchResultType;
    content: string;
}

export enum SearchResultType {
    text,
    code
}

export class StringSearchResult implements ISearchResult {
    type: SearchResultType.text = SearchResultType.text;
    content: string;

    constructor(content: string) {
        this.content = content;
    }
}

export class CodeSearchResult implements ISearchResult {
    type: SearchResultType.code = SearchResultType.code;
    content: string;

    constructor(content: string) {
        this.content = content;
    }
}