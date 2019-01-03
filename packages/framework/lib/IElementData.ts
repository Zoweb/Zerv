import ISearchResult from "@zerv/search/lib/ISearchResult";

export default interface IElementData {
    originalValue?: string;
    nodeData: ISearchResult[];
    nodeValues: string[];
}