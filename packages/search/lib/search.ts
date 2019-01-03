import ISearchResult, {CodeSearchResult, StringSearchResult} from "./ISearchResult";

export function createSearchResult(input: string, start: string): ISearchResult {
    if (input.startsWith(start)) return new CodeSearchResult(input.substr(start.length));
    return new StringSearchResult(input);
}

export function removeEmptyResults(results: ISearchResult[]): ISearchResult[] {
    return results.filter(it => it.content.length > 0);
}

export default function search(input: string, {
    start,
    end
}: {
    start: string,
    end: string
}) {
    const result: ISearchResult[] = [];

    if (input.indexOf(start) === -1) return removeEmptyResults([new StringSearchResult(input)]);

    let lastStartIndex: number = 0;
    let lastEndIndex: number = -start.length;

    while (lastEndIndex <= input.length) {
        const startIndex = input.indexOf(start, lastEndIndex + end.length);
        const endIndex = input.indexOf(end, startIndex + start.length);

        if (startIndex === -1 || endIndex === -1) break;

        result.push(createSearchResult(input.substring(lastEndIndex + end.length, startIndex), start));
        result.push(createSearchResult(input.substring(startIndex, endIndex), start));

        lastStartIndex = startIndex;
        lastEndIndex = endIndex;
    }

    result.push(createSearchResult(input.substring(lastEndIndex + end.length), start));

    return removeEmptyResults(result);
}