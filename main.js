let items = [1, 2, 3];
items.forEach(arg => console.log(arg));
items.forEach(() => console.log("Counting"));
function handler(arg) {
    console.log(arg);
}
function doSomething(callback) {
    callback('hello', 42);
}
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
    processUser(name) {
        console.log(`Processing user ${name}`);
    }
}
function requireBothParameters(callback) {
    callback("test", 123);
}
requireBothParameters(handler);
