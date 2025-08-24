// Extended Array interface to support forEach with flexible callback parameters
interface Array<T> {
  // Original forEach (3 parameters)
  forEach(
    callbackfn: (value: T, index: number, array: T[]) => void,
    thisArg?: any
  ): void;

  // forEach with 2 parameters
  forEach(callbackfn: (value: T, index: number) => void, thisArg?: any): void;

  // forEach with 1 parameter
  forEach(callbackfn: (value: T) => void, thisArg?: any): void;

  // forEach with 0 parameters
  forEach(callbackfn: () => void, thisArg?: any): void;

  // https://github.com/microsoft/TypeScript/issues/17868#issuecomment-323173433
  // well,it depends pn how you define map function
  map<U>(
    callbackfn: (value: T, index: number, array: T[]) => U,
    thisArg?: any
  ): U[];
  map<U>(callbackfn: (value: T, index: number) => U, thisArg?: any): U[];
  map<U>(callbackfn: (value: T) => U, thisArg?: any): U[];
  map<U>(callbackfn: () => U, thisArg?: any): U[];
}
