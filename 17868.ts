// https://github.com/microsoft/TypeScript/issues/17868#issuecomment-323173433
// well,it depends pn how you define map function
// interface Array<T> {
//     map<U>(callbackfn: (value: T, index: number, array: T[]) => U, thisArg?: any): U[];
//     map<U>(callbackfn: (value: T, index: number) => U, thisArg?: any): U[];
//     map<U>(callbackfn: (value: T ) => U, thisArg?: any): U[];
//     map<U>(callbackfn: () => U, thisArg?: any): U[];

// }

function squareAll(nums: number[]) {
    return nums.map((v) => v ** 2);
  }