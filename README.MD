# Parameter Arity Variance in TypeScript: A Critical Analysis

This project demonstrates that TypeScript's parameter arity variance behavior can lead to potential runtime errors and inconsistent type checking.

## The Problem

TypeScript allows functions with fewer parameters to be assigned to function types with more parameters. While this enables common JavaScript patterns like array callbacks, it can also introduce subtle bugs when a function is expected to handle all provided parameters.

## Running the Examples

This project uses a modified version of TypeScript that reports errors 
when functions with fewer parameters are assigned to function types with more parameters:
https://github.com/topce/typescript-go/tree/parameter-arity-variance-is-not-correct

```bash
.\bin\tsgo.exe tsc main.ts
```

## Examples Demonstrating the Issue

### Example 1: Callback Parameters Being Silently Ignored

```typescript
// Typical callback scenario - TypeScript allows this
function handler(arg: string) {
    console.log(arg)
}

function doSomething(callback: (arg1: string, arg2: number) => void) {
    callback('hello', 42); // Second parameter is silently ignored by handler
}

doSomething(handler); // Should warn that handler doesn't use the second parameter
```

### Example 2: Interface Implementation Inconsistency

```ts
interface I {
    hi(a: string, b: string): void;
}

// Error - TypeScript correctly prevents adding MORE parameters
class A implements I {
    hi(a: string, b: string, c: string): void { // Error: Too many parameters
        throw new Error("Method not implemented." + a);
    }
}

// No error - but should be flagged as potentially unsafe
class B implements I {
    hi(a: string): void { // Only handles first parameter when interface requires two
        throw new Error("Method not implemented." + a);
    }
};
```

### Example 3: Real-world Problem Scenario

```ts
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
```

### Common Case Where Variance Is Useful

```ts
// Standard array iteration - here we want to allow partial parameter usage
let items = [1, 2, 3];
items.forEach(arg => console.log(arg)); // Only using first parameter is fine
items.forEach(() => console.log("Counting")); // Sometimes we don't need parameters at all
```

## TypeScript's Justification vs. Reality

TypeScript's official position (from their [FAQ](https://github.com/Microsoft/TypeScript/wiki/FAQ#parameter-arity-variance-is-correct)) is that this behavior is "correct" because it supports common JavaScript patterns like array callbacks.

However, this creates a blind spot in the type system:

1. TypeScript enforces that you can't add MORE parameters than an interface specifies
2. But allows you to implement FEWER parameters, potentially ignoring critical information

## Why This Matters

The parameter arity variance issue creates an inconsistency in TypeScript's otherwise strong type-checking:

1. **Silent failures**: Implementations can silently ignore parameters without warning
2. **Inconsistent enforcement**: Different rules applied to extra vs. missing parameters
3. **False sense of safety**: Interface conformance doesn't guarantee parameter handling

## Potential Solutions

1. Add an optional compiler flag for stricter parameter checking
2. Introduce syntax to mark parameters that must be handled by implementations
3. Provide linting rules to detect potentially problematic parameter arity variance

This project aims to highlight the need for TypeScript to revisit this design decision.