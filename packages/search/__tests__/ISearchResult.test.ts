import {CodeSearchResult, SearchResultType, StringSearchResult} from "../lib/ISearchResult";

describe("@zerv/search/ISearchResult/StringSearchResult", () => {
    it("should have type text", () => {
        expect(new StringSearchResult("foo").type).toEqual(SearchResultType.text);
    });

    it("should store content", () => {
        expect(new StringSearchResult("foo").content).toEqual("foo");
    });
});

describe("@zerv/search/ISearchResult/CodeSearchResu;t", () => {
    it("should have type code", () => {
        expect(new CodeSearchResult("foo").type).toEqual(SearchResultType.code);
    });

    it("should store content", () => {
        expect(new CodeSearchResult("foo").content).toEqual("foo");
    });
});