export default interface IPathObserverList {
    [path: string]: IPathObserver[];
}

export interface IPathObserver {
    onChange(newValue: any);
    nodeId: number;
}