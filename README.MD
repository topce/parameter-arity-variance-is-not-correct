### Proof of concept that Parameter Arity Variance is not Correct 

Code in main.ts is small proof of concept that Parameter Arity Variance is not Correct 


In this project use my version of TypeScript https://www.npmjs.com/package/@topce/typescript/v/24.12.16 
I use date versioning, it is more simple if I want to keep it up to date with original TypeScript


main.ts
> ```ts
> let items = [1, 2, 3];
> items.forEach(arg => console.log(arg));
> items.forEach( () => console.log("Counting"));
> 
> function handler(arg: string) {
>     console.log(arg)
> }
> function doSomething(callback: (arg1: string, arg2: number) => void) {
>     callback('hello', 42);
> }
> // Expected error because 'doSomething' wants a callback of
> // 2 parameters, but 'handler' only accepts 1
> doSomething(handler);
> 
>```

to run it localy 
>```bash
> npm i
> npm run compile 
>```

you will get one error:
```bash 
main.ts:13:13 - error TS2345: Argument of type '(arg: string) => void' is not assignable to parameter of type '(arg1: string, arg2: number) => void'.
  Target signature provides too many arguments. Expected 2 or more, but got 1.

13 doSomething(handler);
               ~~~~~~~


Found 1 error in main.ts:13

```
Notice you do not have compile errors on forEach!
### How this works?
First add code in checker.ts to check for parameter arity error
and in  es5.d.ts add forEach overloading 

> ```ts
>    forEach(callbackfn: (value: T, index: number, array: T[]) => void, thisArg?: any): void;
>
>    forEach(callbackfn: (value: T, index: number) => void, thisArg?: any): void;
>    forEach(callbackfn: (value: T) => void, thisArg?: any): void;
>    forEach(callbackfn: () => void, thisArg?: any): void;
> ```

### Why did not you create PR for this.

Try few years ago was kindly refuse.
If they think that working as expected nothing to do there.

### Cons 
 
This could break some code where authors of code indeed relied 
that "parameter arity variance is correct" for example 
in TypeScript itself could not compile  with my version of compiler.
Also some libraries but this could be adressed with --skipLibCheck option

This is POC and use it on your own responsability!

from TypeScript original wiki 
https://github.com/Microsoft/TypeScript/wiki/FAQ#parameter-arity-variance-is-correct

### Parameter Arity Variance is Correct

> I wrote some code like this and expected an error:
> ```ts
> function handler(arg: string) {
>     // ....
> }
>
> function doSomething(callback: (arg1: string, arg2: number) => void) {
>     callback('hello', 42);
> }
>
> // Expected error because 'doSomething' wants a callback of
> // 2 parameters, but 'handler' only accepts 1
> doSomething(handler);
> ```

This is the expected and desired behavior.

Let's consider another program first:
```ts
let items = [1, 2, 3];
items.forEach(arg => console.log(arg));
```

This is isomorphic to the example that "wanted" an error.
At runtime, `forEach` invokes the given callback with three arguments (value, index, array), but most of the time the callback only uses one or two of the arguments.
This is a very common JavaScript pattern and it would be burdensome to have to explicitly declare unused parameters.

If this *were* an error, it's not even clear how you would fix it! Adding the extra parameters is likely to run afoul of your linter:
```ts
let items = [1, 2, 3];
// Error: Unused variables 'i', 'arr'
items.forEach((arg, i, arr) => console.log(arg));
```
JavaScript doesn't have a "discard" binding method, so you'd either end up with lint suppressions, or ugly and useless parameters:
```ts
// No one wants to write this sad code:
items.forEach((arg, _1, _2) => console.log(arg));
```

> But `forEach` should just mark its parameters as optional!
> e.g. `forEach(callback: (element?: T, index?: number, array?: T[]))`

This is *not* what an optional callback parameter means.
Function signatures are always read from the *caller's* perspective.
If `forEach` declared that its callback parameters were optional, the meaning of that is "`forEach` **might call the callback with 0 arguments**".

The meaning of an optional callback parameter is *this*:
```ts
// Invoke the provided function with 0 or 1 argument
function maybeCallWithArg(callback: (x?: number) => void) {
    if (Math.random() > 0.5) {
        callback();
    } else {
        callback(42);
    }
}
```
`forEach` *always* provides all three arguments to its callback.
You don't have to check for the `index` argument to be `undefined` - it's always there; it's not optional.

There is currently not a way in TypeScript to indicate that a callback parameter *must* be present.
Note that this sort of enforcement wouldn't ever directly fix a bug.
In other words, in a hypothetical world where `forEach` callbacks were required to accept a minimum of one argument, you'd have this code:
```ts
[1, 2, 3].forEach(() => console.log("just counting"));
             //   ~~ Error, not enough arguments?
```
which would be "fixed", but *not made any more correct*, by adding a parameter:
```ts
[1, 2, 3].forEach(x => console.log("just counting"));
               // OK, but doesn't do anything different at all
```