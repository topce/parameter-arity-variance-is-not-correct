# Parameter Arity Variance Is Not Correct

> **A custom TypeScript compiler flag (`--strictArity`) that makes function parameter arity checking opt-in and granular, without breaking existing codebases.**

TypeScript intentionally allows a function with *fewer* parameters to be assigned where *more* are expected. This is a pragmatic design choice that keeps callback-heavy APIs ergonomic, but it also means the type system won't catch mismatches between declared and actual parameter counts. `--strictArity` gives you the option to enforce strict arity where it matters most.

[![ISC License](https://img.shields.io/github/license/topce/parameter-arity-variance-is-not-correct)](LICENSE)
[![GitHub issues](https://img.shields.io/github/issues/topce/parameter-arity-variance-is-not-correct)](https://github.com/topce/parameter-arity-variance-is-not-correct/issues)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![npm](https://img.shields.io/badge/npm-%40topce%2Fnative--preview-red?logo=npm)](https://www.npmjs.com/package/@topce/native-preview)

---

## Background

### The Design Tradeoff

In TypeScript's structural type system, function types are related by their parameter and return types. One specific rule is that **a function type is assignable from any function type that has *fewer or the same* required parameters**. Concretely:

```typescript
type Handler = (a: string, b: number) => void;

// This compiles because (a: string) => void has fewer required parameters.
const ok: Handler = (a: string) => {
  // TypeScript considers this safe: any caller of `Handler` will supply
  // two arguments, but the implementation is free to ignore the second.
};
```

This is not a bug — it's by design. It's what makes patterns like this work seamlessly:

```typescript
// forEach callback receives (value, index, array), but most callers
// only need `value`. Parameter arity variance makes this ergonomic.
[1, 2, 3].forEach(x => console.log(x));
```

The tradeoff surfaces when a function type contract expects multiple parameters but an implementation provides fewer — callers pass arguments that are silently ignored at runtime, with no compiler diagnostic. This is the gap that `--strictArity` addresses.

When arity variance chains through intermediate variables, unsoundness compounds in non-obvious ways. Real examples from the TypeScript issue tracker ([#13043](https://github.com/Microsoft/TypeScript/issues/13043), [#46881](https://github.com/microsoft/TypeScript/issues/46881)):

**Minimal case** — a function accepting a callback with parameters silently accepts one with fewer. The extra arguments are simply ignored at runtime ([#46881](https://github.com/microsoft/TypeScript/issues/46881)):

```typescript
function handler(cb: (x: number, y: string) => void) {
  cb(1, 'hello');
}

// No error — but `y` is silently dropped. If the callback consumed `y`,
// this would be a bug. TypeScript provides no diagnostic.
handler((x: number) => {
  console.log(x);
});
```

**Real-world example** — this bug was found in production when adding AWS Translate alongside an existing Google Translate integration. The application compiled with zero TypeScript errors but failed at runtime:

```typescript
// Before — only Google Translate. Everything works.
export interface ITranslate {
  isValidLocale(targetLocale: string): Promise<boolean>;
  translateText(text: string, targetLocale: string): Promise<string>;
}

// google.ts — correct implementation
class GoogleTranslate implements ITranslate {
  async translateText(text: string, targetLocale: string): Promise<string> {
    return text;
  }
}
```

Later, AWS Translate was added. AWS needs a `sourceLocale` to know which language to translate *from* (Google auto-detects it):

```typescript
// New interface — sourceLocale added because AWS needs it
export interface ITranslate {
  isValidLocale(targetLocale: string): Promise<boolean>;
  translateText(
    text: string,
    sourceLocale: string,  // new — AWS needs this
    targetLocale: string
  ): Promise<string>;
}

// google.ts — OLD implementation, NOT updated. STILL COMPILES.
class GoogleTranslate implements ITranslate {
  async translateText(text: string, targetLocale: string): Promise<string> {
    // BUG: targetLocale is actually sourceLocale at runtime!
    // Arguments shifted — the 2nd arg (sourceLocale) lands in targetLocale.
    return text;
  }
}

// aws.ts — correct, has all three params
class AwsTranslate implements ITranslate {
  async translateText(
    text: string,
    sourceLocale: string,
    targetLocale: string
  ): Promise<string> {
    return text;
  }
}
```

The application compiled with no TypeScript errors, but at runtime the Google implementation received `sourceLocale` where it expected `targetLocale` — argument positions shifted silently. With `--strictArity methodsignature`, this is caught at compile time:

```
error TS2416: Property 'translateText' in type 'GoogleTranslate' is not assignable
to the same property in base type 'ITranslate'.
  Type '(text: string, targetLocale: string) => Promise<string>' is not assignable
to type '(text: string, sourceLocale: string, targetLocale: string) => Promise<string>'.
    Target signature provides too few arguments. Expected 2 or more, but got 3.
```

A more subtle class of bugs arises when arity variance chains through intermediate variables. For example ([#13043](https://github.com/Microsoft/TypeScript/issues/13043)):

```typescript
const src = (a: number = 1): number => a;          // (a?: number) => number
const mid: () => number = src;                      // fine — optional param is call-compatible with zero
const out: (a: string) => number = mid;             // no error by default, but: () => number assigned to (a: string) => number

out('x').toFixed();
// Runtime: TypeError — 'x'.toFixed is not a function
// out is typed as (a: string) => number, but at runtime it's (a: number = 1) => number.
// out('x') passes 'x' through the chain, the default (1) is never used, and 'x' (string) is returned.
```

With `--strictArity functiontype`, the assignment `mid → out` is caught at compile time:

```
error TS2322: Type '() => number' is not assignable to type '(a: string) => number'.
  Target signature provides too few arguments. Expected 0 or more, but got 1.
```

### The TypeScript Team's Position

The TypeScript team has discussed stricter parameter checking (see issues [#13043](https://github.com/Microsoft/TypeScript/issues/13043), [#20274](https://github.com/Microsoft/TypeScript/issues/20274), [#46881](https://github.com/microsoft/TypeScript/issues/46881), and PR [#42064](https://github.com/microsoft/TypeScript/pull/42064)), and their assessment is that a blanket restriction would be too disruptive. Too many idiomatic patterns depend on the current behavior.

This repository tests a different approach: **make it granular**. Instead of a single on/off switch, `--strictArity` lets you enable checking per syntactic kind, so you can tighten contracts (interfaces, class methods, call signatures) without touching callback-heavy code.

---

## The Solution

**`--strictArity`** is a compiler flag implemented in the [`strict-arity`](https://github.com/topce/typescript-go/tree/strict-arity) branch of [`topce/typescript-go`](https://github.com/topce/typescript-go), published to npm as [`@topce/native-preview`](https://www.npmjs.com/package/@topce/native-preview) — a fork of [microsoft/TypeScript](https://github.com/microsoft/TypeScript) (version 7.0.3).

### How It Works

The implementation modifies the **structural type compatibility checker** in the compiler (the `checkTypeRelatedTo` family of functions). When `--strictArity` is active for a given syntactic kind, the checker compares parameter counts between the source and target function types during assignability checks — a `checkStrictArity` guard that runs alongside existing variance checks.

The modification is additive: it introduces a new diagnostic path but does not alter existing type-resolution logic, emit output, or any other compiler behavior.

### Default Behavior

When `--strictArity` is not specified, the compiler behaves identically to upstream TypeScript — **zero behavioral change**. The flag defaults to `none`.

```typescript
type TakesTwo = (a: string, b: number) => void;

// Without --strictArity:  compiles (default TypeScript behavior)
// With --strictArity:     error TS2322
//   Target signature provides too few arguments.
//   Expected 1 or more, but got 2.
const fn: TakesTwo = (a: string) => {};
```

### Design Principles

| Principle | Description |
|-----------|-------------|
| **Opt-in** | Disabled by default. No impact unless explicitly enabled. |
| **Granular** | 10 independent syntactic kinds. Enable only what you need. |
| **Additive** | Never removes existing errors or alters emit — only adds new diagnostics. |
| **Standard diagnostics** | Uses existing TS error codes (TS2322, TS2416, TS2345) with descriptive messages. |

---

## Quick Start

```bash
npm install
npm test                      # Run all 19 flag/test combinations

# Compile with every kind enabled (12 errors on the test suite)
npx tsgo --noEmit --ignoreConfig --strictArity all test.ts

# Enable a specific subset
npx tsgo --noEmit --ignoreConfig --strictArity callsignature,methodsignature test.ts
```

---

## Supported Syntactic Kinds

The flag accepts a comma-separated list of kinds. Each corresponds to a distinct point in the assignability graph where parameter arity variance can occur.

| Kind | Checks | Example Pattern |
|------|--------|-----------------|
| `callsignature` | Call signature assignments | `interface F { (a: string, b: number): void }` |
| `constructsignature` | Constructor signature assignments | `interface C { new (a: string, b: number): {} }` |
| `methodsignature` | Interface method implementations | `class C implements I { foo(a: string) {} }` |
| `methoddeclaration` | Class/object method overrides | `class D extends B { foo(a: string) {} }` |
| `constructor` | Constructor parameter mismatches | `class D extends B { constructor(a) { super(a, 0); } }` |
| `functiondeclaration` | Function declarations used as types | `const f: typeof func = function(a) {}` |
| `functionexpression` | Function expressions with type context | `const f: T = function(a) {}` |
| `arrowfunction` | Arrow functions with type context | `const f: T = (a) => {}` |
| `functiontype` | Callback arguments and function-type assignments | `fn((a) => {})` |
| `constructortype` | Constructor-type assignments | `type C = new (a, b) => {}` |

> **Note:** `indexsignature`, `jsdocfunctiontype`, and `jsdocsignature` are intentionally excluded — they don't participate in function-parameter assignability pathways and have no corresponding strictness dimension.

### Presets

| Preset | Equivalent | Errors on `test.ts` |
|--------|-----------|---------------------|
| `all` / `true` | All 10 kinds | **11** |
| `none` / `false` | Disables everything | **0** |

### Recommended Starting Point

```bash
tsgo --strictArity methoddeclaration,methodsignature,callsignature,constructsignature
```

This enables the four **contract-facing kinds** — interface methods, class method overrides, call signatures, and constructor signatures — where parameter arity variance is most likely to indicate an unintentional mismatch. Callback-heavy kinds (`functiontype`, `functionexpression`, `arrowfunction`, `functiondeclaration`) are left at their default to preserve compatibility with `forEach`, `map`, event emitters, and similar APIs.

---

## Test Matrix

The test suite in `test.ts` contains **13 cases** covering all `StrictArity` kinds plus a chained-unsoundness regression from [#13043](https://github.com/Microsoft/TypeScript/issues/13043), a minimal callback-arity example from [#46881](https://github.com/microsoft/TypeScript/issues/46881), and a real-world interface-method parameter-shift example (also from [#46881](https://github.com/microsoft/TypeScript/issues/46881)). Each case assigns a function with *fewer required parameters* than its target type expects. The runner (`test.sh`) exercises 19 flag combinations and validates error counts.

### Single-Flag Isolation

Each flag tested in isolation — exactly that flag enabled, all others off:

| Flag | Case | Errors | Notes |
|------|------|--------|-------|
| `callsignature` | Call signature assignment | **1** | |
| `constructsignature` | Construct signature assignment | **1** | |
| `methodsignature` | Interface method implementation | **2** | |
| `methoddeclaration` | Class method override | **1** | |
| `constructor` | Derived class constructor | **0** | Derived-class constructors in TS 7.0.3 resolve through a different assignability path unaffected by this check |
| `functiondeclaration` | Function declaration as type | **1** | |
| `functionexpression` | Function expression assignment | **0** | Subsumed by `functiontype` — the type-level check fires first |
| `arrowfunction` | Arrow function assignment | **0** | Subsumed by `functiontype` — the type-level check fires first |
| `functiontype` | Callback & function-type assignments | **5** | Catches function expressions, arrow functions, callback arguments, chained-unsoundness through intermediate variables, and callback-with-fewer-params (#46881) |
| `constructortype` | Constructor type assignment | **1** | |

### Combinations

| Flags | Errors | Description |
|-------|--------|-------------|
| `all` / `true` | **12** | Full coverage |
| `none` / `false` | **0** | Baseline |
| `methoddeclaration,methodsignature,callsignature,constructsignature` | **5** | Contract-facing only |
| `functiontype,arrowfunction` | **5** | Overlap example — `functiontype` covers the same cases |
| `callsignature,methodsignature` | **3** | Minimal two-kind subset |
| `functiontype,methoddeclaration,functiondeclaration` | **7** | Mixed callback + declaration |

All **19 flag/test combinations** pass. Run `npm test` to reproduce.

### Error Codes Emitted

| Code | Context |
|------|---------|
| **TS2322** | Type not assignable (variable declarations, property assignments) |
| **TS2416** | Property in derived type not assignable to base type property |
| **TS2345** | Argument not assignable to parameter (callback arguments) |

---

## Architecture

```
parameter-arity-variance-is-not-correct/
├── test.ts            # 11 test cases (all StrictArity kinds + chained-unsoundness regression)
├── test.sh            # Test matrix runner (19 flag combinations)
├── LICENSE            # ISC
├── package.json       # Depends on @topce/native-preview (custom TS 7.0.3 compiler)
├── package-lock.json
├── tsconfig.json      # Standard TS 7.x project config
└── README.md
```

The compiler modification lives in the [`strict-arity`](https://github.com/topce/typescript-go/tree/strict-arity) branch of [`topce/typescript-go`](https://github.com/topce/typescript-go), published as [`@topce/native-preview`](https://github.com/topce/native-preview). This repository is the validation suite — it demonstrates correctness, characterizes flag interactions, and documents the flag's behavior across the full syntactic-kind matrix.

---

## FAQ

### Will this break `forEach`, `map`, and event handlers?

Possibly, if you enable `functiontype` or `arrowfunction`. The recommended preset explicitly excludes these kinds. Start with contract-facing kinds (5 errors) and progressively enable callback kinds as your codebase is audited.

### Is this compatible with upstream TypeScript?

Yes:
- Produces the same emit as upstream TypeScript
- Only adds diagnostics — never suppresses or alters existing ones
- Defaults to `--strictArity none` (no change in behavior)
- Accepts all standard `tsc`/`tsgo` flags
- Can be used as a drop-in replacement in any build pipeline

### Why does `constructor` produce 0 errors?

The `--strictArity constructor` flag instruments the standard type compatibility checker (`checkTypeRelatedTo`). However, constructor parameter compatibility in `extends` clauses is validated through `super()` call argument checking — a separate code path. The derived class constructor can have an entirely different signature from the base; only the arguments passed to `super()` matter. Because the flag instruments the wrong pathway, it is effectively a no-op in TS 7.0.3.

Use `--strictArity constructsignature` and `--strictArity constructortype` for constructor-type assignments — those flag the cases the `constructor` flag was intended to catch.

### Why are `indexsignature`, `jsdocfunctiontype`, and `jsdocsignature` excluded?

- **`indexsignature`** — Index signatures (`[key: string]: ValueType`) describe property-value mappings, not function parameter lists. There is no arity dimension to check.
- **`jsdocfunctiontype`** and **`jsdocsignature`** — JSDoc type annotations (`@type {function(string, number): void}`, `@param`) are resolved through JSDoc-specific pathways in the compiler, not through the standard type compatibility checker that `--strictArity` instruments. JSDoc-typed assignments are invisible to the current set of flags. Adding dedicated flags would require instrumenting the JSDoc type resolution code, which is a separate effort.

### Can I use this today?

Yes. Install `@topce/native-preview` and pass `--strictArity` with your chosen kinds. See [Quick Start](#quick-start).

---

## Related Work

- [TypeScript PR #42064](https://github.com/microsoft/TypeScript/pull/42064) — Prior attempt to add strict arity checking upstream (closed)
- [TypeScript Issue #13043](https://github.com/Microsoft/TypeScript/issues/13043) — Original feature request (2016)
- [TypeScript Issue #20274](https://github.com/Microsoft/TypeScript/issues/20274) — Function parameter bivariance discussion
- [TypeScript Issue #46881](https://github.com/microsoft/TypeScript/issues/46881) — Strict function parameter arity request (2022)
- [topce/typescript-go (strict-arity)](https://github.com/topce/typescript-go/tree/strict-arity) — The compiler branch implementing `--strictArity`
- [@topce/native-preview](https://github.com/topce/native-preview) — Published npm package of the fork

---

## License

ISC — see [LICENSE](LICENSE).
