import ISearchResult, {CodeSearchResult, SearchResultType, StringSearchResult} from "../lib/ISearchResult";
import search, {createSearchResult, removeEmptyResults} from "../lib/search";

describe("@zerv/search", () => {
    const templateTest = test.each([
        [
            "returns empty array when input is empty",
            "{{", "}}",
            "", []
        ],
        [
            "returns original string when not using template",
            "{{", "}}",
            "Test string with nothing", [new StringSearchResult("Test string with nothing")]
        ],
        [
            "returns code contents when just template",
            "{{", "}}",
            "{{test}}", [new CodeSearchResult("test")]
        ],
        [
            "returns string and code contents when both (text code)",
            "{{", "}}",
            "it is a {{test}}", [new StringSearchResult("it is a "), new CodeSearchResult("test")]
        ],
        [
            "returns string and code contents when both (text code text)",
            "{{", "}}",
            "it is a {{test}} thing", [new StringSearchResult("it is a "), new CodeSearchResult("test"), new StringSearchResult(" thing")]
        ],
        [
            "returns string and code contents when both (code text)",
            "{{", "}}",
            "{{test}} thing", [new CodeSearchResult("test"), new StringSearchResult(" thing")]
        ],
        [
            "returns string and code contents when both (code text code)",
            "{{", "}}",
            "{{test}} thing {{foo}}", [new CodeSearchResult("test"), new StringSearchResult(" thing "), new CodeSearchResult("foo")]
        ],
        [
            "returns string and code contents when both (code text code text)",
            "{{", "}}",
            "{{test}} thing {{foo}} two", [new CodeSearchResult("test"), new StringSearchResult(" thing "), new CodeSearchResult("foo"), new StringSearchResult(" two")]
        ],
        [
            "returns string and code contents when both (text code text code)",
            "{{", "}}",
            "a {{test}} thing {{foo}}", [new StringSearchResult("a "), new CodeSearchResult("test"), new StringSearchResult(" thing "), new CodeSearchResult("foo")]
        ],
    ]);

    templateTest("%p", (name: string, start: string, end: string, input: string, expected: ISearchResult[]) => {
        const result = search(input, {start, end});
        expect(result).toEqual(expected);
    });
});

describe("@zerv/search.createSearchResult", () => {
    it("returns code search result when starting with start characters", () => {
        expect(createSearchResult("{{foo", "{{").type).toEqual(SearchResultType.code);
    });

    it("returns string search result when not starting with start characters", () => {
        expect(createSearchResult("foo", "{{").type).toEqual(SearchResultType.text);
    });

    it("does not start with start characters when detected as code", () => {
        expect(createSearchResult("{{foo", "{{").content).toEqual("foo");
    });

    it("does not detect as code when start characters are not at the start", () => {
        expect(createSearchResult("foo{{bar", "{{").type).toEqual(SearchResultType.text);
    });
});

describe("@zerv/search.removeEmptyResults", () => {
    it("removes empty string results", () => {
        expect(removeEmptyResults([new StringSearchResult("")])).toHaveLength(0);
    });

    it("removes empty code results", () => {
        expect(removeEmptyResults([new CodeSearchResult("")])).toHaveLength(0);
    });

    it("does not remove non-empty string results", () => {
        expect(removeEmptyResults([new StringSearchResult("foo")])).toHaveLength(1);
    });

    it("does not remove non-empty code results", () => {
        expect(removeEmptyResults([new CodeSearchResult("foo")])).toHaveLength(1);
    });
});