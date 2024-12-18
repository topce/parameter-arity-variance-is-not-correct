let items = [1, 2, 3];
items.forEach(arg => console.log(arg));
items.forEach( () => console.log("Counting"));

function handler(arg: string) {
    console.log(arg)
}
function doSomething(callback: (arg1: string, arg2: number) => void) {
    callback('hello', 42);
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
