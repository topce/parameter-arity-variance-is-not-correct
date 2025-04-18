# Parameter Arity Variance in TypeScript: A Critical Analysis

<div align="center">
  
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)
![Custom](https://img.shields.io/badge/Parameter_Variance-Critical-red?style=for-the-badge)

</div>

> **A robust analysis of a critical type-safety issue in TypeScript's parameter checking mechanism.**

<details>
<summary>📑 Table of Contents</summary>

- [📌 The Problem](#-the-problem)
- [🚀 Running the Examples](#-running-the-examples)
- [🔍 Examples Demonstrating the Issue](#-examples-demonstrating-the-issue)
- [⚖️ TypeScript's Justification vs. Reality](#️-typescripts-justification-vs-reality)
- [❗ Why This Matters](#-why-this-matters)
- [💡 Solution](#-solution)
- [🛠️ Modifying d.ts Files](#️-modifying-dts-files)
- [🔄 Previously Reported Issues Now Resolved](#-previously-reported-issues-now-resolved)

</details>

## 📌 The Problem

TypeScript allows functions with fewer parameters to be assigned to function types with more parameters. While this enables common JavaScript patterns like array callbacks, it can also introduce subtle bugs when a function is expected to handle all provided parameters.

## 🚀 Running the Examples

This project includes two versions of TypeScript compiler:

<table>
  <tr>
    <th>Version</th>
    <th>Description</th>
    <th>Command</th>
  </tr>
  <tr>
    <td>🔧 <b>Modified Version</b><br>(in <code>/bin</code> folder)</td>
    <td>Reports errors when functions with fewer parameters are assigned to function types with more parameters.<br><br>Source: <a href="https://github.com/topce/typescript-go/tree/best-type-script">typescript-go/best-type-script</a></td>
    <td>
      <pre>.\bin\tsgo.exe tsc .\main.ts</pre>
    </td>
  </tr>
  <tr>
    <td>🔧 <b>Original Microsoft Version</b><br>(in <code>/_bin</code> folder)</td>
    <td>Uses TypeScript's default parameter arity variance behavior.</td>
    <td>
      <pre>.\_bin\tsgo.exe tsc .\main.ts</pre>
    </td>
  </tr>
</table>

### ⚙️ Differences Between Versions

The key difference is that the modified compiler in the `/bin` folder:

- ✅ Enforces stricter parameter checking by default
- ✅ Flags functions with fewer parameters when assigned to function types with more parameters
- ✅ Reports errors in cases where the original compiler would silently allow potentially unsafe assignments

This helps identify potential runtime errors that could occur when required parameters are silently ignored.

## 🔍 Examples Demonstrating the Issue

<details open>
<summary><b>Example 1: Callback Parameters Being Silently Ignored</b></summary>

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

</details>

<details>
<summary><b>Example 2: Interface Implementation Inconsistency</b></summary>

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

</details>

<details>
<summary><b>Example 3: Real-world Problem Scenario</b></summary>

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

</details>

<details>
<summary><b>Common Case Where Variance Is Useful</b></summary>

```ts
// Standard array iteration - here we want to allow partial parameter usage
let items = [1, 2, 3];
items.forEach(arg => console.log(arg)); // Only using first parameter is fine
items.forEach(() => console.log("Counting")); // Sometimes we don't need parameters at all
```

</details>

## ⚖️ TypeScript's Justification vs. Reality

TypeScript's official position (from their [FAQ](https://github.com/Microsoft/TypeScript/wiki/FAQ#parameter-arity-variance-is-correct)) is that this behavior is "correct" because it supports common JavaScript patterns like array callbacks.

<div align="center">
  <table>
    <tr>
      <td align="center">❌</td>
      <td><b>TypeScript enforces that you can't add MORE parameters than an interface specifies</b></td>
    </tr>
    <tr>
      <td align="center">⚠️</td>
      <td><b>But allows you to implement FEWER parameters, potentially ignoring critical information</b></td>
    </tr>
  </table>
</div>

## ❗ Why This Matters

The parameter arity variance issue creates an inconsistency in TypeScript's otherwise strong type-checking:

<div align="center">
<table>
  <tr>
    <th>Problem</th>
    <th>Description</th>
    <th>Impact</th>
  </tr>
  <tr>
    <td align="center"><b>Silent failures</b></td>
    <td>Implementations can silently ignore parameters without warning</td>
    <td>🔴 High</td>
  </tr>
  <tr>
    <td align="center"><b>Inconsistent enforcement</b></td>
    <td>Different rules applied to extra vs. missing parameters</td>
    <td>🟠 Medium</td>
  </tr>
  <tr>
    <td align="center"><b>False sense of safety</b></td>
    <td>Interface conformance doesn't guarantee parameter handling</td>
    <td>🔴 High</td>
  </tr>
</table>
</div>

## 💡 Solution

The solution to this issue is to use the modified TypeScript compiler (in the `/bin` folder) that enforces stricter parameter checking. This compiler:

<div align="center">
<table>
  <tr>
    <td align="center">🛡️</td>
    <td><b>Reports errors</b> when functions with fewer parameters are assigned to function types that expect more parameters</td>
  </tr>
  <tr>
    <td align="center">🔒</td>
    <td><b>Maintains TypeScript's type safety</b> without compromising on parameter handling</td>
  </tr>
  <tr>
    <td align="center">🚫</td>
    <td><b>Helps prevent potential runtime errors</b> from silently ignored parameters</td>
  </tr>
  <tr>
    <td align="center">✅</td>
    <td><b>Works properly with callbacks</b> due to modified TypeScript definition files in the bin folder</td>
  </tr>
</table>
</div>

## 🛠️ Modifying d.ts Files

To modify d.ts files in the bin folder, run the following commands:

```bash
node .\transform-dts-files.js
npx dprint fmt "bin/*.d.ts"
```

## 🔄 Previously Reported Issues Now Resolved

The following issues were previously marked as "working as intended" by the TypeScript team, but are now caught and reported as errors by the modified compiler:

<div align="center">
<table>
  <tr>
    <th>Issue</th>
    <th>Description</th>
    <th>Issue Date</th>
    <th>Status</th>
  </tr>
  <tr>
    <td><a href="https://github.com/microsoft/TypeScript/issues/13043">#13043</a></td>
    <td>Type hole with compatibility between optional parameters/extra parameters</td>
    <td>2016-12-20</td>
    <td>✅ Fixed</td>
  </tr>
  <tr>
    <td><a href="https://github.com/microsoft/TypeScript/issues/17868">#17868</a></td>
    <td>Reject functions with not enough parameters on strict mode</td>
    <td>2017-08-17</td>
    <td>✅ Fixed</td>
  </tr>
  <tr>
    <td><a href="https://github.com/microsoft/TypeScript/issues/20274">#20274</a></td>
    <td>Feature request - Make a parameter required for callback function</td>
    <td>2018-11-27</td>
    <td>✅ Fixed</td>
  </tr>
  <tr>
    <td><a href="https://github.com/microsoft/TypeScript/issues/20541">#20541</a></td>
    <td>Function argument comparison doesn't match expectations</td>
    <td>2017-12-07</td>
    <td>✅ Fixed</td>
  </tr>
  <tr>
    <td><a href="https://github.com/microsoft/TypeScript/issues/21868">#21868</a></td>
    <td>Typecheck passes for incorrect assignment</td>
    <td>2018-02-11</td>
    <td>✅ Fixed</td>
  </tr>
  <tr>
    <td><a href="https://github.com/microsoft/TypeScript/issues/46881">#46881</a></td>
    <td>Strict check arity of method that implements interface, type or class</td>
    <td>2021-11-20</td>
    <td>✅ Fixed</td>
  </tr>
</table>
</div>

---
