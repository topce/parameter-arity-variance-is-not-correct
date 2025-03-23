let items = [1, 2, 3];
items.forEach(arg => console.log(arg));
items.forEach(() => console.log("Counting"));
function handler(arg) {
    console.log(arg);
}
function doSomething(callback) {
    callback('hello', 42);
}
// Expected error because 'doSomething' wants a callback of
// 2 parameters, but 'handler' only accepts 1
doSomething(handler);
class A {
    hi(a, b, c) {
        throw new Error("Method not implemented." + a);
    }
}
class B {
    hi(a) {
        throw new Error("Method not implemented." + a);
    }
}
class BrokenUserService {
    // TypeScript accepts this despite missing the required id parameter
    processUser(name) {
        // This implementation never uses the id, which could cause logic errors
        console.log(`Processing user ${name}`);
        // What if business logic depended on the id parameter?
    }
}
function requireBothParameters(callback) {
    // This function assumes callback will use both parameters
    callback("test", 123);
}
// TypeScript allows this despite handler ignoring the second parameter
requireBothParameters(handler);
