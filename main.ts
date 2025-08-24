/// <reference path="./array-extensions.d.ts" />

let items = [1, 2, 3];
items.forEach((arg) => console.log(arg));
items.forEach(() => console.log("Counting"));

function handler(arg: string) {
  console.log(arg);
}
function doSomething(callback: (arg1: string, arg2: number) => void) {
  callback("hello", 42);
}
// Expected error because 'doSomething' wants a callback of
// 2 parameters, but 'handler' only accepts 1
doSomething(handler);

// Original example why I get interested in this problem

interface I {
  hi(a: string, b: string): void;
}

class A implements I {
  hi(a: string, b: string, c: string): void {
    throw new Error("Method not implemented." + a);
  }
}
class B implements I {
  hi(a: string): void {
    throw new Error("Method not implemented." + a);
  }
}

// Example 3: Real-world Problem Scenario
// A service interface that processes users
interface UserService {
  processUser(name: string, id: number): void;
}

class BrokenUserService implements UserService {
  // TypeScript accepts this despite missing the required id parameter
  processUser(name: string): void {
    // This implementation never uses the id, which could cause logic errors
    console.log(`Processing user ${name}`);
    // What if business logic depended on the id parameter?
  }
}

function requireBothParameters(callback: (a: string, b: number) => void) {
  // This function assumes callback will use both parameters
  callback("test", 123);
}

// TypeScript allows this despite handler ignoring the second parameter
requireBothParameters(handler);

// Issue #21868: Function with no parameters assigned to function type expecting parameters
const some: ((arg: string) => boolean) = () => true;
// This should error because the function type expects a parameter but implementation ignores it
