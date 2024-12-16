var items = [1, 2, 3];
items.forEach(function (arg) { return console.log(arg); });
items.forEach(function () { return console.log("Counting"); });
function handler(arg) {
    console.log(arg);
}
function doSomething(callback) {
    callback('hello', 42);
}
// Expected error because 'doSomething' wants a callback of
// 2 parameters, but 'handler' only accepts 1
doSomething(handler);
