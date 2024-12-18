interface Array<T> {
    forEach(callbackfn: (value: T, index: number) => void, thisArg?: any): void;
    forEach(callbackfn: (value: T) => void, thisArg?: any): void;
    forEach(callbackfn: () => void, thisArg?: any): void;
}