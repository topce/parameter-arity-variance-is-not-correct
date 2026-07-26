# Parameter Arity Variance Is Not Correct

> **TypeScript allows assigning functions with fewer parameters than the target type expects — and that's a soundness hole.**

A comprehensive analysis, demonstration, and custom TypeScript compiler extension that proves parameter arity variance *can* be checked at compile time without breaking real-world code.

[![GitHub](https://img.shields.io/github/license/topce/parameter-arity-variance-is-not-correct)](LICENSE)
[![GitHub issues](https://img.shields.io/github/issues/topce/parameter-arity-variance-is-not-correct)](https://github.com/topce/parameter-arity-variance-is-not-correct/issues)

---

## The Problem

TypeScript has a long-standing design choice: **a function type `(a: string, b: number) => void` is assignable from `(a: string) => void`**. This is "parameter arity variance" — specifically, *contravariance of parameter count* — and it lets you drop parameters when implementing a callback or interface method.

While convenient, this is technically unsound:

```typescript
declare const xs: number[];
xs.forEach((x: number, index: number) => {
  // OK — full arity
});

xs.forEach((x: number) => {
  // Also OK — dropped `index`, `array` parameters
  // But the callback still receives them at runtime
});
```

The debate is *well-trodden ground* on the TypeScript issue tracker:

| Issue | Title | Status |
|-------|-------|--------|
| [#13043](https://github.com/Microsoft/TypeScript/issues/13043) | Provide option to disallow functions with fewer parameters in function type compatibility checks | Open since 2016 |
| [#16871](https://github.com/Microsoft/TypeScript/issues/16871) | Option to enforce exact parameter counts in function type compatibility | Open |
| [#17868](https://github.com/Microsoft/TypeScript/issues/17868) | strictFunctionTypes should also apply to function parameter arity | Open |
| [#20274](https://github.com/Microsoft/TypeScript/issues/20274) | Function parameter bivariance is unsound | Open |
| [#20541](https://github.com/Microsoft/TypeScript/issues/20541) | strictBindCallApply should also affect function parameter arity | Open |
| [#21868](https://github.com/Microsoft/TypeScript/issues/21868) | Suggestion: strict parameter arity check | Open |

The TypeScript team's position has been that stricter parameter checking would be too disruptive, especially for callback-heavy APIs like `Array.prototype.forEach` and event handlers. **This repo exists to test that assumption.**

## The Solution

**`--strictArity`** — a new compiler flag implemented in the custom TypeScript compiler [`@topce/native-preview`](https://www.npmjs.com/package/@topce/native-preview) (forked from microsoft/TypeScript).

### Supported Kinds (Granular Flags)

The flag can be applied to specific syntactic kinds, giving you incremental adoption:

| Flag | Scope | Example |
|------|-------|---------|
| `callsignature` | Call signatures in interfaces/types | `interface F { (a: string, b: number): void }` |
| `constructsignature` | Constructor signatures | `new (a: string, b: number) => {}` |
| `methodsignature` | Interface method declarations | `interface I { foo(a: string, b: number): void }` |
| `methoddeclaration` | Class/object method overrides | `class A { foo(a: string, b: number): void {} }` |
| `constructor` | Constructor parameter mismatches | `class B extends A { constructor(a: string) { ... } }` |
| `functiondeclaration` | Function declarations used as types | `function f(a: string, b: number): void` |
| `functionexpression` | Function expressions with target types | `const f: FnType = function(a: string): void {}` |
| `arrowfunction` | Arrow functions with target types | `const f: FnType = (a: string): void => {}` |
| `functiontype` | Callback parameter types | `takesCallback((a: string): void => {})` |
| `constructortype` | Constructor type expressions | `type C = new (a: string, b: number) => {}` |

### Presets & Combinators

| Preset | Equivalent To | Errors (test.ts) |
|--------|---------------|-----------------|
| `--strictArity all` / `--strictArity true` | All flags above | **9** |
| `--strictArity none` / `--strictArity false` | Disables all | **0** |
| `--strictArity callsignature,methodsignature` | Subset combo | **2** |

### Recommended for Existing Projects

```bash
tsgo --strictArity methoddeclaration,methodsignature,callsignature,constructsignature
```

This focuses on **contract-facing kinds** (interfaces, classes, call/construct signatures) while intentionally excluding callback-heavy kinds (function expressions, arrow functions, function types) that `forEach`-style APIs rely on.

## Quick Start

```bash
# Install
npm install

# Run the test suite
./test.sh

# Compile with strict arity checking
npx tsgo --noEmit --strictArity all test.ts

# Selective checking
npx tsgo --noEmit --strictArity callsignature,methodsignature test.ts
```

## Test Matrix

The `test.ts` file contains **10 test cases**, one per kind. Each assigns a function with *fewer* parameters than the target type expects:

| # | Kind | Test | `--strictArity all` |
|---|------|------|-------------------|
| 1 | `callsignature` | `const cs1: CallSig = (a: string) => {}` | ✅ error (2 params expected) |
| 2 | `constructsignature` | `const cs2: ConSig = class { constructor(a: string) {} }` | ✅ error |
| 3 | `methodsignature` | Class implementing interface with fewer params | ✅ error |
| 4 | `methoddeclaration` | Derived class method with fewer params | ✅ error |
| 5 | `constructor` | Derived class constructor with fewer params | ⚠️ 0 errors in TS 7.0.3 |
| 6 | `functiondeclaration` | Function var with fewer params | ✅ error |
| 7 | `functionexpression` | Function expression with fewer params | ⚠️ overlaps with functiontype |
| 8 | `arrowfunction` | Arrow function with fewer params | ⚠️ overlaps with functiontype |
| 9 | `functiontype` | Callback with fewer params | ✅ 3 errors (catches #7, #8, #9) |
| 10 | `constructortype` | Constructor type with fewer params | ✅ error |

Run `./test.sh` to see the full matrix with error counts.

## Implementation

The `--strictArity` flag was implemented in the [`@topce/native-preview`](https://github.com/topce/native-preview) fork of TypeScript. The change is surgical — it adds an additional check in the type assignability logic that compares the number of required parameters between the source and target function types.

The implementation is designed to be:
- **Backward-compatible** — defaults to current TypeScript behavior
- **Incremental** — flag applies per syntactic kind, not globally
- **Transparent** — emits standard TS error diagnostics with clear messages

## Architecture

```
├── test.ts          # 10 test cases covering all StrictArity kinds
├── test.sh          # Test matrix runner (flag combinations vs expected errors)
├── package.json     # Depends on @topce/native-preview (custom TS compiler)
├── tsconfig.json    # Full TypeScript 7.x config for reference
└── README.MD        # This file
```

## Related Work

- [TypeScript PR #42064](https://github.com/microsoft/TypeScript/pull/42064) — Previous attempt to add strict arity checking (closed)
- [TypeScript issue #13043](https://github.com/Microsoft/TypeScript/issues/13043) — Original feature request
- [type-fest](https://github.com/sindresorhus/type-fest) — Community type utilities (includes `FixedLengthArray`/`Tuple` helpers)
- [ts-strict-arity](https://github.com/topce/native-preview) — The compiler fork powering this demo

## FAQ

### Why not just use ESLint?

ESLint's `@typescript-eslint/no-unused-vars` and similar rules check lexical usage, not type-level arity. They can't catch cases where a function passed as a callback legitimately uses all its parameters but *shouldn't* be assignable to a narrower type. `--strictArity` operates at the *type system* level, catching soundness issues no linter can.

### Doesn't this break `forEach` and event handlers?

Potentially — which is why the flag is **granular**. For existing projects, the recommended preset excludes `functiontype`, `functionexpression`, and `arrowfunction`, so `xs.forEach(x => ...)` still works. You start with the strict contract-facing checks and opt into the stricter callback checks as your codebase evolves.

### Is this TypeScript-compatible?

The modified compiler emits the same output as upstream TypeScript for all files that don't trigger strict arity errors. It does not change emit — only type checking. You can drop it into an existing build pipeline with `--strictArity none` as a no-op.

## License

ISC
